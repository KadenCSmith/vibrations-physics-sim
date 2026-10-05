import { foundationFormulas } from './formulasFoundations'
import { pendulumFormulas } from './formulasPendulum'
import { networkFormulas } from './formulasNetwork'
import { masslessFormulas } from './formulasMassless'
import { compoundFormulas } from './formulasCompound'
import { invertedFormulas } from './formulasInverted'
import type { FormulaEntry, FormulaScope } from './formulaTypes'

export const formulaScopeLabels: Record<FormulaScope, string> = {
  pendulum: '01 · Spring pendulum',
  network: '02 · Spring network',
  compound: '03 · Compound network',
  inverted: '04 · Inverted uniform bar',
  shared: 'Shared foundations',
  lecture: 'Lecture extensions',
}
export const formulaCatalog: FormulaEntry[] = [...pendulumFormulas, ...networkFormulas, ...compoundFormulas, ...invertedFormulas, ...foundationFormulas, ...masslessFormulas]

export function searchFormulas(query: string, scope?: FormulaScope): FormulaEntry[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return formulaCatalog.filter(entry => (!scope || entry.scope === scope) && words.every(word =>
    [entry.title, entry.description, entry.group, entry.usage, entry.correction ?? '', formulaScopeLabels[entry.scope], ...entry.sources, ...(entry.tags ?? []), ...entry.tex].join(' ').toLowerCase().includes(word),
  ))
}
