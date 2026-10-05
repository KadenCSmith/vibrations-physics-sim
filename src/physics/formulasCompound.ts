import type { FormulaEntry } from './formulaTypes'

const source = 'Screenshot 2026-10-04 at 6.40.13 PM.png'
const derived = (entry: Omit<FormulaEntry, 'scope' | 'sources' | 'reconstructed'>): FormulaEntry => ({
  ...entry, scope: 'compound', sources: [source, 'src/physics/model.ts'], reconstructed: true,
})

/** Derived from the separate seven-spring diagram, not part of the 38 lecture photographs. */
export const compoundFormulas: FormulaEntry[] = [
  derived({
    id: 'compound-topology', title: 'Seven physical springs, five stiffness values', group: 'Read the diagram',
    tex: [String.raw`\{k_{1L},k_{1R},k_2,k_{3L},k_{3R},k_4,k_5\}=\{k_1,k_1,k_2,k_3,k_3,k_4,k_5\}`],
    description: 'The upper pair shares k1 and the lower pair shares k3. These are four physical springs, followed by the three individual springs k2, k4, and k5.',
    usage: 'Track all seven deformations and spring energies. The screenshot supplies symbolic values; the displayed numerical settings are illustrative.', tags: ['topology', 'seven springs', 'diagram', 'labels'],
  }),
  derived({
    id: 'compound-parallel-rule', title: 'Parallel springs share extension', group: 'Equivalent stiffness',
    tex: [String.raw`\delta_a=\delta_b=\delta,\quad F=F_a+F_b=(k_a+k_b)\delta`, String.raw`k_{\parallel}=k_a+k_b`, String.raw`k_{\mathrm{top}}=2k_1,\qquad k_{\mathrm{bottom}}=2k_3`],
    description: 'Parallel springs connect the same pair of rigid nodes. Their extension is equal and their transmitted forces add.',
    usage: 'First reduce the two k1 springs and the two k3 springs. Equal stiffness values do not merge their physical energy or force readouts.', tags: ['parallel', 'Hooke', 'equal extension'],
  }),
  derived({
    id: 'compound-series-rule', title: 'Series groups share transmitted force', group: 'Equivalent stiffness',
    tex: [String.raw`F=k_i\delta_i,\qquad \delta=\sum_i\delta_i=F\sum_i\frac1{k_i}`, String.raw`\frac1{k_{\mathrm{series}}}=\sum_i\frac1{k_i}`],
    description: 'Intermediate junctions are massless. Their force balance makes the transmitted force equal along a series chain, and the changes in length add.',
    usage: 'Apply this rule to the reduced left chain and, later, to the complete upper assembly followed by k5.', tags: ['series', 'compliance', 'massless junction', 'force balance'],
  }),
  derived({
    id: 'compound-left-stiffness', title: 'Reduce the three groups in the left chain', group: 'Equivalent stiffness',
    tex: [String.raw`k_{\mathrm{left}}=\left(\frac1{2k_1}+\frac1{k_2}+\frac1{2k_3}\right)^{-1}`, String.raw`k_{\mathrm{left}}=\frac{2k_1k_2k_3}{k_1k_2+k_2k_3+2k_1k_3}`],
    description: 'The upper parallel pair, k2, and the lower parallel pair are three successive groups in series.',
    usage: 'This entire left load path connects the fixed support to the collector above k5.', tags: ['series', 'left chain', 'stiffness', 'reduction'],
  }),
  derived({
    id: 'compound-parallel-stiffness', title: 'Add the independent k4 branch', group: 'Equivalent stiffness',
    tex: [String.raw`k_{\mathrm{parallel}}=k_{\mathrm{left}}+k_4`],
    description: 'The left chain and k4 connect the same fixed support and collector, so they have the same overall extension.',
    usage: 'The two load paths act in parallel before the final k5 spring.', tags: ['parallel', 'collector', 'stiffness', 'k4'],
  }),
  derived({
    id: 'compound-equivalent-stiffness', title: 'Put the complete upper assembly in series with k5', group: 'Equivalent stiffness',
    tex: [String.raw`k_{\mathrm{eq}}=\left(\frac1{k_{\mathrm{parallel}}}+\frac1{k_5}\right)^{-1}`, String.raw`k_{\mathrm{eq}}=\frac{k_{\mathrm{parallel}}k_5}{k_{\mathrm{parallel}}+k_5}`],
    description: 'Every load path from the support to the mass passes through the final k5 spring. Its extension adds to the collector displacement.',
    usage: 'This equivalent stiffness is used in the third simulation’s EOM, frequency, static shift, and energy.', tags: ['series', 'equivalent stiffness', 'keq', 'k5'],
  }),
  derived({
    id: 'compound-node-coordinates', title: 'Define the three massless junction coordinates', group: 'Junctions and deformation',
    tex: [String.raw`u=\text{upper junction},\quad v=\text{lower junction},\quad c=\text{collector}`, String.raw`\delta_{1L}=\delta_{1R}=u,\quad\delta_2=v-u`, String.raw`\delta_{3L}=\delta_{3R}=c-v,\quad\delta_4=c,\quad\delta_5=x-c`],
    description: 'Every displacement is positive downward from the loaded equilibrium. u lies below the k1 pair, v below k2, and c below the k3 pair and k4.',
    usage: 'For a positive mass displacement all seven spring extensions are positive. Negative displacement reverses their signed increments.', tags: ['nodes', 'junction', 'geometry', 'extension', 'signs'],
  }),
  derived({
    id: 'compound-node-balance', title: 'Balance the forces at each massless junction', group: 'Junctions and deformation',
    tex: [String.raw`2k_1u=k_2(v-u)=2k_3(c-v)=F_{\mathrm{left}}`, String.raw`F_{\mathrm{left}}+k_4c=k_5(x-c)`, String.raw`k_{\mathrm{parallel}}c=k_5(x-c)`],
    description: 'The two springs within a pair split the force equally; the reduced pair carries the full left-chain force. At the collector, the left-chain and k4 forces add.',
    usage: 'These force balances determine the animated junction positions without giving the junctions mass or independent motion.', tags: ['force balance', 'massless', 'nodes', 'series', 'parallel'],
  }),
  derived({
    id: 'compound-node-solution', title: 'Solve the junction positions from the mass displacement', group: 'Junctions and deformation',
    tex: [String.raw`c=\frac{k_5}{k_{\mathrm{parallel}}+k_5}x,\qquad F_{\mathrm{left}}=k_{\mathrm{left}}c`, String.raw`u=\frac{F_{\mathrm{left}}}{2k_1}`, String.raw`v=u+\frac{F_{\mathrm{left}}}{k_2}=c-\frac{F_{\mathrm{left}}}{2k_3}`],
    description: 'The collector displacement follows from the final series balance. The left-chain force then determines the deformation of each group.',
    usage: 'The same algebra moves all three connectors and calculates every physical spring length at the sampled time.', tags: ['junction', 'position', 'deformation', 'collector'],
  }),
  derived({
    id: 'compound-physical-forces', title: 'Internal spring force versus force on the mass', group: 'Junctions and deformation',
    tex: [String.raw`N_{1L}=N_{1R}=\tfrac12F_{\mathrm{left}},\quad N_2=F_{\mathrm{left}}`, String.raw`N_{3L}=N_{3R}=\tfrac12F_{\mathrm{left}},\quad N_4=k_4c`, String.raw`N_5=k_5(x-c)=k_{\mathrm{eq}}x`, String.raw`F_{\mathrm{mass}}=-N_5=-k_{\mathrm{eq}}x`],
    description: 'N denotes a signed tension increment: positive extension gives positive N. Only k5 attaches directly to the moving mass; the other six spring forces act at internal nodes.',
    usage: 'Use the negative k5 tension increment for the mass’s restoring force. Adding all seven spring-force readouts would count the same transmitted load repeatedly.', tags: ['Hooke', 'force', 'tension', 'restoring', 'double counting'],
  }),
  derived({
    id: 'compound-loaded-equilibrium', title: 'Gravity sets the loaded equilibrium', group: 'Equation of motion',
    tex: [String.raw`\Delta_s=\frac{mg}{k_{\mathrm{eq}}}`, String.raw`z=\Delta_s+x`, String.raw`m\ddot x=mg-k_{\mathrm{eq}}(\Delta_s+x)=-k_{\mathrm{eq}}x`],
    description: 'Delta_s is the total static extension from the unstretched configuration. The vibration coordinate x is measured from this loaded equilibrium.',
    usage: 'Changing g changes the static shift; it does not change the linear oscillation frequency. All displayed dynamic branch extensions are increments about equilibrium.', tags: ['gravity', 'static shift', 'equilibrium', 'preload', 'mg'],
  }),
  derived({
    id: 'compound-eom', title: 'Equation of motion and its live balance', group: 'Equation of motion',
    tex: [String.raw`m\ddot x+k_{\mathrm{eq}}x=0`, String.raw`m>0:\quad a=\ddot x=-\frac{k_{\mathrm{eq}}}{m}x`, String.raw`R=m a+k_{\mathrm{eq}}x=0`],
    description: 'Newton’s law equates the restoring force to mass times acceleration. The two left-hand terms have force units and cancel at every time.',
    usage: 'The panel identifies mass in kg, acceleration in m/s², equivalent stiffness in N/m, and displacement in m before substituting the current values.', tags: ['EOM', 'Newton', 'acceleration', 'units', 'residual'],
  }),
  derived({
    id: 'compound-frequency', title: 'Frequency and period of the compound network', group: 'Motion and natural frequency',
    tex: [String.raw`\omega_n=\sqrt{\frac{k_{\mathrm{eq}}}{m}}\;\mathrm{rad/s}\quad(m>0)`, String.raw`f_n=\frac{\omega_n}{2\pi}\;\mathrm{Hz},\qquad T_n=\frac{2\pi}{\omega_n}\;\mathrm{s}`],
    description: 'The reciprocal series sums determine stiffness before the mass determines the natural frequency. Angular frequency and cycles per second differ by 2 pi.',
    usage: 'Increasing equivalent stiffness raises frequency; increasing positive mass lowers it. Release amplitude and g do not alter frequency in this linear model.', tags: ['frequency', 'period', 'Hz', 'omega', 'mass'],
  }),
  derived({
    id: 'compound-response', title: 'Harmonic motion from the initial conditions', group: 'Motion and natural frequency',
    tex: [String.raw`x(t)=x_0\cos(\omega_nt)+\frac{v_0}{\omega_n}\sin(\omega_nt)`, String.raw`\dot x(t)=-x_0\omega_n\sin(\omega_nt)+v_0\cos(\omega_nt)`, String.raw`\ddot x(t)=-\omega_n^2x(t)`, String.raw`A=\sqrt{x_0^2+(v_0/\omega_n)^2}`],
    description: 'Two initial conditions determine the undamped response. Derivatives of sine and cosine give velocity and acceleration.',
    usage: 'For positive mass, playback, plots, and scrubbing evaluate the same analytical trajectory. A nonzero initial velocity can increase the amplitude.', tags: ['initial conditions', 'derivative', 'response', 'sine', 'cosine', 'amplitude'],
  }),
  derived({
    id: 'compound-seven-spring-energy', title: 'Add the energy of all seven physical springs', group: 'Energy',
    tex: [String.raw`U_s=\tfrac12k_1u^2+\tfrac12k_1u^2+\tfrac12k_2(v-u)^2`, String.raw`\phantom{U_s={}}+\tfrac12k_3(c-v)^2+\tfrac12k_3(c-v)^2+\tfrac12k_4c^2+\tfrac12k_5(x-c)^2`, String.raw`U_s=\tfrac12k_{\mathrm{parallel}}c^2+\tfrac12k_5(x-c)^2=\tfrac12k_{\mathrm{eq}}x^2`],
    description: 'Every physical spring stores its own energy, including both members of each equal-stiffness pair. Unlike force on the mass, all seven spring energies are added.',
    usage: 'Substituting the balanced junction positions proves that the physical energy sum equals the equivalent-spring energy.', tags: ['energy', 'seven springs', 'potential', 'verification'],
  }),
  derived({
    id: 'compound-total-energy', title: 'Conserved vibration energy', group: 'Energy',
    tex: [String.raw`T=\tfrac12m\dot x^2,\qquad E=T+U_s`, String.raw`E=\tfrac12mv_0^2+\tfrac12k_{\mathrm{eq}}x_0^2=\tfrac12k_{\mathrm{eq}}A^2`, String.raw`\frac{dE}{dt}=\dot x\left(m\ddot x+k_{\mathrm{eq}}x\right)=0`],
    description: 'The mass stores kinetic energy and all seven springs store potential energy. Their sum stays constant in this undamped model.',
    usage: 'These are incremental vibration energies about loaded equilibrium. Static spring and gravity terms cancel in the reduced potential, so a separate extra mgx term is not added.', tags: ['kinetic', 'potential', 'conservation', 'chain rule', 'derivative'],
  }),
  derived({
    id: 'compound-massless', title: 'At zero mass the equation becomes a constraint', group: 'Zero-mass limit',
    tex: [String.raw`m=0:\quad k_{\mathrm{eq}}x=0`, String.raw`k_{\mathrm{eq}}>0\quad\Longrightarrow\quad x=u=v=c=0`],
    description: 'All allowed spring stiffnesses are positive. Exactly zero inertia therefore fixes the static equilibrium instead of defining an acceleration or an oscillator.',
    usage: 'The 0 kg setting has no natural frequency or oscillation period. Do not divide by zero or interpret the displayed static branch as infinitely fast motion.', tags: ['zero mass', 'massless', 'constraint', 'equilibrium'],
  }),
]
