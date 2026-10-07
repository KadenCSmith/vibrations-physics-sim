import { PARAMETER_LIMITS, type Parameters, type Snapshot } from '../physics/model';
import { compoundSpringCharacteristics, type SpringParameterKey } from '../physics/compoundSprings';
import { ParameterControl } from '../ui/ParameterControl';
import './SpringInspector.css';

const value = (n: number) => Math.abs(n) < 1e-10 ? '0' : Number(n.toPrecision(4)).toString();
const signed = (n: number) => `${n > 1e-10 ? '+' : ''}${value(n)}`;

export function SpringInspector({ id, index, parameters, snapshot, onChange, onClose }: {
  id: string; index: number; parameters: Parameters; snapshot: Snapshot;
  onChange: (key: SpringParameterKey, value: number) => void; onClose: () => void;
}) {
  const spring = compoundSpringCharacteristics(parameters, snapshot.x, index);
  if (!spring) return null;
  return <section id={id} className="spring-inspector" aria-label="Selected spring characteristics">
    <header><div><span className="eyebrow">SELECTED SPRING / LIVE CHARACTERISTICS</span><h3>{spring.name}</h3></div><button aria-label="Close spring inspector" onClick={onClose}>Close ×</button></header>
    <p className="spring-inspector__connection">{spring.connection}</p>
    <p>{spring.relationship}</p>
    <div className="spring-inspector__layout">
      <ParameterControl key={spring.parameter} definition={{
        key: `${id}-${spring.parameter}`, label: `Stiffness ${spring.symbol}`, symbol: spring.symbol, unit: 'N/m',
        ...PARAMETER_LIMITS[spring.parameter], note: spring.editNote,
      }} value={spring.stiffness} onChange={next => onChange(spring.parameter, next)} />
      <dl>
        <div><dt>Deformation δ</dt><dd>{signed(spring.extension)} <small>m</small></dd></div>
        <div><dt>Force magnitude |F|</dt><dd>{value(spring.forceMagnitude)} <small>N</small></dd></div>
        <div><dt>Vibration energy ½kδ²</dt><dd>{value(spring.vibrationEnergy)} <small>J</small></dd></div>
        <div><dt>Compliance 1/k</dt><dd>{value(spring.compliance)} <small>m/N</small></dd></div>
        {spring.pairStiffness !== undefined && <div><dt>Parallel pair stiffness 2k</dt><dd>{value(spring.pairStiffness)} <small>N/m</small></dd></div>}
      </dl>
    </div>
    <p className="spring-inspector__note">Positive deformation means additional stretch; negative means additional compression. Force and energy describe vibration about loaded equilibrium and exclude static preload. Stiffness edits restart the motion while preserving Play or Pause.</p>
  </section>;
}
