import type { FormulaEntry } from './formulaTypes';

const topic = (entry: Omit<FormulaEntry, 'scope' | 'sources' | 'reconstructed'>): FormulaEntry => ({
  ...entry, scope: 'compound-inverted', reconstructed: true,
  sources: ['Screenshot 2026-10-06 at 9.22.30 PM.png · mirrored at user request', 'src/physics/model.ts'],
});

export const mirroredCompoundFormulas: FormulaEntry[] = [
  topic({ id: 'mirrored-connectivity', title: 'Flip the geometry, preserve the connections', group: 'Equivalent stiffness',
    tex: [String.raw`k_A=2k_1,\quad k_B=2k_3`, String.raw`k_L=\left(\frac1{2k_1}+\frac1{k_2}+\frac1{2k_3}\right)^{-1}`, String.raw`k_P=k_L+k_4,\qquad k_{\mathrm{eq}}=\frac{k_Pk_5}{k_P+k_5}`],
    description: 'The mass is above the floor-supported seven-spring assembly. Parallel pairs share extension; series groups share transmitted force. Turning the diagram upside down preserves the stiffness reduction.',
    usage: 'Reduce from the floor: two k₁ springs, k₂, two k₃ springs; add the bypass k₄, then the final k₅ to the top mass.', tags: ['series', 'parallel', 'inverted', 'flipped'] }),
  topic({ id: 'mirrored-junctions', title: 'Upward-positive junction motion and spring deformation', group: 'Junctions and deformation',
    tex: [String.raw`c=\frac{k_5}{k_P+k_5}x,\quad u=\frac{k_Lc}{2k_1},\quad v=u+\frac{k_Lc}{k_2}`, String.raw`\delta_{1a}=\delta_{1b}=u,\quad\delta_2=v-u`, String.raw`\delta_{3a}=\delta_{3b}=c-v,\quad\delta_4=c,\quad\delta_5=x-c`, String.raw`2k_1u=k_2(v-u)=2k_3(c-v),\quad k_Lc+k_4c=k_5(x-c)`],
    description: 'x, u, v and c are upward increments from loaded equilibrium. Positive x lengthens all seven springs relative to that equilibrium; the massless junction forces balance.',
    usage: 'Trace A, B and C from the floor toward the mass. Only the final k₅ supplies an external spring force to the mass.' }),
  topic({ id: 'mirrored-gravity', title: 'Gravity creates compression at rest', group: 'Equation of motion',
    tex: [String.raw`\Delta_s=-\frac{mg}{k_{\mathrm{eq}}}`, String.raw`m\ddot x=-mg-k_{\mathrm{eq}}(\Delta_s+x)=-k_{\mathrm{eq}}x`, String.raw`m\ddot x+k_{\mathrm{eq}}x=0`],
    description: 'Gravity is negative in the upward-positive coordinate. The signed static extension is negative: the springs are compressed. Substituting the static balance cancels gravity from the vibration equation.',
    usage: 'Assume vertical guides, rigid massless junctions and ideal bidirectional axial springs, with no buckling or loss of contact.' }),
  topic({ id: 'mirrored-response', title: 'Same stiffness and frequency as the hanging network', group: 'Motion and natural frequency',
    tex: [String.raw`\omega_n=\sqrt{k_{\mathrm{eq}}/m},\quad f_n=\omega_n/(2\pi),\quad T=2\pi/\omega_n`, String.raw`x(t)=x_0\cos(\omega_nt)+\frac{v_0}{\omega_n}\sin(\omega_nt)`],
    description: 'For equal parameters, simulations 03 and 05 have identical scalar motion and frequency, while their physical displacement directions are mirrored.',
    usage: 'Positive mass produces stable undamped oscillation. At m = 0 the equation is the equilibrium constraint x = 0, with no defined frequency.' }),
  topic({ id: 'mirrored-energy', title: 'All seven incremental spring energies still add', group: 'Energy',
    tex: [String.raw`U=\sum_{i=1}^7\tfrac12 k_i\delta_i^2=\tfrac12k_{\mathrm{eq}}x^2`, String.raw`E=\tfrac12m\dot x^2+\tfrac12k_{\mathrm{eq}}x^2=\mathrm{constant}`],
    description: 'About loaded equilibrium, static spring and gravity terms cancel. Compression and stretch both contribute positive quadratic vibration energy.',
    usage: 'Compare the seven physical spring energies with the equivalent-spring energy at any time.' }),
];
