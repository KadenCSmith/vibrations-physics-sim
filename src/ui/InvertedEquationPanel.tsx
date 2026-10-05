import { useId, useState } from 'react';
import type { Model, Parameters, Snapshot } from '../physics/model';
import { MathFormula } from './Math';
import './inverted-equations.css';

type Props = { parameters: Parameters; model: Model; snapshot: Snapshot };
type Tab = 'motion' | 'energy' | 'lagrange';
const tabLabels: Record<Tab, string> = { motion: 'Motion', energy: 'Energy method', lagrange: 'Lagrange' };

function format(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1e-11) return '0';
  return Number(value.toPrecision(digits)).toString();
}

function texNumber(value: number): string {
  const [coefficient, exponent] = format(value).split('e');
  return exponent ? `${coefficient}\\times10^{${Number(exponent)}}` : coefficient;
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${format(value)}`;
}

function Factor({ label, symbol, value, unit, changing = false }: {
  label: string; symbol: string; value: number; unit: string; changing?: boolean;
}) {
  return <div className={`live-factor live-factor-${changing ? 'position' : 'fixed'}`}>
    <span>{label}</span>
    <div className="live-factor-value"><MathFormula inline tex={symbol} /><span> = </span><output>{format(value)}<small> {unit}</small></output></div>
    <small>{changing ? 'Changes with time' : 'Fixed during this run'}</small>
  </div>;
}

function SignedEnergy({ label, value, scale, className }: {
  label: string; value: number; scale: number; className: string;
}) {
  const width = Math.min(50, Math.abs(value) / scale * 50);
  return <div className={`energy-row ${className}`}>
    <div className="energy-row-label"><span>{label}</span><output>{signed(value)} J</output></div>
    <div className="inverted-signed-energy-track" role="meter" aria-label={label}
      aria-valuemin={-scale} aria-valuemax={scale} aria-valuenow={value}
      aria-valuetext={`${format(value)} joules`}>
      <span className="inverted-signed-energy-zero" />
      <span className="inverted-signed-energy-fill" style={{ left: `${value < 0 ? 50 - width : 50}%`, width: `${width}%` }} />
    </div>
  </div>;
}

export function InvertedEquationPanel({ parameters: p, model, snapshot: s }: Props) {
  const [tab, setTab] = useState<Tab>('motion');
  const tabId = useId();
  const inertia = p.m * p.l ** 2 / 3;
  const springCoefficient = 2 * p.k * p.l ** 2;
  const gravityCoefficient = p.m * p.g * p.l / 2;
  const c = model.coordinateStiffness;
  const critical = p.m * p.g / (4 * p.l);
  const stability = model.stability ?? (model.massless ? p.k > 0 ? 'constraint' : 'free' : c > 0 ? 'stable' : c < 0 ? 'unstable' : 'neutral');
  const dynamic = !model.massless;
  const boundary = model.smallAngleEndTime;
  const energyScale = Math.max(Math.abs(s.kinetic), Math.abs(s.springPotential), Math.abs(s.gravityPotential), 1e-12);
  const status = {
    stable: 'Stable · springs overcome gravity',
    neutral: 'Neutral · linear restoring terms cancel',
    unstable: 'Unstable · gravity overcomes the springs',
    constraint: 'Zero mass · static spring constraint',
    free: 'Zero mass and zero springs · motion undetermined',
  }[stability];

  return <aside className="equation-panel inverted-equation-panel" aria-label="Inverted uniform bar equations and derivations">
    <div className="equation-panel-heading">
      <div><span className="eyebrow">04 / INVERTED UNIFORM BAR</span><h2>Equation of motion</h2></div>
      {dynamic && <span className="live-equation-label"><span className="live-dot" /> Live</span>}
    </div>
    <section className="equation-card eom-card" aria-label="Linear equation and angular acceleration">
      <p className="equation-card-kicker">{status}</p>
      <MathFormula tex={String.raw`\frac13mL^2\ddot\theta+\left(2kL^2-\frac{mgL}{2}\right)\theta=0`} />
      <div className={`angular-acceleration-readout${dynamic ? '' : ' acceleration-undetermined'}`}>
        <span>Angular acceleration · {dynamic ? 'current linear prediction' : 'no inertial equation'}</span>
        <MathFormula tex={dynamic
          ? String.raw`\ddot\theta=${texNumber(s.thetaDDot)}\;\mathrm{rad/s^2}`
          : String.raw`\ddot\theta=\text{undetermined}`} />
      </div>
      <p className="equation-note">A uniform bar rotates about its lower pivot. Gravity tips it away from upright, while the two identical springs pull it back. The animation uses the requested small-angle, linear model.</p>
      <div className="live-substitution-heading"><span>{dynamic ? 'Substitute this instant' : 'Static constraint values'}</span><output>t = {format(s.time)} s</output></div>
      <div className="live-factor-grid">
        <Factor label="Uniform-bar inertia" symbol={String.raw`J_O=mL^2/3`} value={inertia} unit="kg·m²" />
        <Factor label="Net angular stiffness" symbol="C" value={c} unit="N·m/rad" />
        <Factor label={dynamic ? 'Angle from upright' : 'Illustrated angle'} symbol={String.raw`\theta`} value={s.theta} unit="rad" changing={dynamic} />
        <Factor label="Angle in degrees" symbol={String.raw`\theta`} value={s.theta * 180 / Math.PI} unit="°" changing={dynamic} />
        <Factor label="Two-spring coefficient" symbol={String.raw`2kL^2`} value={springCoefficient} unit="N·m/rad" />
        <Factor label="Gravity coefficient" symbol={String.raw`mgL/2`} value={gravityCoefficient} unit="N·m/rad" />
      </div>
      {dynamic ? <>
        <MathFormula className="numeric-substitution" tex={String.raw`\begin{aligned}
          \ddot\theta&=-\frac{\underbrace{${texNumber(c)}}_{C}}{\underbrace{${texNumber(inertia)}}_{J_O}}\underbrace{(${texNumber(s.theta)})}_{\theta}\\
          &=${texNumber(s.thetaDDot)}\;\mathrm{rad/s^2}\\
          \underbrace{${texNumber(inertia)}}_{J_O}\underbrace{(${texNumber(s.thetaDDot)})}_{\ddot\theta}&+\underbrace{${texNumber(c)}}_{C}\underbrace{(${texNumber(s.theta)})}_{\theta}=${texNumber(s.residual)}\;\mathrm{N\,m}
        \end{aligned}`} />
        <div className="equation-term-grid inverted-torque-grid">
          <div className="equation-term gravity-term"><span>τg = +(mgL/2)θ</span><output>{signed(s.gravityTorque)}</output><small>N·m · destabilizing</small></div>
          <div className="equation-term restoring-term"><span>τs = −2kL²θ</span><output>{signed(s.springTorque)}</output><small>N·m · restoring</small></div>
          <div className="equation-term inertia-term"><span>J₀ θ̈ = τg + τs</span><output>{signed(s.inertialTerm)}</output><small>N·m · net torque</small></div>
        </div>
        <MathFormula className="numeric-substitution" tex={String.raw`J_O\ddot\theta-\tau_g-\tau_s=${texNumber(s.residual)}\;\mathrm{N\,m}`} />
        <p className="equation-note rounding-note">The torque signs are physical directions. Cθ is the restoring term on the equation’s left side. Displayed numbers are rounded; the balance uses full precision.</p>
      </> : <>
        <MathFormula tex={stability === 'constraint' ? String.raw`2kL^2\theta=0\;\Longrightarrow\;\theta=0` : String.raw`m=k=0\;\Longrightarrow\;0=0`} />
        <p className="equation-note">{stability === 'constraint'
          ? 'Zero inertia leaves a spring-force constraint, so the bar is shown upright. A displaced release cannot generate an inertial oscillation at zero mass.'
          : 'With no mass and no springs, every term vanishes. The equation selects neither a unique angle nor an acceleration. Holding the shown angle is an illustrative display choice.'} No oscillation frequency or period is assigned.</p>
      </>}
    </section>

    <div className="equation-tabs" role="tablist" aria-label="Explore the five requested results">
      {(['motion', 'energy', 'lagrange'] as Tab[]).map(item => <button key={item} type="button" role="tab"
        id={`${tabId}-${item}`} aria-selected={tab === item} aria-controls={`${tabId}-content`}
        tabIndex={tab === item ? 0 : -1} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}
        onKeyDown={event => {
          const tabs: Tab[] = ['motion', 'energy', 'lagrange'];
          const current = tabs.indexOf(item);
          const next = event.key === 'ArrowRight' ? (current + 1) % tabs.length
            : event.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length
              : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault();
          setTab(tabs[next]);
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}>{tabLabels[item]}</button>)}
    </div>
    <div className="equation-tab-content" role="tabpanel" id={`${tabId}-content`} aria-labelledby={`${tabId}-${tab}`}>
      {tab === 'motion' && <>
        <section className="equation-card">
          <p className="equation-card-kicker">Classify stability before calculating frequency</p>
          <MathFormula tex={String.raw`C=2kL^2-\frac{mgL}{2},\qquad k_{\mathrm{crit}}=\frac{mg}{4L}`} />
          <div className="equation-metrics">
            <div><span>Each spring / k</span><output>{format(p.k)}<small> N/m</small></output></div>
            <div><span>Critical value / k_crit</span><output>{format(critical)}<small> N/m</small></output></div>
            <div><span>Net stiffness / C</span><output>{format(c)}<small> N·m/rad</small></output></div>
          </div>
          <p className="equation-note">For positive mass: C &gt; 0 gives stable oscillation, C = 0 is neutral in the linear model, and C &lt; 0 is unstable. Neutral behavior here does not establish finite-angle stability.</p>
        </section>
        <section className="equation-card frequency-card">
          <p className="equation-card-kicker">3 / rad/s · 4 / Hz · 5 / period</p>
          {stability === 'stable' ? <>
            <MathFormula tex={String.raw`\omega_n=\sqrt{\frac C{J_O}}=\sqrt{\frac{6k}{m}-\frac{3g}{2L}}`} />
            <div className="equation-metrics">
              <div><span>3 / ωₙ — angular natural frequency</span><output>{format(model.omega)}<small> rad/s</small></output></div>
              <div><span>4 / fₙ = ωₙ / 2π</span><output>{format(model.frequency)}<small> Hz</small></output></div>
              <div><span>5 / Tₙ = 2π / ωₙ</span><output>{format(model.period)}<small> s</small></output></div>
            </div>
            <p className="equation-note">These are real oscillation quantities because C is positive. As C approaches zero from above, the period grows without bound.</p>
          </> : stability === 'neutral' ? <>
            <MathFormula tex={String.raw`C=0,\quad\omega_n=0\;\mathrm{rad/s},\quad f_n=0\;\mathrm{Hz}`} />
            <p className="equation-note">There is no finite oscillation period. This linear model has zero restoring frequency and permits constant-rate angular drift.</p>
          </> : stability === 'unstable' ? <>
            <MathFormula tex={String.raw`\lambda=\sqrt{-C/J_O}=${texNumber(model.growthRate ?? 0)}\;\mathrm{s^{-1}}`} />
            <p className="equation-note">This is a growth rate, not a natural oscillation frequency. The upright equilibrium has no real oscillatory frequency in rad/s or Hz and no oscillation period. The response contains exponential growth and decay.</p>
          </> : <p className="equation-note">Frequency in rad/s, frequency in Hz, and period are not defined for a zero-inertia constraint or identity. Choose positive mass to recover a dynamic equation.</p>}
        </section>
        {dynamic && <section className="equation-card">
          <p className="equation-card-kicker">Response from the initial angle and angular velocity</p>
          {stability === 'stable' ? <MathFormula tex={String.raw`\begin{aligned}\theta(t)&=\theta_0\cos(\omega_nt)\\&+\frac{\dot\theta_0}{\omega_n}\sin(\omega_nt)\end{aligned}`} />
            : stability === 'neutral' ? <MathFormula tex={String.raw`\theta(t)=\theta_0+\dot\theta_0t,\qquad\ddot\theta=0`} />
              : <MathFormula tex={String.raw`\begin{aligned}\theta(t)&=\theta_0\cosh(\lambda t)\\&+\frac{\dot\theta_0}{\lambda}\sinh(\lambda t)\\\ddot\theta&=\lambda^2\theta\end{aligned}`} />}
          <div className="geometry-readouts">
            <div><span>Initial angle θ₀</span><output>{format(model.initialCoordinate)} rad</output></div>
            <div><span>Initial angular velocity θ̇₀</span><output>{format(model.initialRate)} rad/s</output></div>
          </div>
          <p className="equation-note">The model is intended for small angles. Playback stops at ±12° if the response reaches that boundary; unstable growth is not wrapped into an oscillation.</p>
          {boundary !== undefined && Number.isFinite(boundary) && <p className="equation-note">This release reaches the small-angle boundary at <strong>{format(boundary)} s</strong>.</p>}
        </section>}
      </>}

      {tab === 'energy' && <>
        <section className="equation-card">
          <p className="equation-card-kicker">1a / Write kinetic and potential energy</p>
          <MathFormula tex={String.raw`J_O=\frac13mL^2,\qquad T=\tfrac12J_O\dot\theta^2`} />
          <MathFormula tex={String.raw`\begin{aligned}U_s&=\tfrac12k(L\theta)^2+\tfrac12k(-L\theta)^2\\&=kL^2\theta^2\\U_g&=-\frac{mgL}{4}\theta^2\end{aligned}`} />
          <MathFormula tex={String.raw`U=\tfrac12\left(2kL^2-\frac{mgL}{2}\right)\theta^2=\tfrac12C\theta^2`} />
          <p className="equation-note">Both springs store positive energy. The center of gravity drops when the bar tips, so gravity potential is negative relative to the upright state. The bar’s kinetic energy uses its distributed pivot inertia.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">1b / Differentiate conserved energy to obtain the EOM</p>
          <MathFormula tex={String.raw`\begin{aligned}E&=\tfrac12J_O\dot\theta^2+\tfrac12C\theta^2\quad\text{constant}\\\frac{dE}{dt}&=J_O\dot\theta\ddot\theta+C\theta\dot\theta\\&=\dot\theta(J_O\ddot\theta+C\theta)=0\end{aligned}`} />
          <MathFormula tex={String.raw`\frac13mL^2\ddot\theta+\left(2kL^2-\frac{mgL}{2}\right)\theta=0`} />
          <p className="equation-note">Use the nonzero-velocity portions of motion to obtain the bracketed EOM, then continue it through isolated turning points. Do not divide by zero when θ̇ = 0; Lagrange’s method gives the equation directly there.</p>
        </section>
        <section className="equation-card energy-card">
          <p className="equation-card-kicker">Signed energy at this instant</p>
          <SignedEnergy label="Kinetic energy T" value={s.kinetic} scale={energyScale} className="kinetic-energy" />
          <SignedEnergy label="Two-spring potential U_s" value={s.springPotential} scale={energyScale} className="spring-energy" />
          <SignedEnergy label="Gravity potential U_g" value={s.gravityPotential} scale={energyScale} className="gravity-energy" />
          <div className="inverted-energy-axis"><span>Negative</span><span>0</span><span>Positive</span></div>
          <div className="energy-total"><span>Total E = T + U_s + U_g</span><output>{signed(s.totalEnergy)} J</output></div>
          <p className="equation-note">The center line is zero; values to its left are negative. Total energy can be negative for an unstable release. Conservation does not imply stability: growing kinetic energy can be balanced by increasingly negative potential.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">Geometric reference → small-angle model</p>
          <MathFormula tex={String.raw`U_{\mathrm{geom}}=kL^2\sin^2\theta+\frac{mgL}{2}(\cos\theta-1)`} />
          <MathFormula tex={String.raw`\sin^2\theta\approx\theta^2,\qquad\cos\theta-1\approx-\tfrac12\theta^2`} />
          <p className="equation-note">This exact geometric potential is a derivation reference. It is not the animated nonlinear model. Its quadratic expansion is the potential used in the live energy display.</p>
        </section>
      </>}

      {tab === 'lagrange' && <>
        <section className="equation-card">
          <p className="equation-card-kicker">2a / Use the supplied Lagrange equation</p>
          <MathFormula tex={String.raw`\frac{d}{dt}\left(\frac{\partial T}{\partial\dot q_i}\right)-\frac{\partial T}{\partial q_i}+\frac{\partial U}{\partial q_i}=0`} />
          <MathFormula tex={String.raw`q_i=\theta,\qquad T=\tfrac12J_O\dot\theta^2,\qquad U=\tfrac12C\theta^2`} />
          <p className="equation-note">This is the exact T-and-U form in the supplied reference. Treat θ and θ̇ as independent variables for the partial derivatives.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">2b / Evaluate the three terms</p>
          <MathFormula tex={String.raw`\begin{aligned}\frac{\partial T}{\partial\dot\theta}&=J_O\dot\theta\\\frac{d}{dt}\left(\frac{\partial T}{\partial\dot\theta}\right)&=J_O\ddot\theta\\\frac{\partial T}{\partial\theta}&=0\\\frac{\partial U}{\partial\theta}&=2kL^2\theta-\frac{mgL}{2}\theta=C\theta\end{aligned}`} />
          <p className="equation-note">J₀ is constant. T has no explicit angle dependence, and differentiating each quadratic potential term gives its signed angular-stiffness contribution.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">2c / Substitute and recover the same EOM</p>
          <MathFormula tex={String.raw`\begin{aligned}J_O\ddot\theta-0+C\theta&=0\\\frac13mL^2\ddot\theta+\left(2kL^2-\frac{mgL}{2}\right)\theta&=0\end{aligned}`} />
          <p className="equation-note">Both requested methods agree. For positive mass, dividing by J₀ gives θ̈ + (6k/m − 3g/2L)θ = 0. The sign of that coefficient determines the regime shown in Motion.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">Reference only / Differentiate before linearizing</p>
          <MathFormula tex={String.raw`\frac{\partial U_{\mathrm{geom}}}{\partial\theta}=2kL^2\sin\theta\cos\theta-\frac{mgL}{2}\sin\theta`} />
          <p className="equation-note">The chain rule gives d(sin²θ)/dθ = 2 sin θ cos θ and d(cos θ)/dθ = −sin θ. Substituting sin θ ≈ θ and cos θ ≈ 1 gives Cθ. The animation uses this linear result.</p>
        </section>
      </>}
    </div>
    <p className="equation-panel-footnote">SI units · uniform bar · two identical springs · linear small-angle dynamics · illustrative values</p>
  </aside>;
}
