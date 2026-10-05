import { useId, useState } from 'react';
import type { Model, Parameters, ProblemId, Snapshot } from '../physics/model';
import { MathFormula } from './Math';

type EquationPanelProps = {
  problem: ProblemId;
  parameters: Parameters;
  model: Model;
  snapshot: Snapshot;
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

export function EquationPanel({ problem, parameters: p, model, snapshot: s }: EquationPanelProps) {
  const [tab, setTab] = useState<EquationTab>('motion');
  const [method, setMethod] = useState<DerivationMethod>('newton');
  const tabId = useId();
  const isPendulum = problem === 'pendulum';
  const q = isPendulum ? '\\theta' : 'x';
  const rate0 = isPendulum ? '\\dot\\theta_0' : 'v_0';
  const inertia = isPendulum ? 'm\\ell^2' : 'm';
  const stiffness = isPendulum ? '(mg\\ell+k\\ell^2)' : 'k_{\\mathrm{eq}}';
  const units = isPendulum ? 'N·m' : 'N';
  const energyTotal = Math.max(0, s.totalEnergy);
  const potentialShares = isPendulum
    ? [
      { label: 'Gravity potential', value: s.gravityPotential, className: 'gravity-energy' },
      { label: 'Spring potential', value: s.springPotential, className: 'spring-energy' },
    ]
    : [{ label: 'Spring potential', value: s.springPotential, className: 'spring-energy' }];

  return <aside className="equation-panel" aria-label="Equations and learning notes">
    <div className="equation-panel-heading">
      <div><span className="eyebrow">THE MATH, IN MOTION</span><h2>Equation of motion</h2></div>
      <span className="live-equation-label"><span className="live-dot" /> Live</span>
    </div>

    <section className="equation-card eom-card" aria-label="Equation of motion and live substitution">
      <p className="equation-card-kicker">{isPendulum ? '01 / Spring pendulum' : '02 / Spring network'}</p>
      <MathFormula tex={`${inertia}\\ddot{${q}}+${stiffness}${q}=0`} />
      <p className="equation-note">{isPendulum
        ? 'A torque balance about the pivot. Gravity and the spring both pull the bob back toward its resting position.'
        : 'A force balance on the mass. Every spring branch contributes to the restoring force.'}</p>
      <div className="live-substitution-heading"><span>Substitute this instant</span><output>t = {number(s.time, 4)} s</output></div>
      <MathFormula className="numeric-substitution" tex={
        `\\begin{aligned}
          ${texNumber(model.inertia)}\\,(${texNumber(s.qDDot)})
          &+${texNumber(model.coordinateStiffness)}\\,(${texNumber(s.q)})\\\\
          &= ${texNumber(s.residual)}
        \\end{aligned}`
      } />
      <div className="equation-term-grid" aria-label="Terms of the live equation">
        <div className="equation-term inertia-term"><span>Inertia × acceleration</span><output>{withSign(s.inertialTerm)}</output><small>{units}</small></div>
        <div className="equation-term restoring-term"><span>Stiffness × position</span><output>{withSign(s.restoringTerm)}</output><small>{units}</small></div>
        <div className="equation-term balance-term"><span>Sum</span><output>{number(s.residual)}</output><small>{units}</small></div>
      </div>
      <p className="equation-note rounding-note">The two terms cancel. Displayed numbers are rounded; the model uses full precision.</p>
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
          <p className="equation-card-kicker">The response</p>
          <MathFormula tex={`\\begin{aligned}
            ${q}(t)&=${q}_0\\cos(\\omega_n t)\\\\
            &+\\frac{${rate0}}{\\omega_n}\\sin(\\omega_n t)
          \\end{aligned}`} />
          <MathFormula className="numeric-substitution" tex={`\\begin{aligned}
            ${q}(t)&=${texNumber(model.initialCoordinate)}\\cos(${texNumber(model.omega)}t)\\\\
            &+(${texNumber(model.initialRate / model.omega)})\\sin(${texNumber(model.omega)}t)
          \\end{aligned}`} />
          <p className="equation-note">The initial position sets the cosine term. The initial velocity sets the sine term. Drag the mass to choose a new release position.</p>
          <div className="equation-divider" />
          <MathFormula tex={`\\ddot{${q}}=-\\omega_n^2 ${q}`} />
          <MathFormula className="numeric-substitution" tex={`\\ddot{${q}}=-${texNumber(model.omega ** 2)}\\,(${texNumber(s.q)})=${texNumber(s.qDDot)}`} />
          <p className="equation-note">Acceleration is proportional to displacement and points toward equilibrium. At a turning point, speed is zero and acceleration is largest.</p>
        </section>
        <section className="equation-card frequency-card">
          <p className="equation-card-kicker">Natural rhythm</p>
          <MathFormula tex={isPendulum
            ? '\\omega_n=\\sqrt{\\frac{g}{\\ell}+\\frac{k}{m}}'
            : '\\omega_n=\\sqrt{\\frac{k_{\\mathrm{eq}}}{m}}'} />
          <div className="equation-metrics">
            <div><span>ωₙ / angular frequency</span><output>{number(model.omega)}<small> rad/s</small></output></div>
            <div><span>f = ωₙ / 2π</span><output>{number(model.frequency)}<small> Hz</small></output></div>
            <div><span>T = 2π / ωₙ</span><output>{number(model.period)}<small> s</small></output></div>
          </div>
          <p className="equation-note">{isPendulum
            ? 'A stiffer spring increases frequency. A longer pendulum decreases the gravity contribution. Changing release amplitude does not change this linear model’s frequency.'
            : 'A stiffer equivalent spring increases frequency. A heavier mass decreases frequency. Changing release amplitude does not change this linear model’s frequency.'}</p>
        </section>
        {isPendulum && <SmallAngleNote length={p.l} theta={s.theta} />}
      </>}

      {tab === 'derivation' && (isPendulum ? <>
        <div className="derivation-methods" role="group" aria-label="Choose a derivation method">
          <button type="button" className={method === 'newton' ? 'active' : ''} aria-pressed={method === 'newton'} onClick={() => setMethod('newton')}>Newton · torque</button>
          <button type="button" className={method === 'lagrange' ? 'active' : ''} aria-pressed={method === 'lagrange'} onClick={() => setMethod('lagrange')}>Lagrange · energy</button>
        </div>
        {method === 'newton' ? <>
          <section className="equation-card">
            <p className="equation-card-kicker">1 / Identify the restoring torques</p>
            <MathFormula tex={'\\begin{aligned}x&\\simeq\\ell\\theta\\\\F_s&=-kx\\\\\\tau_g&\\simeq-mg\\ell\\theta\\\\\\tau_s&\\simeq-k\\ell^2\\theta\\end{aligned}'} />
            <p className="equation-note">The negative signs mean both torques oppose displacement. The spring is undeformed at the downward equilibrium; the rod is rigid and massless.</p>
          </section>
          <section className="equation-card">
            <p className="equation-card-kicker">2 / Apply rotational Newton’s law</p>
            <MathFormula tex={'\\begin{aligned}\\sum\\tau&=I\\ddot\\theta\\\\-mg\\ell\\theta-k\\ell^2\\theta&=m\\ell^2\\ddot\\theta\\end{aligned}'} />
            <p className="equation-note">The point mass has rotational inertia <MathFormula inline tex={'I=m\\ell^2'} />. Move the restoring terms to the left to obtain the equation of motion.</p>
          </section>
        </> : <>
          <section className="equation-card">
            <p className="equation-card-kicker">1 / Write the energies</p>
            <MathFormula tex={'\\begin{aligned}T&=\\tfrac12m\\ell^2\\dot\\theta^2\\\\V_g&\\simeq\\tfrac12mg\\ell\\theta^2\\\\V_s&\\simeq\\tfrac12k\\ell^2\\theta^2\\end{aligned}'} />
            <p className="equation-note">Speed is <MathFormula inline tex={'\\ell\\dot\\theta'} />. Expand the gravitational energy <MathFormula inline tex={'mg\\ell(1-\\cos\\theta)'} /> to second order, and use spring extension <MathFormula inline tex={'x\\simeq\\ell\\theta'} />.</p>
          </section>
          <section className="equation-card">
            <p className="equation-card-kicker">2 / Apply Lagrange’s equation</p>
            <MathFormula tex={'\\frac{d}{dt}\\left(\\frac{\\partial T}{\\partial\\dot\\theta}\\right)+\\frac{\\partial V}{\\partial\\theta}=0'} />
            <MathFormula tex={'m\\ell^2\\ddot\\theta+(mg\\ell+k\\ell^2)\\theta=0'} />
            <p className="equation-note">Differentiate the kinetic energy with respect to angular velocity and the potential energy with respect to position. This produces the same torque balance.</p>
          </section>
        </>}
        <section className="equation-card">
          <p className="equation-card-kicker">3 / Read the natural frequency</p>
          <MathFormula tex={'\\ddot\\theta+\\left(\\frac{g}{\\ell}+\\frac{k}{m}\\right)\\theta=0'} />
          <p className="equation-note">Divide through by <MathFormula inline tex={'m\\ell^2'} />. The coefficient of position is <MathFormula inline tex={'\\omega_n^2'} />, which gives the natural frequency.</p>
        </section>
        <SmallAngleNote length={p.l} theta={s.theta} />
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
            ? '\\begin{aligned}T&=\\tfrac12m\\ell^2\\dot\\theta^2\\\\V&=\\tfrac12(mg\\ell+k\\ell^2)\\theta^2\\end{aligned}'
            : '\\begin{aligned}T&=\\tfrac12m\\dot x^2\\\\V&=\\tfrac12k_{\\mathrm{eq}}x^2\\end{aligned}'} />
          <EnergyBar label="Kinetic energy" value={s.kinetic} total={energyTotal} className="kinetic-energy" />
          {potentialShares.map((share) => <EnergyBar key={share.label} {...share} total={energyTotal} />)}
          <div className="energy-total"><span>Total energy · constant</span><output>{number(s.totalEnergy, 4)} J</output></div>
          <p className="equation-note">At equilibrium, speed and kinetic energy are greatest. At a turning point, the mass stops for an instant and all energy is potential. No energy is lost in this undamped model.</p>
        </section>
        <section className="equation-card">
          <p className="equation-card-kicker">Your release sets the energy</p>
          <MathFormula tex={`E=\\tfrac12 ${isPendulum ? 'm\\ell^2\\dot\\theta_0^2' : 'mv_0^2'}+\\tfrac12 ${stiffness}${q}_0^2`} />
          <MathFormula tex={`A=\\sqrt{${q}_0^2+\\left(\\frac{${rate0}}{\\omega_n}\\right)^2}`} />
          <p className="equation-note">{isPendulum ? 'Angular amplitude' : 'Displacement amplitude'}: <strong>{number(model.amplitude, 4)} {isPendulum ? 'rad' : 'm'}</strong>. A larger release displacement or initial speed adds energy, while frequency remains set by mass and stiffness.</p>
          <p className="equation-note">{isPendulum
            ? 'These energy bars use the same small-angle potential as the equation of motion. The drawing uses the pendulum’s circular geometry.'
            : 'Potential is measured about the loaded equilibrium. The linear gravity and static spring contributions cancel, leaving the quadratic vibration energy shown here.'}</p>
        </section>
      </>}
    </div>
    <p className="equation-panel-footnote">SI units · undamped free vibration · illustrative values</p>
  </aside>;
}

function SmallAngleNote({ length, theta }: { length: number; theta: number }) {
  return <section className="equation-card small-angle-card">
    <p className="equation-card-kicker">Read the drawing correctly</p>
    <MathFormula tex={'x_{\\mathrm{model}}=\\ell\\theta,\\qquad x_{\\mathrm{drawing}}=\\ell\\sin\\theta'} />
    <div className="geometry-readouts">
      <div><span>Linear model</span><output>{number(length * theta, 4)} m</output></div>
      <div><span>Drawing geometry</span><output>{number(length * Math.sin(theta), 4)} m</output></div>
    </div>
    <p className="equation-note">Angles enter the equations in radians. The small-angle model uses <MathFormula inline tex={'\\sin\\theta\\simeq\\theta'} /> and <MathFormula inline tex={'\\cos\\theta\\simeq1'} />. It is most accurate close to the downward equilibrium.</p>
  </section>;
}

export default EquationPanel;
