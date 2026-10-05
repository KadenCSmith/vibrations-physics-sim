import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SlidersHorizontal, MoveHorizontal, ArrowUpRight } from 'lucide-react'
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS, deriveModel, sampleModel, sanitizeParameters, type Parameters, type ProblemId, type PendulumMode } from './physics/model'
import { useSimulationClock } from './hooks/useSimulationClock'
import { AppChrome } from './ui/AppChrome'
import { CinematicUIProvider, FinderPortal, ToolboxPortal, useCinematicUI } from './ui/CinematicUI'
import { ParameterControl, type ControlDefinition } from './ui/ParameterControl'
import VibrationScene from './ui/VibrationScene'
import ResponseChart from './ui/ResponseChart'
import EquationPanel from './ui/EquationPanel'
import { FormulaLibrary } from './ui/FormulaLibrary'

const STORAGE_KEY = 'vibrations-sim-v1-parameters'
const definitions: Record<keyof Parameters, Omit<ControlDefinition, 'key'|'min'|'max'|'step'>> = {
  m:{label:'Mass',symbol:'m',unit:'kg',note:'The concentrated moving mass; the rod and spring masses are neglected.'},
  l:{label:'Rod length',symbol:'L',unit:'m',note:'The spring attaches at the bob, a full rod length from the hinge.'},
  k:{label:'Spring stiffness',symbol:'k',unit:'N/m',note:'Set k to zero to recover the simple pendulum.'},
  g:{label:'Gravity',symbol:'g',unit:'m/s²',note:'Earth: 9.81. Moon: 1.62. Gravity supplies a restoring torque.'},
  k1:{label:'Upper left spring',symbol:'k₁',unit:'N/m',note:'A direct path between the fixed ceiling and mass.'},
  k2:{label:'Upper right spring',symbol:'k₂',unit:'N/m',note:'Shares the upper-left spring’s displacement.'},
  k3:{label:'Lower left spring',symbol:'k₃',unit:'N/m',note:'A direct path between the mass and fixed floor.'},
  k4:{label:'Series upper spring',symbol:'k₄',unit:'N/m',note:'Carries the same incremental force as k₅.'},
  k5:{label:'Series lower spring',symbol:'k₅',unit:'N/m',note:'The softer member of the pair deforms more.'},
  theta0Deg:{label:'Release angle',symbol:'θ₀',unit:'°',note:'Released from rest. Trig mode permits ±60°; the linear comparison permits ±12°.'},
  x0:{label:'Release displacement',symbol:'x₀',unit:'m',note:'Positive downward from the loaded static equilibrium.'},
  v0:{label:'Initial velocity',symbol:'v₀',unit:'m/s',note:'Positive downward. This adds a sine term to the response.'},
  omega0Deg:{label:'Initial angular velocity',symbol:'θ̇₀',unit:'°/s',note:'The browser lesson releases the pendulum from rest.'},
}
function readPendulumMode():PendulumMode {
  try{return localStorage.getItem('vibrations-pendulum-mode')==='linear'?'linear':'trig'}catch{return 'trig'}
}
function readSessions():Record<ProblemId,Parameters> {
  const fallback={pendulum:{...DEFAULT_PARAMETERS},network:{...DEFAULT_PARAMETERS}}
  try {
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null')
    if (!value || typeof value !== 'object') return fallback
    return {pendulum:sanitizeParameters({...value.pendulum,omega0Deg:0},readPendulumMode()),network:sanitizeParameters(value.network??{})}
  } catch{return fallback}
}
const number=(value:number,digits=3)=>Math.abs(value)<1e-9?'0.000':value.toFixed(digits)

function SimulationWorkspace() {
  const ui=useCinematicUI()
  const [problem,setProblem]=useState<ProblemId>(()=>new URLSearchParams(location.search).get('problem')==='network'?'network':'pendulum')
  const [sessions,setSessions]=useState(readSessions)
  const [labels,setLabels]=useState(true)
  const [forces,setForces]=useState(true)
  const [dragging,setDragging]=useState(false)
  const [pendulumMode,setPendulumMode]=useState<PendulumMode>(readPendulumMode)
  const mode=problem==='pendulum'?pendulumMode:'linear'
  const parameters=sessions[problem]
  const model=useMemo(()=>deriveModel(problem,parameters,mode),[problem,parameters,mode])
  const duration=model.massless?1:model.period*4
  const clock=useSimulationClock(duration,dragging||model.massless)
  const snapshot=useMemo(()=>sampleModel(problem,parameters,clock.time,mode),[problem,parameters,clock.time,mode])
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(sessions));localStorage.setItem('vibrations-pendulum-mode',pendulumMode)}catch{/* Session still works when storage is unavailable. */}},[sessions,pendulumMode])
  const switchProblem=useCallback((id:ProblemId)=>{
    setProblem(id);clock.reset()
    const url=new URL(location.href);url.searchParams.set('problem',id);history.replaceState(null,'',url)
  },[clock.reset])
  const update=useCallback((key:keyof Parameters,value:number)=>{
    setSessions(old=>({...old,[problem]:sanitizeParameters({...old[problem],[key]:value},mode)}));clock.reset()
  },[problem,mode,clock.reset])
  const changePendulumMode=(next:PendulumMode)=>{
    setPendulumMode(next);setSessions(old=>({...old,pendulum:sanitizeParameters(old.pendulum,next)}));clock.reset()
  }
  const resetParameters=()=>{setSessions(old=>({...old,[problem]:{...DEFAULT_PARAMETERS}}));clock.reset()}
  const seek=(time:number)=>clock.seek(time)
  const drag=(value:number)=>{
    setSessions(old=>({...old,[problem]:sanitizeParameters({...old[problem],...(problem==='pendulum'?{theta0Deg:value,omega0Deg:0}:{x0:value,v0:0})},mode)}));clock.reset()
  }
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement
      if (ui.panel || target.closest('input,textarea,select,button,[role=tab],[role=slider]')) return
      if (event.code==='Space'){event.preventDefault();clock.setPlaying(value=>!value)}
      if (event.key==='r')clock.reset()
      if (event.key==='1')switchProblem('pendulum')
      if (event.key==='2')switchProblem('network')
    }
    document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)
  },[ui.panel,clock.setPlaying,clock.reset,switchProblem])
  const controls:(keyof Parameters)[]=problem==='pendulum'?['m','l','k','g','theta0Deg']:['m','k1','k2','k3','k4','k5','x0','v0']
  return <>
    <AppChrome problem={problem} onProblem={switchProblem} onResetView={()=>{setLabels(true);setForces(true);window.scrollTo({top:0,behavior:'smooth'})}}/>
    <main className="simulation-workspace">
      <div className="workspace-heading">
        <div><span className="eyebrow">ENGR 317 / EXAM REVIEW / PROBLEM {problem==='pendulum'?'01':'02'}</span><h1>{problem==='pendulum'?'Spring pendulum':'Spring network'}</h1><p>{problem==='pendulum'?(mode==='trig'?'Gravity and spring torque, with sin θ and cos θ.':'Small-angle comparison: sin θ ≈ θ and cos θ ≈ 1.'):'Five springs. Four force paths. One moving mass.'}</p></div>
      </div>
      <div className="workspace-grid">
        <div className="visual-workspace">
          <div className="scene-toolbar"><span><MoveHorizontal size={13}/> drag the mass to release</span><div><button aria-pressed={labels} onClick={()=>setLabels(value=>!value)}>labels</button><button aria-pressed={forces} onClick={()=>setForces(value=>!value)}>forces</button></div></div>
          <VibrationScene problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode} labels={labels} forces={forces} onDrag={drag} onRelease={()=>setDragging(false)} onBeginDrag={()=>setDragging(true)}/>
          <div className="live-readouts" aria-label="Live motion values">
            <div className="position-readout"><span>position x</span><output data-testid="position">{number(snapshot.x)}<small> m</small></output></div>
            <div className="velocity-readout"><span>velocity v</span><output data-testid="velocity">{model.massless?'—':number(snapshot.v)}<small> m/s</small></output></div>
            <div className="acceleration-readout"><span>acceleration a</span><output data-testid="acceleration">{model.massless?'—':number(snapshot.a)}<small> m/s²</small></output></div>
            <div><span>{problem==='pendulum'&&mode==='trig'?'oscillation frequency':'natural frequency'}</span><output data-testid="frequency">{model.massless?'—':number(model.frequency,2)}<small>{model.massless?' massless':' Hz'}</small></output></div>
          </div>
          {model.massless?<p className="massless-note">At 0 kg there is no inertial oscillation. The apparatus shows the equilibrium constraint; acceleration and frequency are not defined.</p>:<ResponseChart problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode} duration={duration} onSeek={seek}/>}
          <section className="lesson-prompt"><span className="eyebrow">TRY A SMALL EXPERIMENT</span><p>{problem==='pendulum'?'Double the mass. Does the whole frequency halve? Watch the gravity term and the spring term separately.':'Make k₄ much softer than k₅. Watch the junction, then compare the deformation of the two springs.'}</p><button onClick={()=>ui.open('toolbox')}>try it in toolbox <ArrowUpRight size={14}/></button></section>
        </div>
        <EquationPanel problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode}/>
      </div>
      <footer className="workspace-footer">Based on Prof. Lee’s two exam-review diagrams · default values are illustrative · undamped free vibration · {problem==='pendulum'&&mode==='trig'?'full trigonometric torque model':'linear model'}</footer>
    </main>
    <ToolboxPortal>
      <section><p className="control-context">{problem==='pendulum'?'01 / Spring pendulum':'02 / Spring network'}</p><p>Physical edits restart the motion from its release condition. Both scenes and the equations use the same values.</p>
        {problem==='pendulum'&&<div className="pendulum-model-controls"><span className="drawer-section-label">PENDULUM EQUATION</span><div><button aria-pressed={mode==='trig'} onClick={()=>changePendulumMode('trig')}>Full sin θ / cos θ</button><button aria-pressed={mode==='linear'} onClick={()=>changePendulumMode('linear')}>Small-angle comparison</button></div><p>{mode==='trig'?'The motion follows your full torque equation. A larger release angle changes the period.':'sin θ ≈ θ and cos θ ≈ 1 give a harmonic approximation near equilibrium.'}</p></div>}
        {controls.map(key=><ParameterControl key={key} definition={{key,...definitions[key],...PARAMETER_LIMITS[key],...(key==='theta0Deg'&&mode==='linear'?{min:-12,max:12}:{})}} value={parameters[key]} onChange={value=>update(key,value)}/>)}
        <div className="toolbox-actions"><button onClick={resetParameters}>Restore example values</button>{problem==='pendulum'?<><button onClick={()=>update('k',0)}>Pure pendulum · k = 0</button>{mode==='trig'&&<button onClick={()=>update('theta0Deg',40)}>Try a 40° release</button>}</>:<button onClick={()=>{setSessions(old=>({...old,network:{...old.network,k1:30,k2:30,k3:30,k4:30,k5:30}}));clock.reset()}}>Five equal springs</button>}</div>
        <div className="toolbox-result"><span>{model.massless?'Massless limit':problem==='pendulum'&&mode==='trig'?'Measured oscillation rhythm':'Natural frequency'}</span><strong>{model.massless?'Equilibrium constraint':`${(2*Math.PI/model.period).toFixed(3)} rad/s`}</strong><small>{model.massless?'No inertia: acceleration and oscillation frequency are undefined.':`${model.frequency.toFixed(3)} Hz · period ${model.period.toFixed(3)} s`}</small></div>
      </section>
    </ToolboxPortal>
    <ToolboxPortal extra><div className="toolbox-actions"><button aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>Diagram labels</button><button aria-pressed={forces} onClick={()=>setForces(v=>!v)}>Restoring force</button></div><p>Playback speed changes viewing speed. Physical frequency remains set by the parameters.</p></ToolboxPortal>
    <FinderPortal documentation>
      <FormulaLibrary problem={problem} query={ui.query} onProblem={switchProblem}/>
    </FinderPortal>
    <div className="cinematic-transport" aria-label="Simulation playback">
      <button className="transport-play" aria-label={clock.playing?'Pause simulation':'Play simulation'} onClick={()=>clock.setPlaying(v=>!v)}>{clock.playing?<Pause size={21} strokeWidth={1.2}/>:<Play size={21} strokeWidth={1.2}/>}</button>
      <button aria-label="Back one quarter period" onClick={()=>seek(Math.max(0,clock.time-model.period/4))}><SkipBack size={18} strokeWidth={1}/></button>
      <div className="cinematic-timeline"><div><span>{problem==='pendulum'?'θ(t) → x(t)':'x(t) → spring deformation'}</span><strong><output data-testid="time">{clock.time.toFixed(2)}</output> <small>/ {duration.toFixed(2)} s · 4 cycles</small></strong></div><input aria-label="Simulation time" type="range" min="0" max={duration} step={duration/1000} value={clock.time} onChange={event=>seek(Number(event.target.value))}/></div>
      <label className="speed-control">speed<select aria-label="Playback speed" value={clock.speed} onChange={event=>clock.setSpeed(Number(event.target.value))}>{[.1,.25,.5,1,1.5,2].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
      <button aria-label="Restart simulation" onClick={clock.reset}><RotateCcw size={18} strokeWidth={1}/></button>
      <button aria-label="Open physical values" onClick={()=>ui.open('toolbox')}><SlidersHorizontal size={20} strokeWidth={1}/></button>
    </div>
  </>
}
export default function App(){return <CinematicUIProvider><SimulationWorkspace/></CinematicUIProvider>}
