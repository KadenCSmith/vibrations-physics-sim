import type { Model, Parameters, Snapshot } from '../physics/model';
import { MathFormula } from '../ui/Math';
import './SpringNetworkInfo.css';

export type SpringNetworkInfoProps = {
  parameters: Parameters;
  model: Model;
  snapshot: Snapshot;
};

function value(number: number, precision = 4): string {
  if (!Number.isFinite(number)) return '—';
  if (Math.abs(number) < 1e-9) return '0';
  return Number(number.toPrecision(precision)).toString();
}

function signed(number: number): string {
  const formatted = value(number);
  return number > 1e-9 ? `+${formatted}` : formatted;
}

function tex(number: number): string {
  const [coefficient, exponent] = value(number).split('e');
  return exponent ? `${coefficient}\\times10^{${Number(exponent)}}` : coefficient;
}

function springPath(start: number, end: number, y: number): string {
  const coilStart = start + 11;
  const coilEnd = end - 11;
  const segments = 10;
  let path = `M ${start} ${y} H ${coilStart}`;
  for (let i = 1; i < segments; i++) {
    path += ` L ${coilStart + (coilEnd - coilStart) * i / segments} ${y + (i % 2 ? -5 : 5)}`;
  }
  return path + ` L ${coilEnd} ${y} H ${end}`;
}

function ConnectionMap() {
  return <svg className="spring-network-info__map" viewBox="0 0 400 183" role="img"
    aria-label="Four parallel paths join ground to mass: k1, k2, k3, and the series path k5 then k4.">
    <g className="spring-network-info__map-rails">
      <path d="M24 27V156M376 27V156" />
      {[35, 72, 109, 146].map(y => <path key={y} d={`M24 ${y}H85M315 ${y}H376`} />)}
      {[1, 2, 3].map((spring, i) => <path key={spring} d={springPath(85, 315, 35 + 37 * i)} />)}
    </g>
    <g className="spring-network-info__map-series">
      <path d={springPath(85, 185, 146)} />
      <path d={springPath(215, 315, 146)} />
      <path d="M185 146H215" />
      <circle cx="200" cy="146" r="3" />
    </g>
    <g className="spring-network-info__map-labels">
      <text x="24" y="16" textAnchor="middle">ground</text>
      <text x="376" y="16" textAnchor="middle">mass</text>
      <text x="200" y="25" textAnchor="middle">k₁</text>
      <text x="200" y="62" textAnchor="middle">k₂</text>
      <text x="200" y="99" textAnchor="middle">k₃</text>
      <text x="135" y="133" textAnchor="middle">k₅</text>
      <text x="265" y="133" textAnchor="middle">k₄</text>
      <text x="200" y="175" textAnchor="middle">one series branch · one force contribution</text>
    </g>
  </svg>;
}

/** Network-only explanation of the live spring values and four restoring-force paths. */
export function SpringNetworkInfo({ parameters: p, model, snapshot: s }: SpringNetworkInfoProps) {
  const stiffnesses = [p.k1, p.k2, p.k3, p.k4, p.k5];
  const paths = ['Upper direct path', 'Upper direct path', 'Lower direct path', 'Series path · next to mass', 'Series path · next to ground'];
  const subscripts = ['₁', '₂', '₃', '₄', '₅'];
  const signedBranchForces = [s.branchForces[0] ?? 0, s.branchForces[1] ?? 0, s.branchForces[2] ?? 0, s.branchForces[3] ?? 0];

  return <details className="spring-network-info">
    <summary>Spring-by-spring details &amp; reduction</summary>
    <div className="spring-network-info__content">
      <header className="spring-network-info__heading">
        <span className="eyebrow">INSIDE THE SPRING NETWORK</span>
        <h3>Five springs. Four paths to ground.</h3>
        <p>k₁, k₂ and k₃ each connect the mass directly to ground. k₄ and k₅ connect end to end, making one series branch. All four complete paths act in parallel.</p>
      </header>

      <div className="spring-network-info__overview">
        <section className="spring-network-info__connection" aria-label="Spring connectivity">
          <h4>How they connect</h4>
          <ConnectionMap />
          <p className="spring-network-info__caption">Connection map; orientation is simplified. The live scene shows the actual upper and lower positions.</p>
          <p>Parallel paths span the same mass-to-ground displacement magnitude. Springs in series share the same branch-force magnitude, while their deformations split.</p>
        </section>

        <section className="spring-network-info__reduction" aria-label="Equivalent stiffness calculation">
          <h4>1 / Combine the series pair</h4>
          <MathFormula tex={String.raw`k_{45}=\frac{k_4k_5}{k_4+k_5}`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`k_{45}=\frac{${tex(p.k4)}\cdot${tex(p.k5)}}{${tex(p.k4)}+${tex(p.k5)}}=${tex(model.k45)}\;\mathrm{N/m}`} />
          <p>The series pair is softer than either individual spring.</p>
          <h4>2 / Add the four parallel paths</h4>
          <MathFormula tex={String.raw`k_{\mathrm{eq}}=k_1+k_2+k_3+k_{45}`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`\begin{aligned}k_{\mathrm{eq}}&=${tex(p.k1)}+${tex(p.k2)}+${tex(p.k3)}+${tex(model.k45)}\\&=${tex(model.linearStiffness)}\;\mathrm{N/m}\end{aligned}`} />
        </section>
      </div>

      <section aria-label="Each spring’s current values">
        <div className="spring-network-info__section-heading"><h4>Each spring, at this instant</h4><span>t = {value(s.time)} s</span></div>
        <p>Stiffness is a physical setting. Deformation δ is the signed change from loaded equilibrium: positive means longer, negative means shorter. Force magnitudes below are the vibration contributions, excluding static preload.</p>
        <div className="spring-network-info__springs">
          {stiffnesses.map((stiffness, index) => <article className={`spring-network-info__spring${index >= 3 ? ' spring-network-info__spring--series' : ''}`} key={index}>
            <header><h5>k{subscripts[index]}</h5><span>{index >= 3 ? 'SERIES' : 'DIRECT'}</span></header>
            <p className="spring-network-info__stiffness"><strong>{value(stiffness)}</strong><span> N/m</span></p>
            <p className="spring-network-info__path">{paths[index]}</p>
            <dl>
              <div><dt>Deformation δ{subscripts[index]}</dt><dd>{signed(s.branchExtensions[index] ?? 0)} <small>m</small></dd></div>
              <div><dt>Force magnitude |F{subscripts[index]}|</dt><dd>{value(Math.abs(s.branchForces[index] ?? 0))} <small>N</small></dd></div>
            </dl>
          </article>)}
        </div>
        <p className="spring-network-info__series-note">k₄ and k₅ show the same force magnitude because their joining point has no mass. Count this series force once when summing forces on the mass. The softer of the pair deforms more.</p>
      </section>

      <section className="spring-network-info__force" aria-label="Total restoring force without double counting">
        <div>
          <h4>The restoring force on the mass</h4>
          <p>x is positive downward from loaded equilibrium. The upper springs lengthen for positive x; the lower paths shorten. Every path still pushes or pulls the mass toward x = 0.</p>
          <MathFormula tex={String.raw`\begin{aligned}F_{\mathrm{restoring}}&=F_1+F_2+F_3+F_{45}\\&=-k_1x-k_2x-k_3x-k_{45}x\\&=-k_{\mathrm{eq}}x\end{aligned}`} />
        </div>
        <div className="spring-network-info__force-values">
          <dl>
            <div><dt>Current displacement x</dt><dd>{signed(s.x)} <small>m</small></dd></div>
            {['Direct path k₁', 'Direct path k₂', 'Direct path k₃', 'Series path k₄–k₅'].map((label, index) =>
              <div key={label}><dt>{label}</dt><dd>{signed(signedBranchForces[index])} <small>N</small></dd></div>)}
            <div className="spring-network-info__force-total"><dt>Total restoring force</dt><dd>{signed(s.force)} <small>N</small></dd></div>
          </dl>
          <p>These four signed contributions add. A negative total points upward; a positive total points downward. Displayed values are rounded.</p>
        </div>
      </section>
    </div>
  </details>;
}

export default SpringNetworkInfo;
