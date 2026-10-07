import { compoundDeformation, sanitizeParameters, type Parameters } from './model';

export type SpringParameterKey = 'k1' | 'k2' | 'k3' | 'k4' | 'k5';

/** Physical order matches the seven extensions in the compound force balance. */
export const COMPOUND_SPRINGS: {
  name: string; parameter: SpringParameterKey; symbol: string;
  connection: string; relationship: string; editNote: string; paired: boolean;
}[] = [
  { name: 'k₁ · left spring', parameter: 'k1', symbol: 'k₁', connection: 'Floor support → junction A',
    relationship: 'In parallel with the right k₁ spring. The pair is in series with k₂ and the k₃ pair.',
    editNote: 'Both k₁ springs are identical and share this setting. Changing it updates both springs.', paired: true },
  { name: 'k₁ · right spring', parameter: 'k1', symbol: 'k₁', connection: 'Floor support → junction A',
    relationship: 'In parallel with the left k₁ spring. The pair is in series with k₂ and the k₃ pair.',
    editNote: 'Both k₁ springs are identical and share this setting. Changing it updates both springs.', paired: true },
  { name: 'k₂ · middle spring', parameter: 'k2', symbol: 'k₂', connection: 'Junction A → junction B',
    relationship: 'In series with the k₁ and k₃ parallel pairs. It carries the entire left-branch force.',
    editNote: 'Changes only the middle spring. A softer series member takes a larger share of deformation.', paired: false },
  { name: 'k₃ · left spring', parameter: 'k3', symbol: 'k₃', connection: 'Junction B → collector C',
    relationship: 'In parallel with the right k₃ spring. The pair is the mass-side group of the left series branch.',
    editNote: 'Both k₃ springs are identical and share this setting. Changing it updates both springs.', paired: true },
  { name: 'k₃ · right spring', parameter: 'k3', symbol: 'k₃', connection: 'Junction B → collector C',
    relationship: 'In parallel with the left k₃ spring. The pair is the mass-side group of the left series branch.',
    editNote: 'Both k₃ springs are identical and share this setting. Changing it updates both springs.', paired: true },
  { name: 'k₄ · bypass spring', parameter: 'k4', symbol: 'k₄', connection: 'Floor support → collector C',
    relationship: 'In parallel with the complete left branch, bypassing both pairs and k₂.',
    editNote: 'Changes only the long bypass spring. Its stiffness adds to the reduced left-branch stiffness.', paired: false },
  { name: 'k₅ · final spring', parameter: 'k5', symbol: 'k₅', connection: 'Collector C → moving mass',
    relationship: 'In series with the complete six-spring support assembly. This is the only spring attached directly to the mass.',
    editNote: 'Changes only the final spring. Its force is the spring contribution acting directly on the mass.', paired: false },
];

export function compoundSpringCharacteristics(parameters: Parameters, x: number, index: number) {
  const spring = COMPOUND_SPRINGS[index];
  if (!spring) return undefined;
  const p = sanitizeParameters(parameters);
  const deformation = compoundDeformation(p, x);
  const stiffness = p[spring.parameter];
  const extension = deformation.extensions[index];
  return {
    ...spring, stiffness, extension,
    compliance: 1 / stiffness,
    forceMagnitude: Math.abs(deformation.forces[index]),
    vibrationEnergy: .5 * stiffness * extension ** 2,
    pairStiffness: spring.paired ? 2 * stiffness : undefined,
  };
}
