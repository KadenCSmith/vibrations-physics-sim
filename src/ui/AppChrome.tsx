// Adapted from the user's zombie-fire-suppression-sim v0.20.0 cinematic shell.
// Custom navigation SVGs and interaction structure retain their source provenance.
import { useEffect, useRef, useState } from 'react'
import { version } from '../../package.json'
import { FinderPortal, useCinematicUI } from './CinematicUI'
import './cinematic.css'
import type { ProblemId } from '../physics/model'

type Problem = ProblemId
const problems: { id: Problem; title: string; detail: string }[] = [
  { id: 'pendulum', title: 'Spring pendulum', detail: 'Gravity and a horizontal spring · angular motion' },
  { id: 'network', title: 'Spring network', detail: 'Parallel paths and a series branch · vertical translation' },
  { id: 'compound', title: 'Compound spring system', detail: 'Two parallel pairs, a bypass branch, and a final spring' },
  { id: 'inverted', title: 'Inverted spring pendulum', detail: 'A uniform bar, two springs, and competing gravity · energy and Lagrange' },
  { id: 'compound-inverted', title: 'Inverted compound spring system', detail: 'Mass on top, support below · the seven-spring network flipped' },
]
const guides = [
  { title: 'Choose a problem', text: 'Open the Simulation dropdown to switch between five problems. Keyboard shortcuts 1–5 select them. Each model has its own equations and controls.' },
  { title: 'Release, pause, and inspect', text: 'All simulations play automatically at quarter speed. Drag the mass to change the release position, then release it to continue. Use Pause to hold an instant; Play resumes. Switching problems and opening Toolbox or Finder preserve playback. Hidden tabs resume when visible unless you paused.' },
  { title: 'Change a physical parameter', text: 'Toolbox contains masses, lengths, and spring stiffnesses. A parameter change starts a new trajectory from its initial condition. The values use the units shown beside each control.' },
  { title: 'Understand the model', text: 'The hanging pendulum defaults to the full sin θ / cos θ torque equation, with a small-angle comparison in Toolbox. The spring networks follow their connections; simulation 05 mirrors the compound network with upward-positive motion. Expand Spring-by-spring details for the full reduction, and compare series and parallel using the live cards. The inverted uniform bar uses the requested small-angle model: two springs restore it, while gravity destabilizes it. Its energy and Lagrange derivations give the same equation. All models are undamped.' },
  { title: 'Read the response', text: 'Angular frequency is measured in radians per second; frequency in cycles per second. The inverted bar only oscillates when its net angular stiffness is positive. Neutral and unstable motion have no finite oscillation period. This small-angle preview stops at ±12°; use Restart or change the parameters to explore again. Playback speed changes viewing speed without changing physical frequency.' },
  { title: 'Find every formula', text: 'Physics documentation groups equations by all five simulations, shared foundations, and lecture extensions. Expand a topic for its formulas, intermediate derivatives, usage, source photos, and corrections. Search within formulas to find a concept or photo number.' },
]

function Pinwheel() {
  return <svg className="version-pinwheel" viewBox="0 0 72 136" aria-hidden="true"><path d="M36 38v96" /><g className="pinwheel-rotor">{[0, 90, 180, 270].map(angle => <path key={angle} transform={`rotate(${angle} 36 33)`} d="M39 29C54 29 60 21 55 12C51 5 39 1 37 8C35 14 40 20 36 26" />)}<circle cx="36" cy="33" r="3.2" /></g></svg>
}
function FinderIcon() {
  return <svg viewBox="0 0 106 106" aria-hidden="true"><path d="M4 5l35 35V4h6v45H3v-6h31L1 10zM53 4h49v24L77 51H53zM77 51V34q0-7 7-7h18" /><circle cx="29" cy="75" r="18" /><path d="M16 88L3 102l5 4 13-15" /><circle cx="79" cy="80" r="24" />{Array.from({ length: 9 }, (_, i) => { const a = i * Math.PI * 2 / 9; return <circle key={i} cx={79 + 17 * Math.cos(a)} cy={80 + 17 * Math.sin(a)} r="3.5" /> })}</svg>
}
function ToolboxIcon() {
  return <svg viewBox="0 0 185 100" aria-hidden="true"><path d="M26 3L55 20 40 47l31 18q15 9 7 23t-24 5L24 75 8 99-18 82 0 50l12 7 8-14-12-7z" transform="translate(22 -2) scale(.9)" /><path d="M131 8h29l21 37-21 37h-42L97 45l21-37z" /><circle cx="139" cy="45" r="18" /></svg>
}

export function AppChrome({ problem, onProblem, onResetView }: {
  problem: Problem
  onProblem: (id: Problem) => void
  onResetView?: () => void
}) {
  const { panel, open, query, setFinderTab } = useCinematicUI()
  const [menu, setMenu] = useState(false)
  const [compact, setCompact] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const switcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > window.innerHeight * .35)
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', scroll)
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll) }
  }, [])
  useEffect(() => {
    if (!menu) return
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); switcherRef.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key) }
  }, [menu])

  const select = (id: Problem) => { onProblem(id); setMenu(false); open(null); window.scrollTo({ top: 0, behavior: 'instant' }) }
  const render = () => { setMenu(false); open(null); onResetView?.(); window.scrollTo({ top: 0, behavior: 'instant' }) }
  const finder = (tab: 'guides' | 'docs' = 'guides') => { setFinderTab(tab); setMenu(false); open('finder') }
  const switcher = () => { open(null); setMenu(value => !value) }
  const results = problems.filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()))

  return <>
    <header className={`cinematic-header ${compact ? 'is-compact' : ''}`}>
      <button className="cinematic-brand" onClick={render} aria-label="Vibrations Simulation home">Vibrations<span>Ver.[{version}]</span></button>
      <div className="version-navigation" ref={menuRef}>
        <button ref={switcherRef} className="cinematic-nav-button" aria-label="Simulation" aria-expanded={menu} aria-controls="simulation-version-menu" onClick={switcher}><Pinwheel /><span>Simulation</span></button>
        {menu && <div id="simulation-version-menu" className="version-menu" role="dialog" aria-label="Select a simulation"><span className="drawer-section-label">CHOOSE A SIMULATION</span>{problems.map((item, index) => <button key={item.id} aria-current={problem === item.id ? 'page' : undefined} onClick={() => select(item.id)}><small>{String(index + 1).padStart(2, '0')}</small><span>{item.title}<em>{item.detail}</em></span><b>↗</b></button>)}</div>}
      </div>
      <div className="finder-navigation">
        <button className="cinematic-nav-button" aria-label="Open Finder" aria-expanded={panel === 'finder'} onClick={() => { setMenu(false); open(panel === 'finder' ? null : 'finder') }}><FinderIcon /><span>finder</span></button>
        <nav className="cinematic-sublinks" aria-label="Finder sections"><button onClick={() => finder()}>guides &amp; values</button><button onClick={() => finder('docs')}>physics documentation</button><button onClick={() => finder()}>search</button></nav>
      </div>
      <button className="toolbox-navigation" aria-label="Open Toolbox" aria-expanded={panel === 'toolbox'} title="Edit simulation variables" onClick={() => { setMenu(false); open(panel === 'toolbox' ? null : 'toolbox') }}><ToolboxIcon /><span>toolbox</span></button>
    </header>
    <FinderPortal>
      <section className="finder-destinations"><div className="drawer-section-label">JUMP TO</div>{results.map((item) => <button key={item.id} onClick={() => select(item.id)}><span>{item.title}<small>{item.detail}</small></span><b>↗</b></button>)}<button onClick={() => finder('docs')}><span>Formula library<small>Equations, trig identities, derivative steps, and sources</small></span><b>↗</b></button></section>
      <section className="finder-handbook"><div className="drawer-section-label">GUIDES</div>{guides.filter(item => `${item.title} ${item.text}`.toLowerCase().includes(query.toLowerCase())).map(item => <details key={item.title}><summary>{item.title}</summary><p>{item.text}</p></details>)}</section>
    </FinderPortal>
  </>
}
