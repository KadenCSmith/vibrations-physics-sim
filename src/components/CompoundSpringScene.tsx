import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { compoundDeformation, type Model, type Parameters, type Snapshot } from '../physics/model';
import './CompoundSpringScene.css';

type Point = [number, number];
export type CompoundSpringSceneProps = {
  parameters: Parameters;
  model: Model;
  snapshot: Snapshot;
  labels: boolean;
  forces: boolean;
  onDrag: (value: number) => void;
  onRelease: () => void;
  onBeginDrag: () => void;
};

function coil(start: Point, end: Point, turns = 6): string {
  const length = end[1] - start[1];
  const lead = Math.min(9, Math.abs(length) * .13);
  const direction = Math.sign(length) || 1;
  const points: Point[] = [start, [start[0], start[1] + direction * lead]];
  for (let i = 0; i <= turns * 12; i++) {
    const fraction = i / (turns * 12);
    points.push([start[0] + 7 * Math.sin(fraction * 2 * Math.PI * turns),
      start[1] + direction * lead + fraction * (length - direction * 2 * lead)]);
  }
  points.push(end);
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function Spring({ x, top, bottom, extension, label, labelX, showLabels, turns = 6 }: {
  x: number; top: number; bottom: number; extension: number; label: string;
  labelX: number; showLabels: boolean; turns?: number;
}) {
  const color = Math.abs(extension) < .0005 ? '#aaa' : extension > 0 ? '#e8b18a' : '#a8bfff';
  return <g className="compound-spring-scene__spring">
    <path d={coil([x, top], [x, bottom], turns)} stroke={color} />
    {showLabels && <text x={labelX} y={(top + bottom) / 2 + 4} fill={color}>{label}</text>}
  </g>;
}

const signed = (value: number, digits = 3) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
const clamp = (value: number) => Math.max(-.25, Math.min(.25, value));

/** Seven physical springs; every moving endpoint follows its solved node displacement. */
export function CompoundSpringScene({ parameters: p, model, snapshot: s, labels, forces, onDrag, onRelease, onBeginDrag }: CompoundSpringSceneProps) {
  const svg = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const dragScale = useRef(168);
  const [dragging, setDragging] = useState(false);
  const patternId = `compound-grid-${useId().replace(/:/g, '')}`;
  const scale = dragging ? dragScale.current : Math.min(230, 42 / Math.max(model.xAmplitude, .25));
  const deformation = compoundDeformation(p, s.x);
  const upperY = 117 + deformation.upperJunction * scale;
  const lowerY = 179 + deformation.lowerJunction * scale;
  const collectorY = 241 + deformation.collector * scale;
  const bobY = 340 + s.x * scale;
  const ext = deformation.extensions;
  const pointerPoint = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    const point = pointerPoint(event);
    if (point) onDrag(clamp((point.y - 340) / dragScale.current));
  };
  const release = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    onRelease();
  };
  const keyboard = (event: KeyboardEvent<SVGGElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    onBeginDrag();
    const positive = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    onDrag(clamp(p.x0 + (positive ? .01 : -.01)));
    onRelease();
  };
  const forceLength = Math.min(62, Math.max(13, Math.abs(s.force) * 3));
  const forceEnd = bobY + Math.sign(s.force) * forceLength;
  const forceDirection = Math.sign(s.force);

  return <div className={`scene-wrap compound-spring-scene-wrap${dragging ? ' is-dragging' : ''}`}>
    <svg ref={svg} className="vibration-scene compound-spring-scene" viewBox="0 0 760 430"
      role="group" aria-label="Animated seven-spring compound network. Drag the bottom mass vertically to set its release displacement."
      onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <defs><pattern id={patternId} width="38" height="38" patternUnits="userSpaceOnUse">
        <path d="M38 0H0V38" fill="none" stroke="#181818" strokeWidth=".6" />
      </pattern></defs>
      <rect width="760" height="430" fill={`url(#${patternId})`} />
      <text x="25" y="29" className="scene-eyebrow">COMPOUND NETWORK / ONE DEGREE OF FREEDOM</text>

      <path d="M231 55H518" className="fixed-support" />
      {[240, 265, 290, 315, 340, 365, 390, 415, 440, 465, 490, 515].map(x =>
        <path key={x} d={`M${x} 55l8 -8`} className="compound-spring-scene__hatch" />)}

      <Spring x={260} top={55} bottom={upperY} extension={ext[0]} label="k₁" labelX={228} showLabels={labels} />
      <Spring x={340} top={55} bottom={upperY} extension={ext[1]} label="k₁" labelX={357} showLabels={labels} />
      <path d={`M247 ${upperY}H353`} className="compound-spring-scene__junction" />
      <Spring x={300} top={upperY} bottom={lowerY} extension={ext[2]} label="k₂" labelX={318} showLabels={labels} />
      <path d={`M247 ${lowerY}H353`} className="compound-spring-scene__junction" />
      <Spring x={260} top={lowerY} bottom={collectorY} extension={ext[3]} label="k₃" labelX={228} showLabels={labels} />
      <Spring x={340} top={lowerY} bottom={collectorY} extension={ext[4]} label="k₃" labelX={357} showLabels={labels} />
      <Spring x={500} top={55} bottom={collectorY} extension={ext[5]} label="k₄" labelX={520} showLabels={labels} turns={13} />
      <path d={`M247 ${collectorY}H512`} className="compound-spring-scene__collector" />
      <Spring x={405} top={collectorY} bottom={bobY - 23} extension={ext[6]} label="k₅" labelX={424} showLabels={labels} turns={7} />

      <path d="M354 340H652" className="equilibrium-line" />
      <g role="slider" tabIndex={0} aria-label="Compound network mass release displacement"
        aria-valuemin={-.25} aria-valuemax={.25} aria-valuenow={p.x0}
        aria-valuetext={`${signed(p.x0)} metres, positive downward`}
        aria-orientation="vertical" onKeyDown={keyboard}
        onPointerDown={event => {
          event.preventDefault();
          dragScale.current = scale;
          draggingRef.current = true;
          svg.current?.setPointerCapture(event.pointerId);
          setDragging(true);
          onBeginDrag();
        }} className="draggable-mass compound-spring-scene__mass">
        <rect x="364" y={bobY - 28} width="82" height="56" rx="3" className="mass-hit-target" />
        <rect x="369" y={bobY - 23} width="72" height="46" rx="2" className="mass-outline" />
        <text x="405" y={bobY + 6} textAnchor="middle" className="mass-symbol">m</text>
      </g>

      {labels && <>
        <text x="185" y={upperY + 4} className="compound-spring-scene__node-label">A</text>
        <text x="185" y={lowerY + 4} className="compound-spring-scene__node-label">B</text>
        <text x="550" y={collectorY + 4} className="compound-spring-scene__node-label">C</text>
        <text x="26" y="74" className="svg-muted">two identical k₁</text>
        <text x="26" y="95" className="svg-muted">then k₂</text>
        <text x="26" y="116" className="svg-muted">then two identical k₃</text>
        <text x="26" y="149" className="svg-muted">left branch ∥ k₄</text>
        <text x="26" y="172" className="svg-muted">then k₅ to the mass</text>
        <text x="26" y="219" className="svg-muted">massless junctions</text>
        <text x="26" y="239" className="compound-spring-scene__node-value">A: {signed(deformation.upperJunction)} m</text>
        <text x="26" y="258" className="compound-spring-scene__node-value">B: {signed(deformation.lowerJunction)} m</text>
        <text x="26" y="277" className="compound-spring-scene__node-value">C: {signed(deformation.collector)} m</text>
        <text x="541" y="330" className="svg-muted">equilibrium</text>
      </>}
      <line x1="640" y1="284" x2="640" y2="403" stroke="#666" />
      <path d="M636 397L640 404L644 397" fill="none" stroke="#666" />
      {[-.2, -.1, 0, .1, .2].map(tick => <g key={tick}>
        <line x1="635" x2="645" y1={340 + tick * scale} y2={340 + tick * scale} stroke="#666" />
        <text x="654" y={344 + tick * scale} className="svg-muted">{tick === 0 ? '0' : signed(tick, 1)}</text>
      </g>)}
      <circle cx="640" cy={bobY} r="4" fill="#e8b18a" />
      <text x="621" y="422" className="svg-muted">x (m) ↓</text>

      {forces && Math.abs(s.force) > .001 && <g className="compound-spring-scene__force">
        <line x1="468" y1={bobY} x2="468" y2={forceEnd} />
        <path d={`M463 ${forceEnd - forceDirection * 7}L468 ${forceEnd}L473 ${forceEnd - forceDirection * 7}`} />
        <text x="488" y={bobY + 4}>F₅ = {signed(s.force, 2)} N</text>
      </g>}
      <text x="26" y="389" className="svg-muted">{model.massless ? 'Zero mass: static spring constraint' : 'Drag the mass vertically to set its release'}</text>
      <text x="26" y="409" className="svg-muted">{forces ? 'Only k₅ acts directly on the mass' : 'All node motion follows the spring force balance'}</text>
    </svg>
    <div className="scene-legend"><span><i className="legend-stretch" /> additional stretch</span><span><i className="legend-compress" /> additional compression</span><span>relative to equilibrium</span></div>
  </div>;
}

export default CompoundSpringScene;
