import { useMemo, useState, type PointerEvent } from 'react'
import { sampleModel, type Model, type Parameters, type ProblemId, type Snapshot, type PendulumMode } from '../physics/model'

type Kind = 'x' | 'v' | 'a' | 'phase'
const COLORS = {x:'#e8b18a',v:'#a8bfff',a:'#6ee7c9',phase:'#c1a8f0'}
export default function ResponseChart({ problem, parameters, model, snapshot, duration, mode='linear', onSeek }: {problem:ProblemId;parameters:Parameters;model:Model;snapshot:Snapshot;duration:number;mode?:PendulumMode;onSeek:(time:number)=>void}) {
  const [kind,setKind] = useState<Kind>('x')
  const [scrubbing,setScrubbing] = useState(false)
  const W=760,H=187,left=54,right=738,top=18,bottom=155
  const angular=problem==='inverted'
  const samples=useMemo(()=>Array.from({length:401},(_,i)=>{
    const t=duration*i/400
    return sampleModel(problem,parameters,angular?Math.min(t,model.smallAngleEndTime??Infinity):t,mode)
  }),[problem,parameters,duration,mode,angular,model.smallAngleEndTime])
  const position=(s:Snapshot)=>angular?s.theta:s.x
  const value=(s:Snapshot)=>kind==='x'?position(s):kind==='v'||kind==='phase'?(angular?s.thetaDot:s.v):(angular?s.thetaDDot:s.a)
  const amplitude = Math.max(angular?Math.max(...samples.map(s=>Math.abs(s.theta))):model.xAmplitude,.0001)
  const maxY = Math.max(angular?Math.max(...samples.map(s=>Math.abs(value(s))))*1.2:amplitude * (kind === 'v' || kind === 'phase' ? model.omega : kind === 'a' ? model.omega ** 2 : 1) * 1.2, .001)
  const y = (value:number) => (top+bottom)/2 - value/maxY*(bottom-top)/2
  const x = (time:number) => left+(right-left)*time/duration
  const phaseX = (value:number) => (left+right)/2+value/(amplitude*1.2)*(right-left)/2
  const points = samples.map((s,i) => {
    const t=duration*i/400
    const plotX=kind==='phase'?(left+right)/2+position(s)/(amplitude*1.2)*(right-left)/2:left+(right-left)*t/duration
    const plotValue=value(s)
    const plotY=(top+bottom)/2-plotValue/maxY*(bottom-top)/2
    return `${i?'L':'M'}${plotX.toFixed(2)},${plotY.toFixed(2)}`
  }).join(' ')
  const units=angular?(kind==='x'?'rad':kind==='a'?'rad/s²':'rad/s'):(kind==='x'?'m':kind==='a'?'m/s²':'m/s')
  const quantity=angular?(kind==='x'?'θ':kind==='a'?'θ̈':'θ̇'):(kind==='phase'?'v':kind)
  const seek=(event:PointerEvent<SVGSVGElement>) => {
    if(kind==='phase')return
    const matrix=event.currentTarget.getScreenCTM()
    if(!matrix)return
    const pt=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse())
    onSeek(Math.max(0,Math.min(duration,(pt.x-left)/(right-left)*duration)))
  }
  return <section className="response-chart" aria-label="Motion graph">
    <header><div><span className="eyebrow">RESPONSE</span><span className="chart-title">{kind==='phase'?angular?'Angle meets angular velocity':'Position meets velocity':'The same motion, plotted in time'}</span></div><nav aria-label="Graph quantity">{(['x','v','a','phase'] as Kind[]).map(item=><button key={item} aria-pressed={kind===item} onClick={()=>setKind(item)}>{item==='phase'?'phase':angular?(item==='x'?'θ':item==='v'?'θ̇':'θ̈'):item}</button>)}</nav></header>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${kind==='phase'?'Phase-space':kind==='x'?angular?'Angular displacement':'Displacement':kind==='v'?angular?'Angular velocity':'Velocity':angular?'Angular acceleration':'Acceleration'} graph. ${kind==='phase'?'':'Click or drag to scrub time.'}`} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);setScrubbing(true);seek(event)}} onPointerMove={event=>{if(scrubbing)seek(event)}} onPointerUp={()=>setScrubbing(false)} onPointerCancel={()=>setScrubbing(false)}>
      <defs><clipPath id="plot-clip"><rect x={left} y={top} width={right-left} height={bottom-top}/></clipPath></defs>
      {Array.from({length:9},(_,i)=><line key={`v${i}`} x1={left+(right-left)*i/8} x2={left+(right-left)*i/8} y1={top} y2={bottom} stroke="#222" strokeWidth=".6"/>)}
      {[-1,-.5,0,.5,1].map(v=><g key={v}><line x1={left} x2={right} y1={y(v*maxY)} y2={y(v*maxY)} stroke={v===0?'#555':'#222'} strokeWidth=".6"/><text x={left-10} y={y(v*maxY)+3} textAnchor="end" className="plot-label">{(v*maxY).toFixed(Math.abs(maxY)<.1?3:2)}</text></g>)}
      {Array.from({length:5},(_,i)=><text key={i} x={left+(right-left)*i/4} y={bottom+17} textAnchor="middle" className="plot-label">{kind==='phase'?((i/2-1)*amplitude*1.2).toFixed(3):(duration*i/4).toFixed(2)}</text>)}
      <text x="5" y="10" className="plot-label">{quantity} ({units})</text><text x={right} y="184" textAnchor="end" className="plot-label">{kind==='phase'?angular?'θ (rad)':'x (m)':'t (s)'}</text>
      <path d={points} stroke={COLORS[kind]} fill="none" strokeWidth="1.8" opacity=".7" clipPath="url(#plot-clip)"/>
      {kind!=='phase'&&<line x1={x(snapshot.time)} x2={x(snapshot.time)} y1={top} y2={bottom} stroke="#ddd" strokeWidth="1" opacity=".5"/>}
      <circle cx={kind==='phase'?phaseX(position(snapshot)):x(snapshot.time)} cy={y(value(snapshot))} r="4.5" fill={COLORS[kind]}/>
    </svg>
    <p>{kind==='phase'?(angular&&model.stability!=='stable'?'The path stays open for drift or instability; the signed total energy still stays constant.':angular&&Number.isFinite(model.smallAngleEndTime)?'Stable motion follows an ellipse; this preview ends at its small-angle boundary.':'A closed orbit: total energy stays constant.'):'Click or drag to seek through time. Use Pause to hold an instant; the cursor links the scene and equation.'}</p>
  </section>
}
