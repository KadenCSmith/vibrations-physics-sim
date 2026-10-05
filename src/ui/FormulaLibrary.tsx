import { useEffect, useMemo, useState } from 'react'
import { formulaCatalog, formulaScopeLabels, searchFormulas } from '../physics/formulaCatalog'
import type { FormulaScope } from '../physics/formulaTypes'
import type { ProblemId } from '../physics/model'
import { referencePhotos } from '../physics/referencePhotos'
import { MathFormula } from './Math'

export function FormulaLibrary({ problem, query, onProblem }: {
  problem: ProblemId
  query: string
  onProblem: (problem: ProblemId) => void
}) {
  const [scope, setScope] = useState<FormulaScope>(problem)
  useEffect(() => setScope(problem), [problem])
  const matches = useMemo(() => searchFormulas(query, query.trim() ? undefined : scope), [query, scope])
  const groups = Array.from(new Set(matches.map(entry => `${entry.scope}|${entry.group}`)))
  const count = formulaCatalog.reduce((sum, entry) => sum + entry.tex.length, 0)
  return <section className="formula-library" aria-label="Formula library">
    <div className="documentation-intro"><span className="eyebrow">FORMULA LIBRARY / {count} EQUATIONS</span><h3>Follow every step.</h3><p>Choose a simulation, then trace its geometry, forces, derivatives, and energy. Shared foundations support both problems. Lecture extensions cover the other examples in your photos.</p></div>
    <nav className="formula-scopes" aria-label="Formula groups">{(Object.keys(formulaScopeLabels) as FormulaScope[]).map(id => <button key={id} aria-pressed={scope === id && !query.trim()} onClick={() => setScope(id)}>{formulaScopeLabels[id]}<small>{formulaCatalog.filter(entry => entry.scope === id).length} topics</small></button>)}</nav>
    {query.trim() ? <p className="formula-search-summary">{matches.length} matching topics across all groups for “{query}”.</p> : <div className="formula-context"><span>{scope === 'lecture' ? 'Reference only · these extensions are not animated.' : scope === 'shared' ? 'Foundations for both simulations · harmonic response applies to the network and linear pendulum comparison.' : scope === 'pendulum' ? '01 · θ in radians. Full trig mode uses x = L sin θ; the small-angle comparison uses x ≈ Lθ.' : '02 · x measured downward from loaded equilibrium. k₄ and k₅ are in series.'}</span>{(scope === 'pendulum' || scope === 'network') && scope !== problem && <button onClick={() => onProblem(scope)}>Open this simulation ↗</button>}</div>}
    {!matches.length && <p className="formula-no-results">No matching formulas. Try “chain rule”, “frequency”, “series”, or a photo number.</p>}
    {groups.map(key => {
      const [entryScope, group] = key.split('|')
      const entries = matches.filter(entry => entry.scope === entryScope && entry.group === group)
      return <section className="formula-section" key={key}><header><span className="eyebrow">{formulaScopeLabels[entryScope as FormulaScope]}</span><h4>{group}</h4><small>{entries.length} topics</small></header>{entries.map(entry => <details key={`${entry.id}-${query}`} className="formula-entry" open={query.trim() ? true : undefined}>
        <summary>{entry.title}</summary>
        <div className="formula-entry-body"><p>{entry.description}</p>{entry.tex.map((tex, index) => <MathFormula key={index} tex={tex} />)}<p className="formula-use"><span>Where it fits</span>{entry.usage}</p>{entry.correction && <p className="formula-correction"><span>Correction to the notes</span>{entry.correction}</p>}<div className="formula-provenance"><span>{entry.reconstructed ? 'Completed / derived step' : 'Reference equation'}</span><details><summary>Source references</summary><p>{entry.sources.length ? entry.sources.join(' · ') : 'Additional mathematical foundation derived for this lesson.'}</p></details></div></div>
      </details>)}</section>
    })}
    <details className="formula-reference-index"><summary>38 reviewed lecture photos</summary>{referencePhotos.map(item => <p key={item.file}><strong>{item.file}</strong><br/>{item.topic}</p>)}</details>
    <p className="formula-library-footnote">Blanks and added intermediate steps are marked “completed / derived”. The original photos stay outside the public repository. Search by concept, variable, or source filename.</p>
  </section>
}
