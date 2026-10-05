import type { Model, Parameters, Snapshot } from '../physics/model';
import { MathFormula } from '../ui/Math';
import './SpringNetworkInfo.css';
import './InvertedPendulumInfo.css';

export type InvertedPendulumInfoProps = { parameters: Parameters; model: Model; snapshot: Snapshot };
function value(n: number): string {
  return !Number.isFinite(n) ? '—' : Math.abs(n) < 1e-9 ? '0' : Number(n.toPrecision(4)).toString();
}
function signed(n: number): string { return `${n > 1e-9 ? '+' : ''}${value(n)}`; }
function tex(n: number): string {
  const [coefficient, exponent] = value(n).split('e');
  return exponent ? `${coefficient}\\times10^{${Number(exponent)}}` : coefficient;
}

export function InvertedPendulumInfo({ parameters: p, model, snapshot: s }: InvertedPendulumInfoProps) {
  const springCoefficient = 2 * p.k * p.l ** 2;
  const gravityCoefficient = p.m * p.g * p.l / 2;
  const coefficient = springCoefficient - gravityCoefficient;
  const tolerance = 1e-10 * Math.max(1, springCoefficient, gravityCoefficient);
  const stable = coefficient > tolerance, unstable = coefficient < -tolerance;
  const thetaDraw = Math.max(-Math.PI / 15, Math.min(Math.PI / 15, s.theta));
  const xLinear = p.l * s.theta;
  const topGeometry = p.l * Math.sin(thetaDraw);

  return <details className="spring-network-info inverted-pendulum-info">
    <summary>more info</summary>
    <div className="spring-network-info__content">
      <header className="spring-network-info__heading">
        <span className="eyebrow">INSIDE THE INVERTED UNIFORM BAR</span>
        <h3>Two springs restore. Gravity tips.</h3>
        <p>The rod carries mass uniformly along its length. Its center of mass is halfway up from the bottom pivot; both springs attach at the top. Each spring has stiffness k, so the two together provide twice one spring’s restoring contribution.</p>
      </header>

      <div className="spring-network-info__overview">
        <section>
          <h4>1 / Use the inertia of a uniform rod</h4>
          <MathFormula tex={String.raw`J_0=\frac13m\ell^2,\qquad r_{\mathrm{CG}}=\frac\ell2`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`J_0=\frac13(${tex(p.m)})(${tex(p.l)})^2=${tex(model.inertia)}\;\mathrm{kg\,m^2}`} />
          <p>This is not a point mass at the top. The pivot inertia and gravity’s lever arm both depend on the distributed mass.</p>
          <MathFormula tex={String.raw`T=\tfrac12J_0\dot\theta^2`} />
        </section>
        <section>
          <h4>2 / Resolve top and center-of-mass motion</h4>
          <MathFormula tex={String.raw`\begin{aligned}x_{\mathrm{top}}&\approx\ell\theta\\x_{\mathrm{CG}}&\approx\tfrac12\ell\theta\\x_{\mathrm{drawing}}&=\ell\sin\theta\end{aligned}`} />
          <dl className="inverted-pendulum-info__values">
            <div><dt>Linear top coordinate ℓθ</dt><dd>{signed(xLinear)} <small>m</small></dd></div>
            <div><dt>Linear CG coordinate ℓθ/2</dt><dd>{signed(xLinear / 2)} <small>m</small></dd></div>
            <div><dt>Drawn top coordinate ℓ sin θ</dt><dd>{signed(topGeometry)} <small>m</small></dd></div>
          </dl>
          <p>Dynamics use the small-angle coordinates; the drawing preserves rod geometry and is limited to ±12°. Angles in these formulas are radians.</p>
        </section>
      </div>

      <section aria-label="Two identical spring contributions">
        <h4>3 / Each spring contributes a restoring torque</h4>
        <div className="inverted-pendulum-info__spring-pair">
          <article className="spring-network-info__spring">
            <header><h5>Left spring</h5><span>STIFFNESS k</span></header>
            <p className="spring-network-info__stiffness"><strong>{value(p.k)}</strong><span> N/m</span></p>
            <MathFormula tex={String.raw`\delta_L\approx+\ell\theta,\quad F_{L,x}=-k\ell\theta`} />
            <dl><div><dt>Signed deformation</dt><dd>{signed(xLinear)} <small>m</small></dd></div>
              <div><dt>Horizontal force on the rod</dt><dd>{signed(-p.k * xLinear)} <small>N</small></dd></div></dl>
          </article>
          <article className="spring-network-info__spring">
            <header><h5>Right spring</h5><span>STIFFNESS k</span></header>
            <p className="spring-network-info__stiffness"><strong>{value(p.k)}</strong><span> N/m</span></p>
            <MathFormula tex={String.raw`\delta_R\approx-\ell\theta,\quad F_{R,x}=-k\ell\theta`} />
            <dl><div><dt>Signed deformation</dt><dd>{signed(-xLinear)} <small>m</small></dd></div>
              <div><dt>Horizontal force on the rod</dt><dd>{signed(-p.k * xLinear)} <small>N</small></dd></div></dl>
          </article>
        </div>
        <MathFormula tex={String.raw`\begin{aligned}
          \tau_L=\tau_R&\approx-k\ell^2\theta\\
          F_{s,x}&=-2k\ell\theta\\
          \tau_s&=-2k\ell^2\theta
        \end{aligned}`} />
        <p>For a rightward tilt, the left spring stretches and the right spring compresses. Both exert leftward force on the rod. Their deformation signs differ, but their restoring torques add.</p>
      </section>

      <div className="spring-network-info__overview">
        <section>
          <h4>4 / Gravity acts halfway along the rod</h4>
          <MathFormula tex={String.raw`\tau_g=+mg\frac\ell2\sin\theta\approx+mg\frac\ell2\theta`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`\begin{aligned}\tau_g&=+${tex(gravityCoefficient)}(${tex(s.theta)})\\&=${tex(s.gravityTorque)}\;\mathrm{N\,m}\\\tau_s&=-${tex(springCoefficient)}(${tex(s.theta)})\\&=${tex(s.springTorque)}\;\mathrm{N\,m}\end{aligned}`} />
          <p>Gravity’s torque points in the same direction as a small tilt, so it destabilizes the upright position. The springs oppose the tilt.</p>
        </section>
        <section>
          <h4>5 / Compare the competing torque coefficients</h4>
          <MathFormula tex={String.raw`\begin{aligned}C&=2k\ell^2-\frac{mg\ell}{2}\\J_0\ddot\theta+C\theta&=0\end{aligned}`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`C=${tex(springCoefficient)}-${tex(gravityCoefficient)}=${tex(coefficient)}\;\mathrm{N\,m/rad}`} />
          {model.massless ? <p>With zero mass, J₀ = 0. The force equation is a static constraint and does not determine angular acceleration. If k is also zero, it reduces to 0 = 0 and selects no unique angle.</p>
            : stable ? <>
              <MathFormula tex={String.raw`C>0:\quad\omega_n=\sqrt{\frac C{J_0}}=\sqrt{\frac{6k}{m}-\frac{3g}{2\ell}}`} />
              <p><strong>Stable:</strong> the springs dominate and small motions oscillate about upright.</p>
            </> : unstable ? <>
              <MathFormula tex={String.raw`C<0:\quad\ddot\theta=\lambda^2\theta,\quad\lambda=\sqrt{-C/J_0}`} />
              <p><strong>Unstable:</strong> gravity dominates. A release away from upright grows rather than oscillates; the scene stops at the small-angle limit.</p>
            </> : <>
              <MathFormula tex={String.raw`C=0:\quad\ddot\theta=0`} />
              <p><strong>Neutral in the linear model:</strong> the two torque coefficients balance. A release from rest stays at its initial angle. There is no oscillation period.</p>
            </>}
          <MathFormula tex={String.raw`k_{\mathrm{critical}}=\frac{mg}{4\ell}=${tex(p.m * p.g / (4 * p.l))}\;\mathrm{N/m}`} />
          <p>This threshold is the stiffness of <strong>each</strong> spring, not their sum.</p>
        </section>
      </div>

      <section className="inverted-pendulum-info__energy">
        <h4>Energy explains the sign</h4>
        <MathFormula tex={String.raw`\begin{aligned}
          U_s&=\tfrac12k(\ell\theta)^2+\tfrac12k(-\ell\theta)^2=k\ell^2\theta^2\\
          U_g-U_g(0)&=\frac{mg\ell}{2}(\cos\theta-1)\approx-\frac{mg\ell}{4}\theta^2\\
          U-U(0)&=\tfrac12C\theta^2,\qquad E=\tfrac12J_0\dot\theta^2+\tfrac12C\theta^2
        \end{aligned}`} />
        <p>Tilting the upright bar lowers its center of mass, so gravitational potential decreases. The springs store more energy. Positive C gives a local energy minimum; negative C gives a local maximum.</p>
      </section>
    </div>
  </details>;
}

export default InvertedPendulumInfo;
