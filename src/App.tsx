import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SlidersHorizontal, MoveHorizontal, ArrowUpRight } from 'lucide-react'
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS, deriveModel, sampleModel, sanitizeParameters, isCompoundProblem, type Parameters, type ProblemId, type PendulumMode } from './physics/model'
import { useSimulationClock } from './hooks/useSimulationClock'
import { AppChrome } from './ui/AppChrome'
import { CinematicUIProvider, FinderPortal, ToolboxPortal, useCinematicUI } from './ui/CinematicUI'
import { ParameterControl, type ControlDefinition } from './ui/ParameterControl'
import VibrationScene from './ui/VibrationScene'
import ResponseChart from './ui/ResponseChart'
import EquationPanel from './ui/EquationPanel'
import { FormulaLibrary } from './ui/FormulaLibrary'
import { SpringConnectionsLesson } from './components/SpringConnectionsLesson'
import { SpringNetworkInfo } from './components/SpringNetworkInfo'
import { CompoundSpringScene } from './components/CompoundSpringScene'
import { CompoundSpringInfo } from './components/CompoundSpringInfo'
import { InvertedPendulumScene } from './components/InvertedPendulumScene'
import { InvertedPendulumInfo } from './components/InvertedPendulumInfo'

const STORAGE_KEY = 'vibrations-sim-v1-parameters'
const problemLabels:Record<ProblemId,{number:string;title:string;subtitle:string}> = {
  pendulum:{number:'01',title:'Spring pendulum',subtitle:'Gravity and spring torque, with sin θ and cos θ.'},
  network:{number:'02',title:'Spring network',subtitle:'Five springs. Four force paths. One moving mass.'},
  compound:{number:'03',title:'Compound spring system',subtitle:'Seven springs. Parallel pairs, series groups, and one final spring.'},
  'compound-inverted':{number:'05',title:'Inverted compound spring system',subtitle:'The seven-spring network flipped: mass above, support below, positive x upward.'},
  inverted:{number:'04',title:'Inverted spring pendulum',subtitle:'Two restoring springs. One destabilizing gravity torque. A uniform bar.'},
}
const definitions: Record<keyof Parameters, Omit<ControlDefinition, 'key'|'min'|'max'|'step'>> = {
  m:{label:'Mass',symbol:'m',unit:'kg',note:'The concentrated moving mass; the rod and spring masses are neglected. Choose 0 for the massless constraint, or at least 0.1 kg for motion.'},
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
const compoundDefinitions:Partial<typeof definitions> = {
  m:{label:'Mass',symbol:'m',unit:'kg',note:'Only the bottom mass has inertia; all springs and connecting junctions are massless. Choose 0 for the massless constraint, or at least 0.1 kg for motion.'},
  k1:{label:'Upper pair stiffness',symbol:'k₁',unit:'N/m',note:'Each of the two identical upper springs has this stiffness. Together they contribute 2k₁.'},
  k2:{label:'Middle spring stiffness',symbol:'k₂',unit:'N/m',note:'In series with the upper and lower parallel pairs on the left.'},
  k3:{label:'Lower pair stiffness',symbol:'k₃',unit:'N/m',note:'Each of the two identical lower springs has this stiffness. Together they contribute 2k₃.'},
  k4:{label:'Right branch stiffness',symbol:'k₄',unit:'N/m',note:'Connects the ceiling directly to the collector, in parallel with the entire left path.'},
  k5:{label:'Final spring stiffness',symbol:'k₅',unit:'N/m',note:'Connects the collector to the mass. It is in series with the combined support assembly.'},
  g:{label:'Gravity',symbol:'g',unit:'m/s²',note:'Sets the loaded equilibrium through mg/k_eq. Motion x is measured from that equilibrium, so gravity does not change the vibration frequency.'},
}
const invertedDefinitions:Partial<typeof definitions> = {
  m:{label:'Bar mass',symbol:'m',unit:'kg',note:'The uniform bar carries the mass along its full length. Its inertia about the lower pivot is J₀ = mℓ²/3. Choose 0 for the zero-inertia constraint.'},
  l:{label:'Bar length',symbol:'ℓ',unit:'m',note:'Both springs attach at the top, ℓ above the pivot. The center of mass is halfway along the bar.'},
  k:{label:'Each spring stiffness',symbol:'k',unit:'N/m',note:'Both identical springs have this stiffness. Their angular stiffnesses add to 2kℓ².'},
  g:{label:'Gravity',symbol:'g',unit:'m/s²',note:'Gravity destabilizes the upright bar. Its linearized torque is +mgℓθ/2, opposing the springs’ restoring torque.'},
  theta0Deg:{label:'Release angle',symbol:'θ₀',unit:'°',note:'Positive to the right of upright. This preview uses small-angle motion and stops at ±12°.'},
  omega0Deg:{label:'Initial angular velocity',symbol:'θ̇₀',unit:'°/s',note:'Positive toward increasing θ. Nonzero velocity also lets you explore the neutral drift at the stiffness threshold.'},
}
const mirroredDefinitions:Partial<typeof definitions> = {
  ...compoundDefinitions,
  m:{...compoundDefinitions.m!,note:'The top mass is guided vertically. All springs and rigid junctions are massless.'},
  k1:{label:'Support pair stiffness',symbol:'k₁',unit:'N/m',note:'Each of the two identical springs nearest the floor has this stiffness. Their stiffnesses add to 2k₁.'},
  k3:{label:'Mass-side pair stiffness',symbol:'k₃',unit:'N/m',note:'Two identical springs between B and collector C; their stiffnesses add to 2k₃.'},
  k4:{label:'Bypass spring stiffness',symbol:'k₄',unit:'N/m',note:'Connects the fixed floor directly to collector C, in parallel with the complete left path.'},
  g:{...compoundDefinitions.g!,note:'Gravity compresses the supporting springs at rest. The coordinate x is measured upward from loaded equilibrium, so gravity cancels from the motion equation.'},
  x0:{label:'Release displacement',symbol:'x₀',unit:'m',note:'Positive upward from loaded static equilibrium.'},
  v0:{label:'Initial velocity',symbol:'v₀',unit:'m/s',note:'Positive upward. This adds a sine term to the response.'},
}
function readPendulumMode():PendulumMode {
  try{return localStorage.getItem('vibrations-pendulum-mode')==='linear'?'linear':'trig'}catch{return 'trig'}
}
function readSessions():Record<ProblemId,Parameters> {
  const fallback={pendulum:{...DEFAULT_PARAMETERS},network:{...DEFAULT_PARAMETERS},compound:{...DEFAULT_PARAMETERS},inverted:{...DEFAULT_PARAMETERS},'compound-inverted':{...DEFAULT_PARAMETERS}}
  try {
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null')
    if (!value || typeof value !== 'object') return fallback
    return {pendulum:sanitizeParameters({...value.pendulum,omega0Deg:0},readPendulumMode()),network:sanitizeParameters(value.network??{}),compound:sanitizeParameters(value.compound??{}),inverted:sanitizeParameters(value.inverted??{}),'compound-inverted':sanitizeParameters(value['compound-inverted']??{})}
  } catch{return fallback}
}
const number=(value:number,digits=3)=>Math.abs(value)<1e-9?'0.000':value.toFixed(digits)

function SimulationWorkspace() {
  const ui=useCinematicUI()
  const [problem,setProblem]=useState<ProblemId>(()=>{const id=new URLSearchParams(location.search).get('problem');return id==='network'||id==='compound'||id==='inverted'||id==='compound-inverted'?id:'pendulum'})
  const [sessions,setSessions]=useState(readSessions)
  const [labels,setLabels]=useState(true)
  const [forces,setForces]=useState(true)
  const [dragging,setDragging]=useState(false)
  const [pendulumMode,setPendulumMode]=useState<PendulumMode>(readPendulumMode)
  const mode=problem==='pendulum'?pendulumMode:'linear'
  const parameters=sessions[problem]
  const model=useMemo(()=>deriveModel(problem,parameters,mode),[problem,parameters,mode])
  const isCompound=isCompoundProblem(problem)
  const isSpringNetwork=problem==='network'||isCompound
  const isAngular=problem==='pendulum'||problem==='inverted'
  const finiteAngleBoundary=problem==='inverted'&&Number.isFinite(model.smallAngleEndTime)
  const duration=model.massless?1:Math.max(.001,model.observationDuration??model.period*4)
  const loops=problem!=='inverted'||(model.stability==='stable'&&!finiteAngleBoundary)
  const clock=useSimulationClock(duration,dragging||model.massless||(finiteAngleBoundary&&model.smallAngleEndTime===0),loops)
  const sampleTime=finiteAngleBoundary?Math.min(clock.time,model.smallAngleEndTime!):clock.time
  const snapshot=useMemo(()=>sampleModel(problem,parameters,sampleTime,mode),[problem,parameters,sampleTime,mode])
  const angleLimitReached=finiteAngleBoundary&&sampleTime>=model.smallAngleEndTime!
  const noCycle=problem==='inverted'&&model.stability!=='stable'
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
    setSessions(old=>({...old,[problem]:sanitizeParameters({...old[problem],...(isAngular?{theta0Deg:value,omega0Deg:0}:{x0:value,v0:0})},mode)}));clock.reset()
  }
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement
      if (ui.panel || target.closest('input,textarea,select,button,summary,a,[contenteditable=true],[role=tab],[role=slider],[role=button]')) return
      if (event.code==='Space'){event.preventDefault();clock.setPlaying(value=>!value)}
      if (event.key==='r')clock.reset()
      if (event.key==='1')switchProblem('pendulum')
      if (event.key==='2')switchProblem('network')
      if (event.key==='3')switchProblem('compound')
      if (event.key==='4')switchProblem('inverted')
      if (event.key==='5')switchProblem('compound-inverted')
    }
    document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)
  },[ui.panel,clock.setPlaying,clock.reset,switchProblem])
  const controls:(keyof Parameters)[]=problem==='pendulum'?['m','l','k','g','theta0Deg']:problem==='inverted'?['m','l','k','g','theta0Deg','omega0Deg']:isCompound?['m','k1','k2','k3','k4','k5','g','x0','v0']:['m','k1','k2','k3','k4','k5','x0','v0']
  const problemLabel=problemLabels[problem]
  const invertedExample=(kind:'stable'|'neutral'|'unstable')=>{setSessions(old=>({...old,inverted:{...DEFAULT_PARAMETERS,k:kind==='stable'?8:kind==='neutral'?DEFAULT_PARAMETERS.m*DEFAULT_PARAMETERS.g/(4*DEFAULT_PARAMETERS.l):2,theta0Deg:kind==='neutral'?3:8,omega0Deg:kind==='neutral'?2:0}}));clock.reset()}
  return <>
    <AppChrome problem={problem} onProblem={switchProblem} onResetView={()=>{setLabels(true);setForces(true);window.scrollTo({top:0,behavior:'smooth'})}}/>
    <main className="simulation-workspace">
      <div className="workspace-heading">
        <div><span className="eyebrow">ENGR 317 / VIBRATIONS / SIMULATION {problemLabel.number}</span><h1>{problemLabel.title}</h1><p>{problem==='pendulum'&&mode==='linear'?'Small-angle comparison: sin θ ≈ θ and cos θ ≈ 1.':problemLabel.subtitle}</p></div>
      </div>
      <div className="workspace-grid">
        <div className="visual-workspace">
          <div className="scene-toolbar"><span><MoveHorizontal size={13}/> {problem==='inverted'?'drag the bar’s top to release':problem==='compound-inverted'?'drag the mass · click a spring to inspect':'drag the mass to release'}</span><div><button aria-pressed={labels} onClick={()=>setLabels(value=>!value)}>labels</button><button aria-pressed={forces} onClick={()=>setForces(value=>!value)}>forces</button></div></div>
          {problem==='inverted'?<InvertedPendulumScene parameters={parameters} model={model} snapshot={snapshot} labels={labels} forces={forces} onDrag={drag} onRelease={()=>setDragging(false)} onBeginDrag={()=>setDragging(true)}/>:isCompound?<CompoundSpringScene onSpringChange={update} parameters={parameters} model={model} snapshot={snapshot} labels={labels} forces={forces} onDrag={drag} onRelease={()=>setDragging(false)} onBeginDrag={()=>setDragging(true)}/>:<VibrationScene problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode} labels={labels} forces={forces} onDrag={drag} onRelease={()=>setDragging(false)} onBeginDrag={()=>setDragging(true)}/>}
          <div className="live-readouts" aria-label="Live motion values">
            <div className="position-readout"><span>{problem==='inverted'?'angle θ':'position x'}</span><output data-testid="position">{number(problem==='inverted'?snapshot.theta:snapshot.x)}<small>{problem==='inverted'?' rad':' m'}</small></output></div>
            <div className="velocity-readout"><span>{problem==='inverted'?'angular velocity θ̇':'velocity v'}</span><output data-testid="velocity">{model.massless?'—':number(problem==='inverted'?snapshot.thetaDot:snapshot.v)}<small>{problem==='inverted'?' rad/s':' m/s'}</small></output></div>
            <div className="acceleration-readout"><span>{problem==='inverted'?'angular acceleration θ̈':'acceleration a'}</span><output data-testid="acceleration">{model.massless?'—':number(problem==='inverted'?snapshot.thetaDDot:snapshot.a)}<small>{problem==='inverted'?' rad/s²':' m/s²'}</small></output></div>
            <div><span>{model.stability==='unstable'?'growth rate λ':problem==='pendulum'&&mode==='trig'?'oscillation frequency':'natural frequency'}</span><output data-testid="frequency">{model.massless?'—':model.stability==='unstable'?number(model.growthRate??0,2):number(model.frequency,2)}<small>{model.massless?' massless':model.stability==='unstable'?' 1/s':' Hz'}</small></output></div>
          </div>
          {isSpringNetwork&&<SpringConnectionsLesson parameters={parameters} model={model} snapshot={snapshot} onExample={example=>{setSessions(old=>({...old,[problem]:{...old[problem],k1:30,k2:30,k3:30,k4:30,k5:example==='equal'?30:5,x0:.12,v0:0}}));clock.reset()}}/>}
          {problem==='network'&&<SpringNetworkInfo parameters={parameters} model={model} snapshot={snapshot}/>}
          {isCompound&&<CompoundSpringInfo parameters={parameters} model={model} snapshot={snapshot}/>}
          {problem==='inverted'&&<InvertedPendulumInfo parameters={parameters} model={model} snapshot={snapshot}/>}
          {angleLimitReached&&<p className="massless-note">Small-angle preview held at ±12°. The linear equations remain shown at this boundary. Use Restart or change a value to explore again.</p>}
          {model.massless?<p className="massless-note">At 0 kg there is no inertial oscillation. {model.stability==='free'?'With k = 0 as well, the equation is 0 = 0; the chosen angle is held illustratively.':'The apparatus shows the equilibrium constraint; acceleration and frequency are not defined.'}</p>:<ResponseChart problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode} duration={duration} onSeek={seek}/>}
          <section className="lesson-prompt"><span className="eyebrow">TRY A SMALL EXPERIMENT</span><p>{problem==='inverted'?'Lower each spring’s k through mg/(4ℓ). Watch the angular stiffness change sign: oscillation gives way to neutral drift, then instability.':problem==='pendulum'?'Double the mass. Does the whole frequency halve? Watch the gravity term and the spring term separately.':isCompound?'Make k₅ softer. Watch how the displacement divides between the support assembly and the final spring, then compare k_eq with both.':'Make k₄ much softer than k₅. Watch the junction, then compare the deformation of the two springs.'}</p><button onClick={()=>ui.open('toolbox')}>try it in toolbox <ArrowUpRight size={14}/></button></section>
        </div>
        <EquationPanel problem={problem} parameters={parameters} model={model} snapshot={snapshot} mode={mode}/>
      </div>
      <footer className="workspace-footer">Based on your vibrations problem diagrams · default values are illustrative · undamped free vibration · {problem==='pendulum'&&mode==='trig'?'full trigonometric torque model':'linear model'}</footer>
    </main>
    <ToolboxPortal>
      <section><p className="control-context">{problemLabel.number} / {problemLabel.title}</p><p>Physical edits restart the motion from its release condition. The scene and equations use the same values.</p>
        {problem==='pendulum'&&<div className="pendulum-model-controls"><span className="drawer-section-label">PENDULUM EQUATION</span><div><button aria-pressed={mode==='trig'} onClick={()=>changePendulumMode('trig')}>Full sin θ / cos θ</button><button aria-pressed={mode==='linear'} onClick={()=>changePendulumMode('linear')}>Small-angle comparison</button></div><p>{mode==='trig'?'The motion follows your full torque equation. A larger release angle changes the period.':'sin θ ≈ θ and cos θ ≈ 1 give a harmonic approximation near equilibrium.'}</p></div>}
        {controls.map(key=><ParameterControl key={key} definition={{key,...definitions[key],...(problem==='compound-inverted'?mirroredDefinitions[key]:isCompound?compoundDefinitions[key]:problem==='inverted'?invertedDefinitions[key]:{}),...PARAMETER_LIMITS[key],...(key==='theta0Deg'&&mode==='linear'?{min:-12,max:12}:{})}} value={parameters[key]} onChange={value=>update(key,value)}/>)}
        <div className="toolbox-actions"><button onClick={resetParameters}>Restore example values</button>{problem==='inverted'?<><button onClick={()=>invertedExample('stable')}>Stable example</button><button onClick={()=>invertedExample('neutral')}>Balance torques · neutral</button><button onClick={()=>invertedExample('unstable')}>Gravity wins · unstable</button></>:problem==='pendulum'?<><button onClick={()=>update('k',0)}>Pure pendulum · k = 0</button>{mode==='trig'&&<button onClick={()=>update('theta0Deg',40)}>Try a 40° release</button>}</>:<button onClick={()=>{setSessions(old=>({...old,[problem]:{...old[problem],k1:30,k2:30,k3:30,k4:30,k5:30}}));clock.reset()}}>{isCompound?'Seven equal springs':'Five equal springs'}</button>}</div>
        <div className="toolbox-result"><span>{model.massless?'Massless limit':model.stability==='unstable'?'Unstable · no natural oscillation':model.stability==='neutral'?'Neutral · no finite period':problem==='pendulum'&&mode==='trig'?'Measured oscillation rhythm':'Natural frequency'}</span><strong>{model.massless?model.stability==='free'?'0 = 0 · free constraint':'Equilibrium constraint':model.stability==='unstable'?`Growth rate ${(model.growthRate??0).toFixed(3)} 1/s`:`${(problem==='pendulum'&&mode==='trig'?2*Math.PI/model.period:model.omega).toFixed(3)} rad/s`}</strong><small>{model.massless?'No inertia: acceleration and oscillation frequency are undefined.':noCycle?(model.stability==='neutral'?'Zero restoring frequency; motion holds its angle or drifts at constant angular velocity. No finite period.':'The growth rate describes exponential motion; no real oscillation frequency or period is assigned.'):`${model.frequency.toFixed(3)} Hz · period ${model.period.toFixed(3)} s`}</small></div>
      </section>
    </ToolboxPortal>
    <ToolboxPortal extra><div className="toolbox-actions"><button aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>Diagram labels</button><button aria-pressed={forces} onClick={()=>setForces(v=>!v)}>Restoring force</button></div><p>Playback speed changes viewing speed. Physical frequency remains set by the parameters.</p></ToolboxPortal>
    <FinderPortal documentation>
      <FormulaLibrary problem={problem} query={ui.query} onProblem={switchProblem}/>
    </FinderPortal>
    <div className="cinematic-transport" aria-label="Simulation playback">
      <button className="transport-play" aria-label={clock.ended||angleLimitReached?'Replay simulation':clock.playing?'Pause simulation':'Play simulation'} onClick={()=>{if(clock.ended||angleLimitReached){clock.reset();clock.setPlaying(true)}else clock.setPlaying(v=>!v)}}>{clock.ended||angleLimitReached?<RotateCcw size={21} strokeWidth={1.2}/>:clock.playing?<Pause size={21} strokeWidth={1.2}/>:<Play size={21} strokeWidth={1.2}/>}</button>
      <button aria-label="Back one quarter period" disabled={model.massless||noCycle} onClick={()=>seek(Math.max(0,clock.time-model.period/4))}><SkipBack size={18} strokeWidth={1}/></button>
      <div className="cinematic-timeline"><div><span>{model.massless?'massless · static view':isAngular?'θ(t) → x(t)':'x(t) → spring deformation'}</span><strong>{model.massless?<small>No oscillation period</small>:<><output data-testid="time">{sampleTime.toFixed(2)}</output> <small>/ {duration.toFixed(2)} s · {loops?'4 cycles':angleLimitReached?'angle limit':finiteAngleBoundary?'to angle limit':'observation window'}</small></>}</strong></div><input aria-label="Simulation time" disabled={model.massless||(finiteAngleBoundary&&model.smallAngleEndTime===0)} type="range" min="0" max={duration} step={duration/1000} value={clock.time} onChange={event=>seek(Number(event.target.value))}/></div>
      <label className="speed-control">speed<select aria-label="Playback speed" value={clock.speed} onChange={event=>clock.setSpeed(Number(event.target.value))}>{[.1,.25,.5,1,1.5,2].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
      <button aria-label="Restart simulation" onClick={clock.reset}><RotateCcw size={18} strokeWidth={1}/></button>
      <button aria-label="Open physical values" onClick={()=>ui.open('toolbox')}><SlidersHorizontal size={20} strokeWidth={1}/></button>
    </div>
  </>
}
export default function App(){return <CinematicUIProvider><SimulationWorkspace/></CinematicUIProvider>}
