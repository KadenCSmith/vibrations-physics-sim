import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Model, Parameters, Snapshot } from '../physics/model';
import './InvertedPendulumScene.css';

type Point = [number, number];
export type InvertedPendulumSceneProps = {
  parameters: Parameters; model: Model; snapshot: Snapshot;
  labels: boolean; forces: boolean;
  onDrag: (value: number) => void; onRelease: () => void; onBeginDrag: () => void;
};
const limitDeg = 12;
const limitRad = limitDeg * Math.PI / 180;
const clampDegrees = (angle: number) => Math.max(-limitDeg, Math.min(limitDeg, angle));
const signed = (n: number, digits = 2) => `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;

function coil(from: Point, to: Point): string {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const lead = Math.min(14, length * .12);
  const points: Point[] = [from, [from[0] + lead * ux, from[1] + lead * uy]];
  for (let i = 0; i <= 128; i++) {
    const fraction = i / 128, distance = lead + (length - 2 * lead) * fraction;
    const wave = 7 * Math.sin(fraction * 16 * Math.PI);
    points.push([from[0] + distance * ux - wave * uy, from[1] + distance * uy + wave * ux]);
  }
  points.push(to);
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function Spring({ from, to, extension, name, showLabel, labelAt }: {
  from: Point; to: Point; extension: number; name: string; showLabel: boolean; labelAt: Point;
}) {
  const color = Math.abs(extension) < .0005 ? '#aaa' : extension > 0 ? '#e8b18a' : '#a8bfff';
  return <g className="inverted-pendulum-scene__spring">
    <path d={coil(from, to)} stroke={color} />
    {showLabel && <text x={labelAt[0]} y={labelAt[1]} textAnchor="middle" fill={color}>{name}</text>}
  </g>;
}

function Arrow({ from, to, label, labelAt, className }: {
  from: Point; to: Point; label: string; labelAt: Point; className: string;
}) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head1: Point = [to[0] - 7 * Math.cos(angle - .45), to[1] - 7 * Math.sin(angle - .45)];
  const head2: Point = [to[0] - 7 * Math.cos(angle + .45), to[1] - 7 * Math.sin(angle + .45)];
  return <g className={`inverted-pendulum-scene__arrow ${className}`}>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
    <path d={`M${head1.join(',')}L${to.join(',')}L${head2.join(',')}`} />
    <text x={labelAt[0]} y={labelAt[1]}>{label}</text>
  </g>;
}

/** Massive uniform rod pivoted below, with two identical springs at its upper end. */
export function InvertedPendulumScene({ parameters: p, model, snapshot: s, labels, forces, onDrag, onRelease, onBeginDrag }: InvertedPendulumSceneProps) {
  const svg = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const patternId = `inverted-grid-${useId().replace(/:/g, '')}`;
  const pivot: Point = [400, 344];
  const rodPixels = 230;
  const theta = Math.max(-limitRad, Math.min(limitRad, s.theta));
  const top: Point = [pivot[0] + rodPixels * Math.sin(theta), pivot[1] - rodPixels * Math.cos(theta)];
  const cg: Point = [(pivot[0] + top[0]) / 2, (pivot[1] + top[1]) / 2];
  const uprightTop = pivot[1] - rodPixels;
  const normal: Point = [Math.cos(theta), Math.sin(theta)];
  const lengthStart: Point = [pivot[0] - 62 * normal[0], pivot[1] - 62 * normal[1]];
  const lengthEnd: Point = [top[0] - 62 * normal[0], top[1] - 62 * normal[1]];
  const halfStart: Point = [pivot[0] + 37 * normal[0], pivot[1] + 37 * normal[1]];
  const halfEnd: Point = [cg[0] + 37 * normal[0], cg[1] + 37 * normal[1]];
  const springCoefficient = 2 * p.k * p.l ** 2;
  const gravityCoefficient = p.m * p.g * p.l / 2;
  const stiffness = springCoefficient - gravityCoefficient;
  const tolerance = 1e-10 * Math.max(1, springCoefficient, gravityCoefficient);
  const stability = p.m === 0 ? (p.k === 0 ? 'NO UNIQUE ANGLE' : 'STATIC CONSTRAINT')
    : stiffness > tolerance ? 'STABLE · SPRINGS WIN' : stiffness < -tolerance ? 'UNSTABLE · GRAVITY WINS' : 'NEUTRAL · BALANCED';
  const displayedAtLimit = Math.abs(s.theta) > limitRad + 1e-7;

  const point = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    const cursor = point(event);
    if (cursor) onDrag(clampDegrees(Math.atan2(cursor.x - pivot[0], pivot[1] - cursor.y) * 180 / Math.PI));
  };
  const release = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    onRelease();
  };
  const keyboard = (event: KeyboardEvent<SVGGElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    onBeginDrag();
    const positive = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    onDrag(clampDegrees(p.theta0Deg + (positive ? .5 : -.5)));
    onRelease();
  };

  return <div className={`scene-wrap inverted-pendulum-scene-wrap${dragging ? ' is-dragging' : ''}`}>
    <svg ref={svg} className="vibration-scene inverted-pendulum-scene" viewBox="0 0 760 430"
      role="group" aria-label="Inverted uniform rod with a bottom pivot, center of mass halfway along the rod, and one identical horizontal spring on each side of its top. Drag the top to choose the release angle."
      onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <defs><pattern id={patternId} width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#181818" strokeWidth=".6" /></pattern></defs>
      <rect width="760" height="430" fill={`url(#${patternId})`} />
      <text x="25" y="28" className="scene-eyebrow">INVERTED UNIFORM BAR / SMALL-ANGLE MOTION</text>
      <text x="25" y="48" className="inverted-pendulum-scene__stability">{stability}</text>
      <path d="M164 77V151M636 77V151" className="fixed-support" />
      {[84, 101, 118, 135].map(y => <g key={y} className="inverted-pendulum-scene__wall-hatch">
        <path d={`M164 ${y}l-9 -6M636 ${y}l9 -6`} />
      </g>)}
      <path d={`M400 90V368M351 ${uprightTop}H449`} className="equilibrium-line" />
      <Spring from={[164, uprightTop]} to={top} extension={s.x} name="k · left spring" showLabel={labels} labelAt={[270, 88]} />
      <Spring from={top} to={[636, uprightTop]} extension={-s.x} name="k · right spring" showLabel={labels} labelAt={[534, 88]} />

      <line x1={pivot[0]} y1={pivot[1]} x2={top[0]} y2={top[1]} className="inverted-pendulum-scene__bar" />
      <line x1={pivot[0]} y1={pivot[1]} x2={top[0]} y2={top[1]} className="inverted-pendulum-scene__bar-center" />
      <circle cx={cg[0]} cy={cg[1]} r="5.5" className="inverted-pendulum-scene__cg" />
      <path d="M386 362L400 344L414 362Z" className="inverted-pendulum-scene__pivot-support" />
      <path d="M377 366H423" className="fixed-support" />
      <circle cx={pivot[0]} cy={pivot[1]} r="6" className="inverted-pendulum-scene__pivot" />

      <g role="slider" tabIndex={0} aria-label="Inverted rod release angle" aria-valuemin={-12} aria-valuemax={12}
        aria-valuenow={clampDegrees(p.theta0Deg)} aria-valuetext={`${signed(clampDegrees(p.theta0Deg), 1)} degrees from upright`}
        onKeyDown={keyboard} className="draggable-mass inverted-pendulum-scene__handle"
        onPointerDown={event => {
          event.preventDefault(); draggingRef.current = true; setDragging(true);
          svg.current?.setPointerCapture(event.pointerId); onBeginDrag();
        }}>
        <circle cx={top[0]} cy={top[1]} r="23" className="inverted-pendulum-scene__hit-target" />
        <circle cx={top[0]} cy={top[1]} r="5.5" className="inverted-pendulum-scene__top-node" />
      </g>

      {labels && <>
        <text x="425" y="369" className="geometry-label">O · fixed pivot</text>
        <text x={cg[0] + 18} y={cg[1] - 9} className="geometry-label">CG · m</text>
        <path d={`M${cg[0] + 4} ${cg[1]}H${cg[0] + 15}`} stroke="#929292" />
        <line x1={lengthStart[0]} y1={lengthStart[1]} x2={lengthEnd[0]} y2={lengthEnd[1]} className="inverted-pendulum-scene__dimension" />
        {[lengthStart, lengthEnd].map(([x, y], i) => <path key={i} d={`M${x-4} ${y}H${x+4}`} className="inverted-pendulum-scene__dimension" />)}
        <text x={lengthEnd[0] - 90} y={lengthEnd[1] + 33} className="geometry-label">ℓ = {p.l.toFixed(2)} m</text>
        <line x1={halfStart[0]} y1={halfStart[1]} x2={halfEnd[0]} y2={halfEnd[1]} className="inverted-pendulum-scene__dimension" />
        <text x={(halfStart[0] + halfEnd[0]) / 2 + 12} y={(halfStart[1] + halfEnd[1]) / 2 + 4} className="geometry-label">ℓ/2</text>
        <path d={`M400 289A55 55 0 0 ${theta >= 0 ? 1 : 0} ${400 + 55 * Math.sin(theta)} ${344 - 55 * Math.cos(theta)}`} className="inverted-pendulum-scene__angle" />
        <text x="470" y="316" fill="#e8b18a" fontSize="12">θ = {signed(theta * 180 / Math.PI, 1)}°</text>
        <text x="26" y="177" className="svg-muted">mass distributed along rod</text>
        <text x="26" y="199" className="svg-muted">J₀ = mℓ² / 3</text>
        <text x="26" y="242" className="svg-muted">top: x ≈ ℓθ</text>
        <text x="26" y="264" className="svg-muted">CG: x_CG ≈ ℓθ / 2</text>
        <text x="26" y="304" className="svg-muted">two springs, each stiffness k</text>
      </>}

      {forces && <>
        {p.m * p.g > 0 && <Arrow from={cg} to={[cg[0], cg[1] + 63]}
          label={`mg = ${(p.m * p.g).toFixed(2)} N`} labelAt={[cg[0] + 100, cg[1] + 65]} className="inverted-pendulum-scene__gravity" />}
        {Math.abs(s.springForce) > .0001 && <Arrow from={[top[0], top[1] - 30]}
          to={[top[0] + Math.sign(s.springForce) * Math.min(87, Math.max(25, Math.abs(s.springForce) * 7)), top[1] - 30]}
          label={`2Fₛ = ${signed(s.springForce)} N`} labelAt={[top[0] - 49, top[1] - 43]} className="inverted-pendulum-scene__restoring" />}
        <text x="520" y="204" className="inverted-pendulum-scene__torque-gravity">τg = {signed(s.gravityTorque)} N·m</text>
        <text x="520" y="225" className="inverted-pendulum-scene__torque-spring">τs = {signed(s.springTorque)} N·m</text>
      </>}
      <text x="26" y="389" className="svg-muted">{model.massless ? 'Zero mass: static constraint; no angular dynamics' : displayedAtLimit ? 'Drawing held at the ±12° small-angle limit' : 'Drag the top · release from rest · ±12°'}</text>
      <text x="26" y="410" className="svg-muted">Drawing: x_top = ℓ sin θ · motion uses x ≈ ℓθ</text>
    </svg>
    <div className="scene-legend"><span><i className="legend-stretch" /> additional stretch</span><span><i className="legend-compress" /> additional compression</span><span>each spring stiffness = k</span></div>
  </div>;
}

export default InvertedPendulumScene;
