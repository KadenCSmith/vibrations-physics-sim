import { useId, useState } from 'react';
import type { Model, Parameters, PendulumMode, ProblemId, Snapshot } from '../physics/model';
import { MathFormula } from './Math';

type EquationPanelProps = {
  problem: ProblemId;
  parameters: Parameters;
  model: Model;
  snapshot: Snapshot;
  mode?: PendulumMode;
};

type EquationTab = 'motion' | 'derivation' | 'energy';
type DerivationMethod = 'newton' | 'lagrange';

function number(value: number, precision = 3): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1e-10) return '0';
  return Number(value.toPrecision(precision)).toString();
}

function texNumber(value: number, precision = 3): string {
  const result = number(value, precision);
  const [coefficient, exponent] = result.split('e');
  return exponent ? `${coefficient}\\times 10^{${Number(exponent)}}` : result;
}

function withSign(value: number): string {
  return `${value >= 0 ? '+' : ''}${number(value)}`;
}

function EnergyBar({ label, value, total, className }: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const proportion = total > 0 ? Math.max(0, Math.min(100, value / total * 100)) : 0;
  return <div className={`energy-row ${className}`}>
    <div className="energy-row-label"><span>{label}</span><output>{number(value)} J</output></div>
    <div className="energy-bar-track" role="meter" aria-label={label} aria-valuemin={0}
      aria-valuemax={total || 1} aria-valuenow={Math.max(0, value)} aria-valuetext={`${number(value)} joules`}>
      <div className="energy-bar-fill" style={{ width: `${proportion}%` }} />
    </div>
  </div>;
}

function LiveFactor({ label, symbol, value, unit, changing = false, kind = 'fixed' }: {
  label: string; symbol: string; value: number; unit: string;
  changing?: boolean; kind?: 'fixed' | 'position' | 'acceleration';
}) {
  return <div className={`live-factor live-factor-${kind}`}>
    <span>{label}</span>
    <div className="live-factor-value"><MathFormula inline tex={symbol} /><span> = </span><output>{number(value, 4)}<small> {unit}</small></output></div>
    <small>{changing ? 'Changes with time' : 'Fixed during this run'}</small>
  </div>;
}

function MasslessEquationPanel({ problem, parameters: p, snapshot: s, model, mode }: EquationPanelProps) {
  const isPendulum = problem === 'pendulum';
  const isTrig = isPendulum && mode === 'trig';
  const degenerate = isPendulum && p.k === 0;
  return <aside className="equation-panel massless-equation-panel" aria-label="Zero-mass static constraint">
    <div className="equation-panel-heading">
      <div><span className="eyebrow">ZERO-MASS LIMIT</span><h2>Static force balance</h2></div>
    </div>
    <section className="equation-card eom-card">
      <p className="equation-card-kicker">m = 0 · no vibration model</p>
      <MathFormula tex={isPendulum
        ? degenerate ? String.raw`J_0=0,\qquad 0=0`
          : isTrig
            ? String.raw`-k\ell^2\sin\theta\cos\theta=0,\quad J_0=0`
            : String.raw`-k\ell^2\theta=0,\quad J_0=0`
        : String.raw`k_{\mathrm{eq}}x=0,\qquad m=0`} />
      <div className="angular-acceleration-readout acceleration-undetermined">
        <span>{isPendulum ? 'Angular acceleration' : 'Acceleration'} · no inertial equation</span>
        <MathFormula tex={isPendulum
          ? String.raw`\ddot\theta=\text{undetermined}`
          : String.raw`\ddot x=\text{undetermined}`} />
      </div>
      <p className="equation-note">With zero mass, the equation cannot determine acceleration: its inertia coefficient is zero. This view shows a static constraint instead of dividing by zero or calculating an oscillation.</p>
      {degenerate ? <p className="equation-note">The spring stiffness is also zero, so gravity, spring torque and inertia all vanish. The identity 0 = 0 selects no unique angle. The shown position is an illustration, not a predicted time response.</p>
        : <><MathFormula tex={isPendulum ? String.raw`\theta=0\quad\text{(hanging equilibrium)}` : String.raw`x=0\quad\text{(equilibrium)}`} />
          <p className="equation-note">{isPendulum
            ? 'For the active angle range, the remaining spring constraint selects the hanging equilibrium.'
            : 'The equivalent stiffness is positive, so the remaining spring constraint selects the equilibrium position.'}</p></>}
      <div className="live-factor-grid">
        <LiveFactor label="Mass" symbol="m" value={0} unit="kg" />
        {isPendulum ? <>
          <LiveFactor label="Pivot inertia" symbol={String.raw`J_0=m\ell^2`} value={0} unit="kg·m²" />
          <LiveFactor label="Spring stiffness" symbol="k" value={p.k} unit="N/m" />
          <LiveFactor label={degenerate ? 'Illustrated angle' : 'Equilibrium angle'} symbol={String.raw`\theta`} value={s.theta} unit="rad" />
        </> : <>
          <LiveFactor label="Equivalent stiffness" symbol={String.raw`k_{\mathrm{eq}}`} value={model.linearStiffness} unit="N/m" />
          <LiveFactor label="Equilibrium position" symbol="x" value={s.x} unit="m" />
        </>}
      </div>
      <p className="equation-note">Natural frequency and period are not defined for this zero-mass static limit. Choose a positive mass to restore the dynamic equation.</p>
    </section>
    <section className="equation-card energy-card">
      <p className="equation-card-kicker">Energy of the displayed static state</p>
      <EnergyBar label="Kinetic energy" value={s.kinetic} total={s.totalEnergy} className="kinetic-energy" />
      {isPendulum && <EnergyBar label="Gravity potential" value={s.gravityPotential} total={s.totalEnergy} className="gravity-energy" />}
      <EnergyBar label="Spring potential" value={s.springPotential} total={s.totalEnergy} className="spring-energy" />
      <div className="energy-total"><span>Total energy</span><output>{number(s.totalEnergy)} J</output></div>
    </section>
  </aside>;
}

export function EquationPanel({ problem, parameters: p, model, snapshot: s, mode = 'linear' }: EquationPanelProps) {
  const [tab, setTab] = useState<EquationTab>('motion');
  const [method, setMethod] = useState<DerivationMethod>('newton');
  const tabId = useId();
  const isPendulum = problem === 'pendulum';
  const isTrig = isPendulum && mode !== 'linear';
  const q = isPendulum ? '\\theta' : 'x';
  const rate0 = isPendulum ? '\\dot\\theta_0' : 'v_0';
  const inertia = isPendulum ? 'm\\ell^2' : 'm';
  const stiffness = isPendulum ? '(mg\\ell+k\\ell^2)' : 'k_{\\mathrm{eq}}';
  const units = isPendulum ? 'N·m' : 'N';
  const energyTotal = Math.max(0, s.totalEnergy);
  const totalTorque = s.gravityTorque + s.springTorque;
  const potentialShares = isPendulum
    ? [
      { label: 'Gravity potential', value: s.gravityPotential, className: 'gravity-energy' },
      { label: 'Spring potential', value: s.springPotential, className: 'spring-energy' },
    ]
    : [{ label: 'Spring potential', value: s.springPotential, className: 'spring-energy' }];

  if (model.massless) {
    return <MasslessEquationPanel problem={problem} parameters={p} model={model} snapshot={s} mode={mode} />;
  }

  return <aside className="equation-panel" aria-label="Equations and learning notes">
    <div className="equation-panel-heading">
      <div><span className="eyebrow">THE MATH, IN MOTION</span><h2>Equation of motion</h2></div>
      <span className="live-equation-label"><span className="live-dot" /> Live</span>
    </div>

    <section className="equation-card eom-card" aria-label="Equation of motion and live substitution">
      <p className="equation-card-kicker">{isPendulum ? '01 / Spring pendulum' : '02 / Spring network'}</p>

      <MathFormula tex={isTrig
        ? String.raw`\begin{aligned}-mg\ell\sin\theta&-k\ell^2\sin\theta\cos\theta\\&=J_0\ddot\theta,\quad J_0=m\ell^2\end{aligned}`
        : `${inertia}\\ddot{${q}}+${stiffness}${q}=0`} />
      {isPendulum && <div className="angular-acceleration-readout">
        <span>Angular acceleration · changes with time</span>
        <MathFormula tex={String.raw`\ddot\theta=${texNumber(s.thetaDDot, 4)}\;\mathrm{rad/s^2}`} />
      </div>}
      <p className="equation-note">{isPendulum
        ? 'A torque balance about the pivot. The gravity and spring moments add to inertia times angular acceleration.'
        : 'Mass × acceleration + stiffness × displacement = 0. Every factor in the live equation is identified below.'}</p>
      <div className="live-substitution-heading"><span>Substitute this instant</span><output>t = {number(s.time, 4)} s</output></div>
      <div className="live-factor-grid">
        {isPendulum ? <>
          <LiveFactor label="Pivot inertia" symbol={String.raw`J_0=m\ell^2`} value={model.inertia} unit="kg·m²" />
          <LiveFactor label="Angular acceleration" symbol={String.raw`\ddot\theta`} value={s.thetaDDot} unit="rad/s²" changing kind="acceleration" />
          <LiveFactor label="Angle" symbol={String.raw`\theta`} value={s.theta} unit="rad" changing kind="position" />
          <LiveFactor label="Angle in degrees" symbol={String.raw`\theta`} value={s.theta * 180 / Math.PI} unit="°" changing kind="position" />
          {isTrig ? <>
            <LiveFactor label="Sine of the angle" symbol={String.raw`\sin\theta`} value={Math.sin(s.theta)} unit="" changing kind="position" />
            <LiveFactor label="Cosine of the angle" symbol={String.raw`\cos\theta`} value={Math.cos(s.theta)} unit="" changing kind="position" />
            <LiveFactor label="Gravity coefficient" symbol={String.raw`mg\ell`} value={p.m * p.g * p.l} unit="N·m" />
            <LiveFactor label="Spring coefficient" symbol={String.raw`k\ell^2`} value={p.k * p.l ** 2} unit="N·m" />
          </> : <LiveFactor label="Angular stiffness" symbol={String.raw`K_\theta`} value={model.coordinateStiffness} unit="N·m/rad" />}
        </> : <>
          <LiveFactor label="Mass" symbol="m" value={p.m} unit="kg" />
          <LiveFactor label="Equivalent stiffness" symbol={String.raw`k_{\mathrm{eq}}`} value={model.linearStiffness} unit="N/m" />
          <LiveFactor label="Displacement" symbol="x(t)" value={s.x} unit="m" changing kind="position" />
          <LiveFactor label="Acceleration" symbol={String.raw`\ddot x(t)`} value={s.a} unit="m/s²" changing kind="acceleration" />
        </>}
      </div>
      <MathFormula className="numeric-substitution" tex={isTrig
        ? String.raw`\begin{aligned}
          \tau_g&=-\underbrace{${texNumber(p.m * p.g * p.l)}}_{mg\ell}\underbrace{(${texNumber(Math.sin(s.theta))})}_{\sin\theta}\\
          & = ${texNumber(s.gravityTorque)}\;\mathrm{N\,m}\\
          \tau_s&=-\underbrace{${texNumber(p.k * p.l ** 2)}}_{k\ell^2}\underbrace{(${texNumber(Math.sin(s.theta))})}_{\sin\theta}\underbrace{(${texNumber(Math.cos(s.theta))})}_{\cos\theta}\\
          & = ${texNumber(s.springTorque)}\;\mathrm{N\,m}\\
          \tau_g+\tau_s&=\underbrace{${texNumber(model.inertia)}}_{J_0}\underbrace{(${texNumber(s.thetaDDot)})}_{\ddot\theta}\\
          & = ${texNumber(s.inertialTerm)}\;\mathrm{N\,m}
        \end{aligned}`
        : String.raw`\begin{aligned}
          &\underbrace{${texNumber(model.inertia)}}_{${isPendulum ? 'J_0' : 'm'}}\,
          \underbrace{(${texNumber(s.qDDot)})}_{\color{#89c3b0}{${isPendulum ? '\\ddot\\theta' : '\\ddot x'}}}\\
          &{}+\underbrace{${texNumber(model.coordinateStiffness)}}_{${isPendulum ? 'K_\\theta' : 'k_{\\mathrm{eq}}'}}\,
          \underbrace{(${texNumber(s.q)})}_{\color{#d9ad87}{${q}}}=${texNumber(s.residual)}
        \end{aligned}`} />
      <div className="equation-term-grid" aria-label="Terms of the live equation">
        <div className="equation-term inertia-term"><span>{isTrig ? 'Gravity torque τg' : isPendulum ? 'J₀ · θ̈' : 'm · a — inertia'}</span><output>{withSign(isTrig ? s.gravityTorque : s.inertialTerm)}</output><small>{units}</small></div>
        <div className="equation-term restoring-term"><span>{isTrig ? 'Spring torque τs' : isPendulum ? 'Kθ · θ' : 'k_eq · x — stiffness'}</span><output>{withSign(isTrig ? s.springTorque : s.restoringTerm)}</output><small>{units}</small></div>
        <div className="equation-term balance-term"><span>{isTrig ? 'Στ' : 'Sum'}</span><output>{number(isTrig ? totalTorque : s.residual)}</output><small>{units}</small></div>
      </div>
      {isTrig && <MathFormula className="numeric-substitution" tex={String.raw`\underbrace{J_0\ddot\theta}_{${texNumber(s.inertialTerm)}}-\underbrace{(\tau_g+\tau_s)}_{${texNumber(totalTorque)}}=${texNumber(s.residual)}\;\mathrm{N\,m}`} />}
      <p className="equation-note rounding-note">{isTrig ? 'Net torque equals J₀ × angular acceleration; their difference is zero.' : 'The signed inertia and stiffness terms cancel.'} Displayed numbers are rounded; the model uses full precision.</p>
    </section>

    <div className="equation-tabs" role="tablist" aria-label="Explore the physics">
      {(['motion', 'derivation', 'energy'] as EquationTab[]).map((item) => <button
        key={item} id={`${tabId}-${item}`} type="button" role="tab" aria-selected={tab === item}
        aria-controls={`${tabId}-content`} tabIndex={tab === item ? 0 : -1}
        className={tab === item ? 'active' : ''} onClick={() => setTab(item)}
        onKeyDown={(event) => {
          const tabs: EquationTab[] = ['motion', 'derivation', 'energy'];
          const current = tabs.indexOf(item);
          const next = event.key === 'ArrowRight' ? (current + 1) % tabs.length
            : event.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length
              : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault();
          setTab(tabs[next]);
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}>
        {item[0].toUpperCase() + item.slice(1)}
      </button>)}
    </div>

    <div className="equation-tab-content" id={`${tabId}-content`} role="tabpanel" aria-labelledby={`${tabId}-${tab}`}>

      {tab === 'motion' && <>
        <section className="equation-card">
          <p className="equation-card-kicker">{isTrig ? 'Full-trig response' : 'The harmonic response'}</p>
          {isTrig ? <>
            <MathFormula tex={String.raw`\ddot\theta=-\frac g\ell\sin\theta-\frac km\sin\theta\cos\theta`} />
            <MathFormula className="numeric-substitution" tex={String.raw`\begin{aligned}
              \ddot\theta&=-${texNumber(p.g / p.l)}\sin(${texNumber(s.theta)})\\
              &\quad-${texNumber(p.k / p.m)}\sin(${texNumber(s.theta)})\cos(${texNumber(s.theta)})\\
              & = ${texNumber(s.thetaDDot)}\;\mathrm{rad/s^2}
            \end{aligned}`} />
            <p className="equation-note">The restoring acceleration depends on sine and cosine of the changing angle. This motion is periodic, but it is not an exact sine wave. Changing the release amplitude changes its period.</p>
            <div className="equation-divider" />
            <MathFormula tex={String.raw`\begin{aligned}x&=\ell\sin\theta\\v_x&=\ell\cos\theta\,\dot\theta\\a_x&=\ell\cos\theta\,\ddot\theta-\ell\sin\theta\,\dot\theta^2\end{aligned}`} />
            <p className="equation-note">The position, velocity and acceleration readouts are horizontal components. Bob speed along its arc is <MathFormula inline tex={String.raw`\ell|\dot\theta|`} />. The second acceleration term comes from changing direction.</p>
          </> : <>
            <MathFormula tex={String.raw`\begin{aligned}
              ${q}(t)&=${q}_0\cos(\omega_n t)\\
              &+\frac{${rate0}}{\omega_n}\sin(\omega_n t)
            \end{aligned}`} />
            <MathFormula className="numeric-substitution" tex={String.raw`\begin{aligned}
              ${q}(t)&=${texNumber(model.initialCoordinate)}\cos(${texNumber(model.omega)}t)\\
              &+(${texNumber(model.initialRate / model.omega)})\sin(${texNumber(model.omega)}t)
            \end{aligned}`} />
            <p className="equation-note">The initial position sets the cosine term. The initial velocity sets the sine term. Drag the mass to choose a new release position.</p>
            <div className="equation-divider" />
            <MathFormula tex={String.raw`\ddot{${q}}=-\omega_n^2 ${q}`} />
            <MathFormula className="numeric-substitution" tex={String.raw`\ddot{${q}}=-${texNumber(model.omega ** 2)}\,(${texNumber(s.q)})=${texNumber(s.qDDot)}`} />
            <p className="equation-note">Acceleration is proportional to displacement and points toward equilibrium. At a turning point, speed is zero and acceleration magnitude is greatest.</p>
          </>}
        </section>
        <section className="equation-card frequency-card">
          <p className="equation-card-kicker">{isTrig ? 'Actual period and small-angle comparison' : 'Natural rhythm'}</p>
          <MathFormula tex={isPendulum
            ? String.raw`\omega_n=\sqrt{\frac{g}{\ell}+\frac{k}{m}}`
            : String.raw`\omega_n=\sqrt{\frac{k_{\mathrm{eq}}}{m}}`} />
          <div className="equation-metrics">
            <div><span>{isTrig ? 'ωₙ / small-angle reference' : 'ωₙ / angular frequency'}</span><output>{number(model.omega)}<small> rad/s</small></output></div>
            <div><span>{isTrig ? 'f = 1 / T / actual cycle frequency' : 'f = ωₙ / 2π'}</span><output>{number(model.frequency)}<small> Hz</small></output></div>
            <div><span>{isTrig ? 'T / actual full-trig period' : 'T = 2π / ωₙ'}</span><output>{number(model.period)}<small> s</small></output></div>
            {isTrig && <div><span>T₀ = 2π / ωₙ / small-angle period</span><output>{number(2 * Math.PI / model.omega)}<small> s</small></output></div>}
          </div>
          <p className="equation-note">{isTrig
            ? 'The natural frequency above describes very small oscillations. The full-trig period is computed for this release; it approaches T₀ as the amplitude approaches zero.'
            : isPendulum
              ? 'A stiffer spring increases frequency. A longer pendulum decreases the gravity contribution. Release amplitude does not change this linear model’s frequency.'
              : 'A stiffer equivalent spring increases frequency. A heavier mass decreases frequency. Release amplitude does not change this linear model’s frequency.'}</p>
        </section>
        {isPendulum && <SmallAngleNote length={p.l} theta={s.theta} isTrig={isTrig} />}
      </>}


      {tab === 'derivation' && (isPendulum ? <>
        <div className="derivation-methods" role="group" aria-label="Choose a derivation method">
          <button type="button" className={method === 'newton' ? 'active' : ''} aria-pressed={method === 'newton'} onClick={() => setMethod('newton')}>Newton · torque</button>
          <button type="button" className={method === 'lagrange' ? 'active' : ''} aria-pressed={method === 'lagrange'} onClick={() => setMethod('lagrange')}>Lagrange · energy</button>
        </div>
        {method === 'newton' ? <>
          <section className="equation-card">
            <p className="equation-card-kicker">1 / Resolve geometry and restoring torques</p>
            <MathFormula tex={String.raw`\begin{aligned}
              x&=\ell\sin\theta,\quad F_s=-k\ell\sin\theta\\
              \tau_g&=-mg\ell\sin\theta\\
              \tau_s&=F_s(\ell\cos\theta)\\
              &=-k\ell^2\sin\theta\cos\theta
            \end{aligned}`} />
            <p className="equation-note">The spring acts horizontally at the bob, a full length ℓ from the pivot. Its perpendicular lever arm is ℓ cos θ. The rod is rigid and massless; the spring is unstrained at the downward equilibrium.</p>
          </section>
          <section className="equation-card">
            <p className="equation-card-kicker">2 / Apply rotational Newton’s law</p>
            <MathFormula tex={String.raw`\begin{aligned}
              \tau_g+\tau_s&=J_0\ddot\theta,\quad J_0=m\ell^2\\
              -mg\ell\sin\theta&-k\ell^2\sin\theta\cos\theta\\
              &=m\ell^2\ddot\theta
            \end{aligned}`} />
            <p className="equation-note">The fixed pivot force has zero moment about the pivot. Dividing by the point-mass inertia gives the full angular acceleration.</p>
          </section>
        </> : <>
          <section className="equation-card">
            <p className="equation-card-kicker">1 / Write consistent kinetic and potential energy</p>
            <MathFormula tex={String.raw`\begin{aligned}
              T&=\tfrac12m\ell^2\dot\theta^2\\
              V_g&=mg\ell(1-\cos\theta)\\
              V_s&=\tfrac12k\ell^2\sin^2\theta
            \end{aligned}`} />
            <p className="equation-note">Bob speed along its arc is ℓ |θ̇|. Gravity uses the rise above the lowest point; spring energy uses the horizontal extension ℓ sin θ.</p>
          </section>
          <section className="equation-card">
            <p className="equation-card-kicker">2 / Differentiate and apply Lagrange’s equation</p>
            <MathFormula tex={String.raw`\begin{aligned}
              \frac{d}{dt}\frac{\partial T}{\partial\dot\theta}&=m\ell^2\ddot\theta,\quad \frac{\partial T}{\partial\theta}=0\\
              \frac{\partial V}{\partial\theta}&=mg\ell\sin\theta+k\ell^2\sin\theta\cos\theta\\
              \frac{d}{dt}\frac{\partial T}{\partial\dot\theta}&+\frac{\partial V}{\partial\theta}=0
            \end{aligned}`} />
            <p className="equation-note">The derivative of sin² θ is 2 sin θ cos θ. This method gives the same full torque balance as Newton’s law.</p>
          </section>
        </>}
        <section className="equation-card">
          <p className="equation-card-kicker">3 / Compare with the small-angle model</p>
          <MathFormula tex={String.raw`\begin{aligned}
            \sin\theta&\approx\theta,\quad \cos\theta\approx1\\
            m\ell^2\ddot\theta&+(mg\ell+k\ell^2)\theta=0\\
            \omega_n&=\sqrt{g/\ell+k/m}
          \end{aligned}`} />
          <p className="equation-note">{isTrig
            ? 'These approximations are a comparison. The current simulation retains the sine and cosine terms.'
            : 'This selected mode uses the linear equation above and its analytical sine/cosine response.'} Angles must be in radians.</p>
          <p className="equation-note">Both modes retain the lecture’s ideal horizontal-spring assumption. Vertical deflection of the spring is neglected.</p>
        </section>
        <SmallAngleNote length={p.l} theta={s.theta} isTrig={isTrig} />
      </> : <>
        <section className="equation-card">
          <p className="equation-card-kicker">1 / Reduce k₄ and k₅ in series</p>
          <MathFormula tex={'\\begin{aligned}F_{45}&=k_4\\delta_4=k_5\\delta_5\\\\\\delta_4+\\delta_5&=-x\\\\k_{45}&=\\frac{k_4k_5}{k_4+k_5}\\end{aligned}'} />
          <MathFormula className="numeric-substitution" tex={`k_{45}=\\frac{${texNumber(p.k4)}\\cdot${texNumber(p.k5)}}{${texNumber(p.k4)}+${texNumber(p.k5)}}=${texNumber(model.k45)}\\;\\mathrm{N/m}`} />
          <p className="equation-note">The two springs carry the same force. Positive x is downward, so the lower branch compresses: its signed extensions add to −x. The softer spring changes length more. The connecting node is massless.</p>
          <div className="series-readouts">
            <div><span>δ₄ = F₄₅ / k₄</span><output>{number(s.branchExtensions[3] ?? 0)} m</output></div>
            <div><span>δ₅ = F₄₅ / k₅</span><output>{number(s.branchExtensions[4] ?? 0)} m</output></div>
          </div>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">2 / Add the parallel branches</p>
          <MathFormula tex={'k_{\\mathrm{eq}}=k_1+k_2+k_3+k_{45}'} />
          <MathFormula className="numeric-substitution" tex={`\\begin{aligned}k_{\\mathrm{eq}}&=${texNumber(p.k1)}+${texNumber(p.k2)}+${texNumber(p.k3)}+${texNumber(model.k45)}\\\\&=${texNumber(model.linearStiffness)}\\;\\mathrm{N/m}\\end{aligned}`} />
          <p className="equation-note">Each complete branch has the same endpoint displacement x. The forces add, including branches mounted on opposite sides: all pull the mass back toward equilibrium.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">3 / Apply translational Newton’s law</p>
          <MathFormula tex={'\\begin{aligned}\\sum F&=m\\ddot x\\\\-k_{\\mathrm{eq}}x&=m\\ddot x\\\\\\ddot x+\\frac{k_{\\mathrm{eq}}}{m}x&=0\\end{aligned}'} />
          <p className="equation-note">x is measured downward from the loaded equilibrium. Gravity is already balanced by the static spring forces. It sets the equilibrium position, while the incremental spring forces set the vibration frequency.</p>
        </section>
      </>)}


      {tab === 'energy' && <>
        <section className="equation-card energy-card">
          <p className="equation-card-kicker">Energy trades places</p>
          <MathFormula tex={isPendulum
            ? isTrig
              ? String.raw`\begin{aligned}T&=\tfrac12m\ell^2\dot\theta^2\\V_g&=mg\ell(1-\cos\theta)\\V_s&=\tfrac12k\ell^2\sin^2\theta\\E&=T+V_g+V_s\end{aligned}`
              : String.raw`\begin{aligned}T&=\tfrac12m\ell^2\dot\theta^2\\V&=\tfrac12(mg\ell+k\ell^2)\theta^2\end{aligned}`
            : String.raw`\begin{aligned}T&=\tfrac12m\dot x^2\\V&=\tfrac12k_{\mathrm{eq}}x^2\end{aligned}`} />
          <EnergyBar label="Kinetic energy" value={s.kinetic} total={energyTotal} className="kinetic-energy" />
          {potentialShares.map((share) => <EnergyBar key={share.label} {...share} total={energyTotal} />)}
          <div className="energy-total"><span>Total energy · constant</span><output>{number(s.totalEnergy, 4)} J</output></div>
          <p className="equation-note">At equilibrium, speed and kinetic energy are greatest. At a turning point, the mass stops for an instant and all energy is potential. No energy is lost in this undamped model.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">Your release sets the energy</p>
          {isTrig ? <>
            <MathFormula tex={String.raw`\begin{aligned}
              E&=\tfrac12m\ell^2\dot\theta_0^2+mg\ell(1-\cos\theta_0)\\
              &\quad+\tfrac12k\ell^2\sin^2\theta_0\\
              E&=V(A_\theta),\quad\dot\theta=0\ \text{at a turning point}
            \end{aligned}`} />
            <p className="equation-note">Angular amplitude: <strong>{number(model.amplitude, 4)} rad ({number(model.amplitude * 180 / Math.PI, 4)}°)</strong>. A release from rest has Aθ = |θ₀|. A larger release changes both energy and the actual period.</p>
            <p className="equation-note">These bars use the full-trig potential from the same torque equation. Kinetic energy uses total bob speed ℓ |θ̇|, not just its horizontal component.</p>
          </> : <>
            <MathFormula tex={String.raw`E=\tfrac12 ${isPendulum ? 'm\\ell^2\\dot\\theta_0^2' : 'mv_0^2'}+\tfrac12 ${stiffness}${q}_0^2`} />
            <MathFormula tex={String.raw`A=\sqrt{${q}_0^2+\left(\frac{${rate0}}{\omega_n}\right)^2}`} />
            <p className="equation-note">{isPendulum ? 'Angular amplitude' : 'Displacement amplitude'}: <strong>{number(model.amplitude, 4)} {isPendulum ? 'rad' : 'm'}</strong>. A larger release displacement or initial speed adds energy. Frequency remains set by mass and stiffness.</p>
            <p className="equation-note">{isPendulum
              ? 'These energy bars use the small-angle potential consistently with the selected linear equation.'
              : 'Potential is measured about the loaded equilibrium. The linear gravity and static spring contributions cancel, leaving the quadratic vibration energy shown here.'}</p>
          </>}
        </section>
      </>}

    </div>
    <p className="equation-panel-footnote">SI units · undamped free vibration · illustrative values</p>
  </aside>;
}

function SmallAngleNote({ length, theta, isTrig }: { length: number; theta: number; isTrig: boolean }) {
  return <section className="equation-card small-angle-card">
    <p className="equation-card-kicker">{isTrig ? 'Actual position and small-angle comparison' : 'Read the drawing correctly'}</p>
    <MathFormula tex={String.raw`x_{\mathrm{geometry}}=\ell\sin\theta,\qquad x_{\mathrm{linear}}=\ell\theta`} />
    <div className="geometry-readouts">
      <div><span>{isTrig ? 'Actual horizontal position' : 'Drawing geometry'}</span><output>{number(length * Math.sin(theta), 4)} m</output></div>
      <div><span>{isTrig ? 'Small-angle comparison' : 'Linear model position'}</span><output>{number(length * theta, 4)} m</output></div>
    </div>
    <p className="equation-note">{isTrig
      ? 'The full-trig mode uses ℓ sin θ in the position readout and spring energy. The comparison ℓ θ becomes accurate as the angle approaches zero.'
      : 'The selected linear model uses ℓ θ for the position readout; its drawing retains circular geometry.'} The approximations <MathFormula inline tex={String.raw`\sin\theta\approx\theta,\;\cos\theta\approx1`} /> require radians and are most accurate near the downward equilibrium.</p>
  </section>;
}

export default EquationPanel;
