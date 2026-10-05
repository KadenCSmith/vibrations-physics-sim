import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMETERS,
  PARAMETER_LIMITS,
  deriveModel,
  sampleModel,
  sanitizeParameters,
  type Parameters,
  type ProblemId,
} from '../src/physics/model';

const parameters = (changes: Partial<Parameters> = {}): Parameters => ({ ...DEFAULT_PARAMETERS, ...changes });

describe('input handling', () => {
  it('defaults invalid values, clamps unsafe values, and preserves input precision', () => {
    const p = sanitizeParameters({ m: -2, l: Infinity, k: NaN, g: 0, x0: 1, theta0Deg: -99, k1: 27.123 });
    expect(p.m).toBe(PARAMETER_LIMITS.m.min);
    expect(p.l).toBe(DEFAULT_PARAMETERS.l);
    expect(p.k).toBe(DEFAULT_PARAMETERS.k);
    expect(p.g).toBe(PARAMETER_LIMITS.g.min);
    expect(p.x0).toBe(0.25);
    expect(p.theta0Deg).toBe(-12);
    expect(p.k1).toBe(27.123);
    expect(p.k2).toBe(DEFAULT_PARAMETERS.k2);
  });

  it('does not mutate defaults or the supplied input', () => {
    const input = { m: -10 };
    const p = sanitizeParameters(input);
    p.k = 90;
    expect(input.m).toBe(-10);
    expect(DEFAULT_PARAMETERS.k).toBe(8);
  });
});

describe('spring pendulum', () => {
  it('uses the full rod length for spring torque and inertia', () => {
    const p = parameters({ m: 3, l: 2, k: 12, g: 9.81 });
    const model = deriveModel('pendulum', p);
    expect(model.inertia).toBe(12);
    expect(model.coordinateStiffness).toBeCloseTo(3 * 9.81 * 2 + 12 * 4, 12);
    expect(model.omega).toBeCloseTo(Math.sqrt(9.81 / 2 + 12 / 3), 12);
    expect(model.frequency * 2 * Math.PI).toBeCloseTo(model.omega, 12);
    expect(model.period * model.frequency).toBeCloseTo(1, 12);
  });

  it('recovers a simple pendulum when its spring is removed', () => {
    const p = parameters({ k: 0, l: 1.8, m: 4 });
    expect(deriveModel('pendulum', p).omega).toBeCloseTo(Math.sqrt(p.g / p.l), 12);
    expect(sampleModel('pendulum', p, 0).springPotential).toBe(0);
    expect(deriveModel('pendulum', { ...p, m: 8 }).omega).toBeCloseTo(deriveModel('pendulum', p).omega, 12);
  });

  it('keeps linearized displacement, torque, and energy consistent', () => {
    const p = parameters({ theta0Deg: -9, omega0Deg: 11 });
    const model = deriveModel('pendulum', p);
    const s = sampleModel('pendulum', p, 0.31);
    expect(s.x).toBeCloseTo(p.l * s.theta, 14);
    expect(s.force).toBeCloseTo(p.m * s.a, 12);
    expect(s.springForce).toBeCloseTo(-p.k * s.x, 12);
    expect(s.gravityTorque + s.springTorque).toBeCloseTo(model.inertia * s.thetaDDot, 12);
    expect(s.gravityPotential).toBeCloseTo(0.5 * p.m * p.g * p.l * s.theta ** 2, 12);
    expect(s.springPotential).toBeCloseTo(0.5 * p.k * s.x ** 2, 12);
    expect(s.potential).toBeCloseTo(0.5 * model.coordinateStiffness * s.theta ** 2, 12);
  });
});

describe('five-spring network', () => {
  it('puts only k4 and k5 in series, with all four load paths in parallel', () => {
    const p = parameters({ k1: 11, k2: 17, k3: 23, k4: 40, k5: 60 });
    const model = deriveModel('network', p);
    expect(model.k45).toBe(24);
    expect(model.coordinateStiffness).toBe(75);
    expect(model.omega).toBeCloseTo(Math.sqrt(75 / p.m), 12);
  });

  it('gives 3.5k for five identical springs and the expected mass scaling', () => {
    const p = parameters({ k1: 20, k2: 20, k3: 20, k4: 20, k5: 20 });
    const model = deriveModel('network', p);
    expect(model.linearStiffness).toBe(70);
    expect(deriveModel('network', { ...p, m: p.m * 4 }).omega).toBeCloseTo(model.omega / 2, 12);
  });

  it('balances the massless junction and gives the softer series spring more deformation', () => {
    const p = parameters({ k4: 20, k5: 80, x0: 0.2 });
    const s = sampleModel('network', p, 0);
    expect(s.seriesJunction).toBeCloseTo(0.04, 12);
    [0.2, 0.2, -0.2, -0.16, -0.04].forEach((extension, i) => {
      expect(s.branchExtensions[i]).toBeCloseTo(extension, 12);
    });
    expect(p.k4 * s.branchExtensions[3]).toBeCloseTo(p.k5 * s.branchExtensions[4], 12);
    expect(s.branchExtensions[3] + s.branchExtensions[4]).toBeCloseTo(-s.x, 12);
    expect(s.branchForces[3]).toBe(s.branchForces[4]);
    expect(s.branchForces.slice(0, 4).reduce((sum, force) => sum + force, 0)).toBeCloseTo(s.force, 12);
    expect(s.force).toBeCloseTo(p.m * s.a, 12);
  });

  it('matches equivalent-spring energy to the sum of all five physical spring energies', () => {
    const p = parameters({ x0: -0.15, v0: 0.2, k4: 12, k5: 180 });
    const s = sampleModel('network', p, 0.17);
    const stiffnesses = [p.k1, p.k2, p.k3, p.k4, p.k5];
    const energy = s.branchExtensions.reduce((sum, extension, i) => sum + 0.5 * stiffnesses[i] * extension ** 2, 0);
    expect(energy).toBeCloseTo(s.springPotential, 12);
    expect(s.gravityPotential).toBe(0);
    expect(s.potential).toBe(s.springPotential);
  });

  it('has no gravity dependence when measured from static equilibrium', () => {
    const p = parameters();
    expect(deriveModel('network', { ...p, g: 1 }).omega).toBe(deriveModel('network', { ...p, g: 20 }).omega);
  });
});

describe.each<ProblemId>(['pendulum', 'network'])('%s analytical trajectory', (problem) => {
  const p = parameters({ theta0Deg: -5, omega0Deg: 7, x0: 0.08, v0: -0.15 });

  it('satisfies nonzero initial displacement and velocity and repeats after one period', () => {
    const model = deriveModel(problem, p);
    const start = sampleModel(problem, p, 0);
    const end = sampleModel(problem, p, model.period);
    expect(start.q).toBeCloseTo(model.initialCoordinate, 13);
    expect(start.qDot).toBeCloseTo(model.initialRate, 13);
    expect(end.q).toBeCloseTo(start.q, 13);
    expect(end.qDot).toBeCloseTo(start.qDot, 13);
    expect(model.amplitude).toBeCloseTo(Math.sqrt(start.q ** 2 + (start.qDot / model.omega) ** 2), 13);
  });

  it('conserves total mechanical energy and satisfies its EOM through many periods', () => {
    const model = deriveModel(problem, p);
    const expectedEnergy = 0.5 * model.coordinateStiffness * model.initialCoordinate ** 2
      + 0.5 * model.inertia * model.initialRate ** 2;
    for (const fraction of [0, 0.125, 0.25, 0.5, 0.875, 1, 37.31, 1000.42]) {
      const s = sampleModel(problem, p, fraction * model.period);
      expect(s.totalEnergy).toBeCloseTo(expectedEnergy, 11);
      expect(s.residual).toBeCloseTo(0, 11);
      expect(Math.abs(s.q)).toBeLessThanOrEqual(model.amplitude + 1e-12);
    }
  });

  it('agrees with independently differenced displacement and velocity', () => {
    const time = 0.43;
    const dt = 1e-5;
    const before = sampleModel(problem, p, time - dt);
    const now = sampleModel(problem, p, time);
    const after = sampleModel(problem, p, time + dt);
    expect((after.q - before.q) / (2 * dt)).toBeCloseTo(now.qDot, 7);
    expect((after.qDot - before.qDot) / (2 * dt)).toBeCloseTo(now.qDDot, 7);
  });

  it('stays at equilibrium with zero displacement and velocity', () => {
    const s = sampleModel(problem, parameters({ theta0Deg: 0, omega0Deg: 0, x0: 0, v0: 0 }), 100);
    expect(s.q).toBeCloseTo(0, 14);
    expect(s.totalEnergy).toBe(0);
  });

  it('uses the initial state for nonfinite time input', () => {
    expect(sampleModel(problem, p, Infinity)).toEqual(sampleModel(problem, p, 0));
  });
});
