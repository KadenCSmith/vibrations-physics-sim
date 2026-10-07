import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS, deriveModel, sampleModel } from '../src/physics/model';

const p = { ...DEFAULT_PARAMETERS, m: 3, k1: 10, k2: 30, k3: 20, k4: 60, k5: 90, x0: .14, v0: -.2 };

describe('floor-supported compound network', () => {
  it('uses the independently reduced stiffness and retains the mirrored model identity', () => {
    const model = deriveModel('compound-inverted', p);
    expect(model.problem).toBe('compound-inverted');
    expect(model.linearStiffness).toBeCloseTo(900 / 23, 12);
    expect(model.omega).toBeCloseTo(Math.sqrt(300 / 23), 12);
    expect(model.k45).toBe(0);
  });

  it('balances gravity with compressive static forces in an upward-positive coordinate', () => {
    const k = 900 / 23;
    const staticExtension = -p.m * p.g / k;
    expect(staticExtension).toBeLessThan(0);
    for (const t of [0, .13, .5, 1.1, 4.8]) {
      const s = sampleModel('compound-inverted', p, t);
      expect(p.m * s.a).toBeCloseTo(-p.m * p.g - k * (staticExtension + s.x), 12);
      expect(s.branchForces[6]).toBeCloseTo(p.m * s.a, 12);
      expect(s.residual).toBeCloseTo(0, 12);
    }
  });

  it('balances every massless junction and preserves seven-spring energy over a cycle', () => {
    const model = deriveModel('compound-inverted', p);
    const stiffnesses = [p.k1, p.k1, p.k2, p.k3, p.k3, p.k4, p.k5];
    const energy = .5 * p.m * p.v0 ** 2 + .5 * (900 / 23) * p.x0 ** 2;
    for (const fraction of [0, .125, .25, .5, .75, 1, 100.3]) {
      const s = sampleModel('compound-inverted', p, model.period * fraction);
      const f = s.branchForces;
      expect(f).toHaveLength(7);
      expect(f[0] + f[1]).toBeCloseTo(f[2], 12);
      expect(f[2]).toBeCloseTo(f[3] + f[4], 12);
      expect(f[3] + f[4] + f[5]).toBeCloseTo(f[6], 12);
      const physicalEnergy = s.branchExtensions.reduce((sum, extension, i) => sum + .5 * stiffnesses[i] * extension ** 2, 0);
      expect(physicalEnergy).toBeCloseTo(s.springPotential, 12);
      expect(s.totalEnergy).toBeCloseTo(energy, 12);
    }
  });

  it('has the same scalar response as the hanging assembly independent of gravity', () => {
    for (const t of [0, .25, 1.7]) {
      expect(sampleModel('compound-inverted', p, t)).toEqual(sampleModel('compound', p, t));
      expect(sampleModel('compound-inverted', { ...p, g: 1.62 }, t)).toEqual(sampleModel('compound-inverted', p, t));
    }
  });

  it('treats zero mass as a finite seven-spring equilibrium constraint', () => {
    const zero = { ...p, m: 0 };
    expect(deriveModel('compound-inverted', zero).massless).toBe(true);
    const s = sampleModel('compound-inverted', zero, 10);
    expect(s.x).toBe(0);
    expect(s.branchExtensions).toEqual(Array(7).fill(0));
    expect(s.branchForces).toEqual(Array(7).fill(0));
    expect(s.totalEnergy).toBe(0);
    Object.values(s).flat().forEach(value => expect(Number.isFinite(value)).toBe(true));
  });
});
