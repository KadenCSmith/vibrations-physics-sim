import { deriveCompoundStiffness, isCompoundProblem, type Model, type Parameters, type Snapshot } from '../physics/model';
import { MathFormula } from '../ui/Math';
import './SpringConnectionsLesson.css';

const value = (n: number) => Number(n.toPrecision(4)).toString();

/** Live comparisons use actual connected groups, rather than their visual orientation. */
export function SpringConnectionsLesson({ parameters: p, model, snapshot: s, onExample }: {
  parameters: Parameters; model: Model; snapshot: Snapshot;
  onExample: (example: 'equal' | 'soft-series') => void;
}) {
  const compound = isCompoundProblem(model.problem);
  const reduced = deriveCompoundStiffness(p);
  const seriesA = compound ? reduced.kParallel : p.k4;
  const seriesB = p.k5;
  const seriesNames = compound ? ['assembly kP', 'final k₅'] : ['k₄', 'k₅'];
  const seriesForce = Math.abs(s.branchForces[compound ? 6 : 3]);
  const seriesExtensions = compound
    ? [s.branchExtensions[5], s.branchExtensions[6]]
    : [s.branchExtensions[3], s.branchExtensions[4]];
  const parallelExtensions = [s.branchExtensions[0], s.branchExtensions[1]];
  const parallelForces = [Math.abs(s.branchForces[0]), Math.abs(s.branchForces[1])];
  const parallelB = compound ? p.k1 : p.k2;
  const upward = model.problem === 'compound-inverted';
  return <section className="spring-connections" aria-label="Series and parallel spring lesson">
    <header><div><span className="eyebrow">READ THE CONNECTIONS</span><h3>Series or parallel?</h3></div><p>k_eq <strong>{value(model.linearStiffness)}</strong> N/m</p></header>
    <p>Follow the endpoints. Parallel paths join the same two nodes; a series chain passes through an unloaded, massless junction.</p>
    {compound && <p>The series card compares the reduced six-spring assembly kP with the final k₅. The parallel card compares the two physical k₁ springs.</p>}
    <div className="spring-connections__grid">
      <article>
        <span className="eyebrow">END TO END / SERIES</span><h4>Same force. Deformations add.</h4>
        <MathFormula tex={String.raw`\frac1{k_s}=\frac1{k_a}+\frac1{k_b}`} />
        <p>A shared force gives δ = F/k, so the softer member changes length more. The combination is softer than either member.</p>
        <div className="spring-connections__values">
          {seriesNames.map((name, i) => <div key={name}><span>{name} · {value(i ? seriesB : seriesA)} N/m</span><output>|F| {value(seriesForce)} N · δ {value(seriesExtensions[i])} m</output></div>)}
        </div>
        <p className="spring-connections__result">Combined series stiffness: {value(seriesA * seriesB / (seriesA + seriesB))} N/m</p>
        <div className="spring-connections__split" aria-label="Share of total series deformation">
          <span style={{ flex: seriesB }} />
          <span style={{ flex: seriesA }} />
        </div>
        <small>{value(100 * seriesB / (seriesA + seriesB))}% / {value(100 * seriesA / (seriesA + seriesB))}% of total deformation, in the order above. δ₁ + δ₂ = {upward || compound ? 'x' : '−x'}.</small>
      </article>
      <article>
        <span className="eyebrow">SAME TWO ENDPOINTS / PARALLEL</span><h4>Same deformation. Forces add.</h4>
        <MathFormula tex={String.raw`k_p=k_a+k_b`} />
        <p>Each spring sees the same endpoint motion. A stiffer spring carries more force. The combination is stiffer than either member.</p>
        <div className="spring-connections__values">
          {[compound ? 'k₁ · left' : 'k₁', compound ? 'k₁ · right' : 'k₂'].map((name, i) => <div key={name}><span>{name} · {value(i ? parallelB : p.k1)} N/m</span><output>δ {value(parallelExtensions[i])} m · |F| {value(parallelForces[i])} N</output></div>)}
        </div>
        <p className="spring-connections__result">Pair stiffness: {value(p.k1 + parallelB)} N/m<br/>Combined force magnitude: {value(parallelForces[0] + parallelForces[1])} N</p>
        <small>{compound ? 'The same rule combines the two k₃ springs and the complete left path with k₄.' : 'k₃ and the complete k₄–k₅ branch also act in parallel with these upper springs.'}</small>
      </article>
    </div>
    <p className="spring-connections__note">Two identical springs of stiffness k give k/2 in series and 2k in parallel. Force and deformation here are vibration increments about loaded equilibrium. {upward ? 'Positive x points upward.' : 'Positive x points downward.'}</p>
    <div className="spring-connections__experiments"><span>Try it:</span><button onClick={() => onExample('equal')}>Compare equal springs</button><button onClick={() => onExample('soft-series')}>Make k₅ softer</button></div>
  </section>;
}
