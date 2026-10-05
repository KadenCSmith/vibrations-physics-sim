import { useEffect, useState } from 'react'

export interface ControlDefinition {
  key: string; label: string; symbol: string; unit: string; min: number; max: number; step: number; note: string
}
export function ParameterControl({ definition: d, value, onChange }: { definition: ControlDefinition; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(Number(value.toFixed(5)))), [value])
  const commit = () => {
    const next = Number(draft)
    if (draft.trim() && Number.isFinite(next)) onChange(Math.min(d.max, Math.max(d.min, next)))
    else setDraft(String(value))
  }
  return <div className="parameter-control">
    <div className="parameter-top"><label htmlFor={`parameter-${d.key}`}>{d.label}</label><span>{d.symbol}</span></div>
    <div className="parameter-inputs">
      <input type="range" aria-label={`${d.label} slider`} min={d.min} max={d.max} step={d.step} value={value} onChange={event => onChange(Number(event.target.value))} />
      <input id={`parameter-${d.key}`} type="number" aria-label={d.label} min={d.min} max={d.max} step={d.step} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { commit(); event.currentTarget.blur() } }} />
      <span>{d.unit}</span>
    </div>
    <small>{d.note}</small>
  </div>
}
