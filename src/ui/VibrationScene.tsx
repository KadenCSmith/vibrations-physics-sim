import { useRef, useState, type PointerEvent } from 'react'
import type { Model, Parameters, ProblemId, Snapshot } from '../physics/model'

type Point = [number, number]
function coilPath(start: Point, end: Point, coils = 8, width = 8) {
  const dx = end[0] - start[0], dy = end[1] - start[1], len = Math.hypot(dx, dy)
  if (len < 1) return ''
  const ux = dx / len, uy = dy / len, lead = Math.min(12, len * .1)
  const points: Point[] = [start, [start[0] + ux * lead, start[1] + uy * lead]]
  for (let i = 0; i <= coils * 16; i++) {
    const s = i / (coils * 16), d = lead + (len - 2 * lead) * s, off = Math.sin(s * Math.PI * 2 * coils) * width
    points.push([start[0] + ux * d - uy * off, start[1] + uy * d + ux * off])
  }
  points.push(end)
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
}
function Spring({ from, to, extension, label, labelAt, showLabels }: { from: Point; to: Point; extension: number; label: string; labelAt: Point; showLabels: boolean }) {
  const color = Math.abs(extension) < .0005 ? '#aaa' : extension > 0 ? '#e8b18a' : '#a8bfff'
  return <g><path d={coilPath(from, to)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />{showLabels && <text x={labelAt[0]} y={labelAt[1]} className="spring-label" fill={color}>{label}</text>}</g>
}
function ForceArrow({ start, end, color, label, labelAt }: { start: Point; end: Point; color: string; label: string; labelAt: Point }) {
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]), head = 7
  const points = [end, [end[0] - head * Math.cos(angle - .45), end[1] - head * Math.sin(angle - .45)], [end[0] - head * Math.cos(angle + .45), end[1] - head * Math.sin(angle + .45)]]
  return <g className="force-vector"><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth="1.5"/><polygon points={points.map(p => p.join(',')).join(' ')} fill={color}/><text x={labelAt[0]} y={labelAt[1]} fill={color} fontSize="11">{label}</text></g>
}
const signed = (n: number, digits = 3) => `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`
export default function VibrationScene({ problem, parameters: p, model, snapshot: s, labels, forces, onDrag, onRelease, onBeginDrag }: {
  problem: ProblemId; parameters: Parameters; model: Model; snapshot: Snapshot; labels: boolean; forces: boolean;
  onDrag: (value: number) => void; onRelease: () => void; onBeginDrag: () => void
}) {
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const pendulumScale = Math.min(175, 240 / p.l), pivot: Point = [440, 65]
  const restY = pivot[1] + p.l * pendulumScale
  const bob: Point = [pivot[0] + p.l * Math.sin(s.theta) * pendulumScale, pivot[1] + p.l * Math.cos(s.theta) * pendulumScale]
  const networkScale = Math.min(330, 88 / Math.max(model.xAmplitude, .25)), networkY = 212 + s.x * networkScale
  const junctionY = 307 + s.seriesJunction * networkScale
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svg.current?.getScreenCTM()
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null
  }
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const pt = point(event)
    if (!pt) return
    if (problem === 'pendulum') onDrag(Math.max(-12, Math.min(12, Math.atan2(pt.x - pivot[0], pt.y - pivot[1]) * 180 / Math.PI)))
    else onDrag(Math.max(-.25, Math.min(.25, (pt.y - 212) / networkScale)))
  }
  const release = () => { if (dragging) { setDragging(false); onRelease() } }
  const massKeyboard = (event: React.KeyboardEvent<SVGGElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault(); onBeginDrag()
    const positive = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    onDrag(problem === 'pendulum' ? Math.max(-12, Math.min(12, p.theta0Deg + (positive ? .5 : -.5))) : Math.max(-.25, Math.min(.25, p.x0 + (positive ? .01 : -.01))))
  }
  return <div className={`scene-wrap ${dragging ? 'is-dragging' : ''}`}>
    <svg ref={svg} className="vibration-scene" viewBox="0 0 760 430" role="img" aria-label={problem === 'pendulum' ? 'Animated spring pendulum. Drag the mass to choose the release angle.' : 'Animated five-spring network. Drag the block to choose the release displacement.'} onPointerMove={move} onPointerUp={release} onPointerCancel={() => { setDragging(false) }}>
      <defs><pattern id="scene-grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#181818" strokeWidth=".6"/></pattern></defs>
      <rect width="760" height="430" fill="url(#scene-grid)" />
      <text x="25" y="29" className="scene-eyebrow">{problem === 'pendulum' ? 'ANGULAR MOTION / ONE DEGREE OF FREEDOM' : 'VERTICAL MOTION / ONE DEGREE OF FREEDOM'}</text>
      {problem === 'pendulum' ? <g>
        <path d={`M190 ${restY + 29}V43H490`} className="fixed-support"/>
        <path d={`M440 65V${restY + 35}`} className="equilibrium-line"/>
        <path d={`M415 ${restY}H${bob[0] + 30}`} className="equilibrium-line"/>
        <line x1={pivot[0]} y1={pivot[1]} x2={bob[0]} y2={bob[1]} className="pendulum-rod"/>
        <circle cx={pivot[0]} cy={pivot[1]} r="5" fill="#ddd"/>
        <Spring from={[190, restY]} to={[bob[0] - 24, bob[1]]} extension={s.x} label="k" labelAt={[267, restY - 21]} showLabels={labels}/>
        {labels && <>
          <text x="455" y="58" className="geometry-label">O</text>
          <text x="470" y={pivot[1] + (restY - pivot[1]) * .45} className="geometry-label">L = {p.l.toFixed(2)} m</text>
          <path d={`M440 123 A58 58 0 0 ${s.theta >= 0 ? 0 : 1} ${440 + 58 * Math.sin(s.theta)} ${65 + 58 * Math.cos(s.theta)}`} fill="none" stroke="#e8b18a"/>
          <text x="478" y="129" fill="#e8b18a" fontSize="12">θ = {signed(s.theta * 180 / Math.PI, 1)}°</text>
          <text x="450" y={restY + 50} className="svg-muted">equilibrium</text>
        </>}
        <g role="slider" tabIndex={0} aria-label="Pendulum release angle" aria-valuemin={-12} aria-valuemax={12} aria-valuenow={p.theta0Deg} onKeyDown={massKeyboard} onPointerDown={event => { event.preventDefault(); svg.current?.setPointerCapture(event.pointerId); setDragging(true); onBeginDrag() }} className="draggable-mass">
          <circle cx={bob[0]} cy={bob[1]} r="25" className="mass-outline"/><circle cx={bob[0]} cy={bob[1]} r="36" className="mass-hit-target"/>
          <text x={bob[0]} y={bob[1] + 5} textAnchor="middle" className="mass-symbol">m</text>
        </g>
        {forces && Math.abs(s.x) > .0004 && <ForceArrow start={[bob[0], bob[1] + 39]} end={[bob[0] + Math.max(-98, Math.min(98, s.force * 12)), bob[1] + 39]} color="#6ee7c9" label={`Fₓ = ${signed(s.force, 2)} N`} labelAt={[bob[0] - 44, bob[1] + 62]}/>}
        <line x1="255" y1="384" x2="625" y2="384" stroke="#555"/>
        <line x1="440" y1="376" x2="440" y2="393" stroke="#888"/>
        <text x="433" y="409" className="svg-muted">0</text><text x="631" y="388" className="svg-muted">x (m)</text>
        <line x1={440 + s.x * pendulumScale} y1="378" x2={440 + s.x * pendulumScale} y2="390" stroke="#e8b18a" strokeWidth="3"/>
        <text x="26" y="397" className="svg-muted">x ≈ Lθ</text><text x="26" y="414" className="svg-muted">Small-angle model · ±12°</text>
      </g> : <g>
        <line x1="253" y1="68" x2="510" y2="68" className="fixed-support"/>
        <line x1="253" y1="388" x2="510" y2="388" className="fixed-support"/>
        <line x1="242" y1="212" x2="536" y2="212" className="equilibrium-line"/>
        <Spring from={[306, 68]} to={[306, networkY - 24]} extension={s.branchExtensions[0]} label="k₁" labelAt={[269, 126]} showLabels={labels}/>
        <Spring from={[456, 68]} to={[456, networkY - 24]} extension={s.branchExtensions[1]} label="k₂" labelAt={[477, 126]} showLabels={labels}/>
        <Spring from={[306, networkY + 24]} to={[306, 388]} extension={s.branchExtensions[2]} label="k₃" labelAt={[269, 324]} showLabels={labels}/>
        <Spring from={[456, networkY + 24]} to={[456, junctionY]} extension={s.branchExtensions[3]} label="k₄" labelAt={[477, (networkY + 24 + junctionY) / 2 + 4]} showLabels={labels}/>
        <Spring from={[456, junctionY]} to={[456, 388]} extension={s.branchExtensions[4]} label="k₅" labelAt={[477, (388 + junctionY) / 2 + 4]} showLabels={labels}/>
        <circle cx="456" cy={junctionY} r="4.5" fill="#6ee7c9"/>
        <g role="slider" tabIndex={0} aria-label="Mass release displacement" aria-valuemin={-.25} aria-valuemax={.25} aria-valuenow={p.x0} onKeyDown={massKeyboard} onPointerDown={event => { event.preventDefault(); svg.current?.setPointerCapture(event.pointerId); setDragging(true); onBeginDrag() }} className="draggable-mass">
          <rect x="273" y={networkY - 24} width="216" height="48" rx="2" className="mass-outline"/>
          <text x="381" y={networkY + 6} textAnchor="middle" className="mass-symbol">m</text>
        </g>
        <line x1="599" y1="88" x2="599" y2="375" stroke="#666"/>
        {[-.2,-.1,0,.1,.2].map(value => <g key={value}><line x1="593" x2="605" y1={212 + value * networkScale} y2={212 + value * networkScale} stroke="#666"/><text x="613" y={216 + value * networkScale} className="svg-muted">{value ? signed(value, 1) : '0'}</text></g>)}
        <text x="588" y="410" className="svg-muted">x (m) ↓</text>
        <circle cx="599" cy={networkY} r="4" fill="#e8b18a"/>
        {labels && <><text x="29" y="83" className="svg-muted">fixed ceiling</text><text x="29" y="392" className="svg-muted">fixed floor</text><text x="29" y="212" className="svg-muted">static equilibrium</text><text x="29" y="285" fill="#6ee7c9" fontSize="12">series junction</text><text x="29" y="305" className="svg-muted">y = {signed(s.seriesJunction)} m</text><text x="29" y="325" className="svg-muted">k₄Δℓ₄ = k₅Δℓ₅</text></>}
        {forces && Math.abs(s.force) > .001 && <ForceArrow start={[534, networkY]} end={[534, networkY + Math.max(-83, Math.min(83, s.force * 4))]} color="#6ee7c9" label={`ΣF = ${signed(s.force, 2)} N`} labelAt={[508, networkY - 100]}/>}
      </g>}
    </svg>
    <div className="scene-legend"><span><i className="legend-stretch"/> additional stretch</span><span><i className="legend-compress"/> additional compression</span><span>relative to equilibrium</span></div>
  </div>
}
