import type { FormulaEntry } from './formulaTypes'

const diagram = 'Screenshot 2026-10-04 at 6.59.45 PM.png'
const lagrange = 'Screenshot 2026-10-04 at 7.00.41 PM.png'
const entry = (value: Omit<FormulaEntry, 'scope' | 'sources' | 'reconstructed'>): FormulaEntry => ({
  ...value, scope: 'inverted', sources: [diagram, lagrange, 'src/physics/model.ts'], reconstructed: true,
})

/** The two-spring, uniform inverted bar is distinct from the earlier torsion-spring lecture example. */
export const invertedFormulas: FormulaEntry[] = [
  entry({
    id: 'inverted-assumptions', title: 'Coordinates, assumptions, and the two springs', group: 'Geometry and inertia',
    tex: [String.raw`q=\theta,\qquad x_{\mathrm{linear}}=L\theta`, String.raw`\delta_1=x_{\mathrm{linear}},\qquad\delta_2=-x_{\mathrm{linear}}`, String.raw`F_{s,x}=-2kx_{\mathrm{linear}}`],
    description: 'A uniform rigid bar stands above a fixed frictionless pivot. Two identical horizontal springs act at its tip. Positive theta tips the bar right; one spring extends while the other compresses.',
    usage: 'The animation uses linear spring deflection and small-angle motion. Both springs restore the tip toward the upright position.', tags: ['small angle', 'two springs', 'geometry', 'signs', 'coordinate'],
  }),
  entry({
    id: 'inverted-inertia', title: 'Uniform-bar inertia about the lower pivot', group: 'Geometry and inertia',
    tex: [String.raw`dm=\frac mL\,ds`, String.raw`J_O=\int_0^L s^2\,dm=\frac mL\int_0^L s^2\,ds=\frac13mL^2`, String.raw`J_G=\frac1{12}mL^2,\qquad J_O=J_G+m(L/2)^2`, String.raw`[J_O]=\mathrm{kg\,m^2}`],
    description: 'The bar’s mass is distributed along its length, with its center of gravity at L/2. Integration or the parallel-axis theorem gives the supplied pivot inertia.',
    usage: 'Use J=mL²/3 here. The point-bob inertia mL² from Simulation 01 would give the wrong frequency.', tags: ['inertia', 'uniform bar', 'parallel axis', 'center of gravity', 'units'],
  }),
  entry({
    id: 'inverted-exact-geometry', title: 'Geometric reference before linearization', group: 'Geometry and inertia',
    tex: [String.raw`x_{mathrm{tip}}=L\sin\theta,\qquad h_G=\frac L2\cos\theta`, String.raw`\Delta h_G=\frac L2(\cos\theta-1)`],
    description: 'The center of gravity falls as the inverted bar tips from vertical. Its height change is negative relative to the upright reference.',
    usage: 'These exact geometric expressions establish the potential. The active dynamics use their small-angle expansion, not a finite-angle nonlinear trajectory.', tags: ['geometry', 'reference only', 'height', 'sin', 'cos'],
  }),
  entry({
    id: 'inverted-linearization', title: 'Small-angle approximations and derivative identities', group: 'Geometry and inertia',
    tex: [String.raw`\sin\theta\approx\theta,\qquad\cos\theta\approx1-\tfrac12\theta^2`, String.raw`\sin^2\theta\approx\theta^2,\qquad\sin\theta\cos\theta\approx\theta`, String.raw`\frac{d}{d\theta}\sin^2\theta=2\sin\theta\cos\theta`, String.raw`\frac{d}{d\theta}\cos\theta=-\sin\theta`],
    description: 'Angles must be in radians. Keep first-order terms in torque and second-order terms in potential energy so the model orders stay consistent.',
    usage: 'These steps convert the geometric reference into the linear simulation. Playback stops at the stated small-angle boundary rather than extending a falling bar into a fabricated cycle.', tags: ['Taylor', 'derivative', 'chain rule', 'trigonometry', 'small angle'],
  }),
  entry({
    id: 'inverted-kinetic', title: 'Kinetic energy of the rotating uniform bar', group: '1 / Energy-method derivation',
    tex: [String.raw`T=\frac12\int_0^L(s\dot\theta)^2\,dm=\frac12J_O\dot\theta^2`, String.raw`T=\frac16mL^2\dot\theta^2`],
    description: 'Every material point has speed s times angular velocity. The distributed kinetic energy reduces to the pivot-inertia form.',
    usage: 'This kinetic energy is valid for the rigid bar. Using only the center-of-mass translational energy would omit rotation about the center of mass.', tags: ['kinetic', 'energy method', 'uniform bar', 'rotation'],
  }),
  entry({
    id: 'inverted-exact-potential', title: 'Exact geometric potential — reference only', group: '1 / Energy-method derivation',
    tex: [String.raw`U_{s,\mathrm{geom}}=\tfrac12k(L\sin\theta)^2+\tfrac12k(-L\sin\theta)^2=kL^2\sin^2\theta`, String.raw`U_{g,\mathrm{geom}}=\frac{mgL}{2}(\cos\theta-1)`, String.raw`U_{\mathrm{geom}}=kL^2\sin^2\theta+\frac{mgL}{2}(\cos\theta-1)`],
    description: 'The two positive spring energies add. Gravity potential is negative away from the upright zero datum because the center of gravity drops.',
    usage: 'This is a derivation reference under ideal horizontal spring forces. The animation and energy display use the consistent quadratic small-angle potential below.', tags: ['potential', 'gravity negative', 'spring energy', 'reference only', 'nonlinear'],
  }),
  entry({
    id: 'inverted-linear-potential', title: 'Quadratic potential and effective angular stiffness', group: '1 / Energy-method derivation',
    tex: [String.raw`U_s=kL^2\theta^2,\qquad U_g=-\frac{mgL}{4}\theta^2`, String.raw`U=\frac12C\theta^2,\qquad C=2kL^2-\frac{mgL}{2}`],
    description: 'The spring stiffness is stabilizing and the gravity contribution is destabilizing. Their difference can be positive, zero, or negative.',
    usage: 'These signed energy components are used by the active simulation. Negative gravitational or total potential energy is retained, not clamped away.', tags: ['stiffness', 'potential', 'linearization', 'gravity negative', 'C'],
  }),
  entry({
    id: 'inverted-conserved-energy', title: 'Differentiate the conserved total energy', group: '1 / Energy-method derivation',
    tex: [String.raw`E=T+U=\tfrac12J_O\dot\theta^2+\tfrac12C\theta^2=E_0`, String.raw`\frac{d}{dt}(\dot\theta^2)=2\dot\theta\ddot\theta,\qquad\frac{d}{dt}(\theta^2)=2\theta\dot\theta`, String.raw`\frac{dE}{dt}=\dot\theta(J_O\ddot\theta+C\theta)=0`],
    description: 'The chain rule factors the energy derivative into angular velocity times the equation of motion. Total energy is conserved even when the upright equilibrium is unstable.',
    usage: 'Recover the EOM on intervals where angular velocity is nonzero and extend through isolated turning points by continuity. Do not divide by zero at a turning point; energy conservation alone does not determine acceleration at a permanently stationary state.', tags: ['energy method', 'conservation', 'derivative', 'chain rule', 'turning point'],
  }),
  entry({
    id: 'inverted-eom', title: 'Linear equation of motion', group: '1 / Energy-method derivation',
    tex: [String.raw`J_O\ddot\theta+C\theta=0`, String.raw`\frac13mL^2\ddot\theta+\left(2kL^2-\frac{mgL}{2}\right)\theta=0`, String.raw`m>0:\quad\ddot\theta=-\left(\frac{6k}{m}-\frac{3g}{2L}\right)\theta`],
    description: 'Substitute the uniform-bar inertia and the net angular stiffness. The sign of the normalized stiffness determines whether acceleration restores or increases a displacement.',
    usage: 'This is the active small-angle equation. The angular-acceleration display evaluates it at the current angle.', tags: ['EOM', 'angular acceleration', 'theta double dot', 'linear'],
  }),
  entry({
    id: 'inverted-lagrange-given', title: 'Use the exact supplied Lagrange form', group: '2 / Lagrange derivation',
    tex: [String.raw`\frac{d}{dt}\left(\frac{\partial T}{\partial\dot q_i}\right)-\frac{\partial T}{\partial q_i}+\frac{\partial U}{\partial q_i}=0`, String.raw`q_i=\theta,\qquad\dot q_i=\dot\theta`],
    description: 'This is the T-and-U form supplied in the second screenshot for an unforced conservative system with potential independent of generalized velocity.',
    usage: 'Treat theta and theta-dot as independent arguments when taking partial derivatives, then take the indicated total time derivative.', tags: ['Lagrange', 'given equation', 'partial derivative', 'generalized coordinate'],
  }),
  entry({
    id: 'inverted-lagrange-partials', title: 'Evaluate every Lagrange derivative', group: '2 / Lagrange derivation',
    tex: [String.raw`\frac{\partial T}{\partial\dot\theta}=J_O\dot\theta,\qquad\frac{d}{dt}\left(\frac{\partial T}{\partial\dot\theta}\right)=J_O\ddot\theta`, String.raw`\frac{\partial T}{\partial\theta}=0`, String.raw`\frac{\partial U}{\partial\theta}=2kL^2\theta-\frac{mgL}{2}\theta=C\theta`, String.raw`J_O\ddot\theta-0+C\theta=0`],
    description: 'Inertia is constant and kinetic energy does not explicitly depend on angle. Differentiating the quadratic potential brings down the net angular stiffness.',
    usage: 'Substitution gives exactly the same equation as the energy method without dividing by angular velocity at a turning point.', tags: ['Lagrange', 'partial derivative', 'EOM', 'derivation'],
  }),
  entry({
    id: 'inverted-nonlinear-reference', title: 'Nonlinear precursor — derivation reference only', group: '2 / Lagrange derivation',
    tex: [String.raw`\frac{\partial U_{\mathrm{geom}}}{\partial\theta}=2kL^2\sin\theta\cos\theta-\frac{mgL}{2}\sin\theta`, String.raw`J_O\ddot\theta+2kL^2\sin\theta\cos\theta-\frac{mgL}{2}\sin\theta=0`],
    description: 'Differentiating the geometric potential before approximation gives this precursor. First-order sine and cosine substitutions produce the active linear EOM.',
    usage: 'This equation is not animated. Simulation 04 follows the screenshot’s explicit instruction to assume small angles and linear spring deflections.', tags: ['nonlinear', 'reference only', 'Lagrange', 'linearization'],
  }),
  entry({
    id: 'inverted-torque-signs', title: 'Gravity destabilizes; both springs restore', group: 'Signed torque balance',
    tex: [String.raw`\tau_g=+\frac{mgL}{2}\theta`, String.raw`\tau_s=-2kL^2\theta`, String.raw`\tau_g+\tau_s=J_O\ddot\theta=-C\theta`, String.raw`R=J_O\ddot\theta-\tau_g-\tau_s=0`],
    description: 'For a rightward tilt, gravity acts to increase the tilt while both springs oppose it. These are physical torques; C theta is the restoring term moved to the left-hand side.',
    usage: 'The panel shows signed spring, gravity, and inertial terms with torque units. A negative C means the net torque points away from upright.', tags: ['torque', 'signs', 'gravity', 'restoring', 'residual'],
  }),
  entry({
    id: 'inverted-stability', title: 'Critical stiffness and upright stability', group: 'Stability and frequency',
    tex: [String.raw`k_{\mathrm{crit}}=\frac{mg}{4L}`, String.raw`k>k_{\mathrm{crit}}\Longleftrightarrow C>0:\quad\text{stable oscillation}`, String.raw`k=k_{\mathrm{crit}}\Longleftrightarrow C=0:\quad\text{neutral in the linear model}`, String.raw`k<k_{\mathrm{crit}}\Longleftrightarrow C<0:\quad\text{unstable upright equilibrium}`],
    description: 'The two springs must provide more angular stiffness than the destabilizing gravity term. The threshold is for each of the two identical springs.',
    usage: 'Classify the regime before using a square-root natural frequency. Neutral behavior here is a property of the linearized equation, not a claim about the full finite-angle system.', tags: ['stability', 'critical stiffness', 'stable', 'neutral', 'unstable'],
  }),
  entry({
    id: 'inverted-frequency-radians', title: '3 / Natural frequency in rad/s', group: 'Stability and frequency',
    tex: [String.raw`\omega_n=\sqrt{\frac{C}{J_O}}=\sqrt{\frac{6k}{m}-\frac{3g}{2L}}\quad[\mathrm{rad/s}]`, String.raw`m>0,\quad C>0`],
    description: 'This real oscillatory natural frequency exists only for a positive-mass bar with positive net angular stiffness.',
    usage: 'Use this answer for the stable regime. At C=0 the linear restoring frequency is zero; at C<0 use a growth rate rather than an imaginary displayed frequency.', tags: ['natural frequency', 'rad/s', 'omega', 'stable'],
  }),
  entry({
    id: 'inverted-frequency-hertz', title: '4 / Natural frequency in Hz', group: 'Stability and frequency',
    tex: [String.raw`f_n=\frac{\omega_n}{2\pi}=\frac1{2\pi}\sqrt{\frac{6k}{m}-\frac{3g}{2L}}\quad[\mathrm{Hz}]`],
    description: 'One cycle corresponds to 2 pi radians, so divide the stable angular frequency by 2 pi.',
    usage: 'This is the number of oscillations per second for C>0 and m>0, not the angular frequency.', tags: ['natural frequency', 'Hz', 'hertz', 'cycles'],
  }),
  entry({
    id: 'inverted-period', title: '5 / Oscillation period', group: 'Stability and frequency',
    tex: [String.raw`T_n=\frac1{f_n}=\frac{2\pi}{\omega_n}=2\pi\sqrt{\frac{J_O}{C}}\quad[\mathrm{s}]`],
    description: 'The period is one full stable oscillation time. It grows without bound as positive stiffness approaches the neutral threshold.',
    usage: 'A finite period is defined only for the stable regime. Neutral drift, unstable growth, and zero-inertia constraints do not have a finite oscillation period.', tags: ['period', 'seconds', 'cycle', 'stable'],
  }),
  entry({
    id: 'inverted-stable-response', title: 'Stable response and its derivatives', group: 'Motion by stability regime',
    tex: [String.raw`\theta(t)=\theta_0\cos(\omega_nt)+\frac{\dot\theta_0}{\omega_n}\sin(\omega_nt)`, String.raw`\dot\theta(t)=-\theta_0\omega_n\sin(\omega_nt)+\dot\theta_0\cos(\omega_nt)`, String.raw`\ddot\theta(t)=-\omega_n^2\theta(t)`, String.raw`A=\sqrt{\theta_0^2+(\dot\theta_0/\omega_n)^2}`],
    description: 'For C>0 the initial angle and angular velocity produce a harmonic response.',
    usage: 'The response is meaningful within the small-angle range. Initial velocity can make its peak angle greater than the starting angle.', tags: ['stable', 'initial conditions', 'harmonic', 'derivative', 'amplitude'],
  }),
  entry({
    id: 'inverted-neutral-response', title: 'Neutral linear model: drift rather than oscillation', group: 'Motion by stability regime',
    tex: [String.raw`C=0:\quad\ddot\theta=0`, String.raw`\theta(t)=\theta_0+\dot\theta_0t,\qquad\dot\theta(t)=\dot\theta_0`, String.raw`\omega_n=0,\qquad\text{no finite oscillation period}`],
    description: 'The linear spring and gravity torques cancel. An initially stationary bar remains at its chosen angle in this linear model; nonzero initial angular velocity produces drift.',
    usage: 'Do not use a sine response with division by zero frequency. This neutral result does not establish finite-angle stability of the original geometry.', tags: ['neutral', 'drift', 'zero frequency', 'initial conditions'],
  }),
  entry({
    id: 'inverted-unstable-response', title: 'Unstable linear model: exponential growth and decay', group: 'Motion by stability regime',
    tex: [String.raw`\lambda=\sqrt{-C/J_O}=\sqrt{\frac{3g}{2L}-\frac{6k}{m}}\quad[\mathrm{s^{-1}}]`, String.raw`\theta(t)=\theta_0\cosh(\lambda t)+\frac{\dot\theta_0}{\lambda}\sinh(\lambda t)`, String.raw`\dot\theta(t)=\lambda\theta_0\sinh(\lambda t)+\dot\theta_0\cosh(\lambda t)`, String.raw`\ddot\theta(t)=\lambda^2\theta(t)`],
    description: 'For C<0 the real characteristic roots are plus and minus lambda. The equilibrium is unstable; a general perturbation contains an exponentially growing component.',
    usage: 'Lambda is a growth rate, not an oscillatory natural frequency. Playback ends at the small-angle boundary instead of looping this nonperiodic response.', tags: ['unstable', 'growth rate', 'cosh', 'sinh', 'nonperiodic'],
  }),
  entry({
    id: 'inverted-hyperbolic-identities', title: 'Why the unstable solution uses cosh and sinh', group: 'Motion by stability regime',
    tex: [String.raw`\cosh z=\frac{e^z+e^{-z}}2,\qquad\sinh z=\frac{e^z-e^{-z}}2`, String.raw`\frac{d}{dt}\cosh(\lambda t)=\lambda\sinh(\lambda t),\quad\frac{d}{dt}\sinh(\lambda t)=\lambda\cosh(\lambda t)`, String.raw`\cosh^2z-\sinh^2z=1`],
    description: 'Hyperbolic functions combine the two real exponential solutions. Their derivative identities verify the initial conditions and unstable EOM.',
    usage: 'The final identity also verifies conservation of the signed kinetic-plus-potential energy in the unstable regime.', tags: ['derivative', 'hyperbolic', 'cosh', 'sinh', 'exponential', 'energy'],
  }),
  entry({
    id: 'inverted-signed-energy', title: 'Energy conservation does not imply upright stability', group: 'Signed energy and validity',
    tex: [String.raw`E_0=\tfrac12J_O\dot\theta_0^2+\tfrac12C\theta_0^2`, String.raw`T\ge0,\qquad U_s\ge0,\qquad U_g\le0`, String.raw`C<0:\quad U=\tfrac12C\theta^2\le0`],
    description: 'An unstable displacement can have negative total energy relative to upright. During growth, potential becomes more negative while kinetic energy increases by the same amount.',
    usage: 'Preserve the signs and the chosen upright zero datum. The signed energy display must not clamp gravity potential or total energy to zero.', tags: ['energy', 'negative potential', 'stability', 'conservation', 'datum'],
  }),
  entry({
    id: 'inverted-units', title: 'Keep angular quantities and units consistent', group: 'Signed energy and validity',
    tex: [String.raw`\theta_{\mathrm{rad}}=\frac{\pi}{180}\theta_{\mathrm{deg}}`, String.raw`[J_O]=\mathrm{kg\,m^2},\quad[C]=\mathrm{N\,m/rad}`, String.raw`[\ddot\theta]=\mathrm{rad/s^2},\quad[\tau]=\mathrm{N\,m},\quad[E]=\mathrm J`],
    description: 'Angular equations use radians internally. Degrees are an input and display convenience, while rotational inertia and angular stiffness have distinct units.',
    usage: 'The panel labels the numerical factors before substitution. The small-angle display boundary is 12 degrees, approximately 0.20944 radians.', tags: ['units', 'radians', 'degrees', 'small angle'],
  }),
  entry({
    id: 'inverted-massless', title: 'Zero mass: spring constraint or free identity', group: 'Zero-mass limit',
    tex: [String.raw`m=0:\quad J_O=0,\qquad 2kL^2\theta=0`, String.raw`k>0:\quad\theta=0`, String.raw`m=k=0:\quad0=0`],
    description: 'With no bar mass there is neither rotational inertia nor weight. Nonzero springs select the upright configuration; with no springs the equation selects no unique angle or acceleration.',
    usage: 'The massless branch is static and has no frequency. If both m and k vanish, a held angle is an illustration rather than a predicted trajectory. Division by inertia is allowed only for m>0.', tags: ['zero mass', 'massless', 'constraint', 'free', 'indeterminate'],
  }),
]
