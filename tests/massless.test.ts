import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS, deriveModel, sampleModel, sanitizeParameters, type Parameters, type PendulumMode, type ProblemId } from '../src/physics/model';

const parameters = (changes: Partial<Parameters> = {}): Parameters => ({ ...DEFAULT_PARAMETERS, ...changes });

function expectFiniteFields(object: object): void {
  for (const value of Object.values(object)) {
    if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    else if (Array.isArray(value)) value.forEach((number) => expect(Number.isFinite(number)).toBe(true));
  }
}

describe('zero-mass static constraints', () => {
  it('accepts zero mass exactly and clamps negative mass to zero', () => {
    expect(PARAMETER_LIMITS.m.min).toBe(0);
    expect(sanitizeParameters({ m: 0 }).m).toBe(0);
    expect(sanitizeParameters({ m: -2 }).m).toBe(0);
    expect(sanitizeParameters({ m: -Number.MIN_VALUE }).m).toBe(0);
  });

  it.each([Number.MIN_VALUE, 1e-320, 1e-308, 1e-100, 0.000001, 0.01, 0.0999])(
    'normalizes unsupported positive mass %s to the first slider step', (mass) => {
      expect(sanitizeParameters({ m: mass }).m).toBe(0.1);
      expect(sanitizeParameters({ m: mass }, 'trig').m).toBe(0.1);
    },
  );

  it('preserves supported positive values and rejects nonfinite mass input', () => {
    expect(sanitizeParameters({ m: 0.1 }).m).toBe(0.1);
    expect(sanitizeParameters({ m: 0.2 }).m).toBe(0.2);
    expect(sanitizeParameters({ m: 0.123456 }).m).toBe(0.123456);
    expect(sanitizeParameters({ m: NaN }).m).toBe(DEFAULT_PARAMETERS.m);
    expect(sanitizeParameters({ m: Infinity }).m).toBe(DEFAULT_PARAMETERS.m);
  });

  it.each<ProblemId>(['pendulum', 'network'])(
    'evaluates tiny-positive input safely for %s at nonzero scrub times', (problem) => {
      for (const mode of ['linear', 'trig'] as PendulumMode[]) {
        const tiny = parameters({ m: 1e-320 });
        const supported = parameters({ m: 0.1 });
        const model = deriveModel(problem, tiny, mode);
        expect(model.massless).toBe(false);
        expect(model.inertia).toBeGreaterThan(0);
        expect(model.period).toBeGreaterThan(0);
        expectFiniteFields(model);
        for (const time of [0, 0.43, 1000 * model.period + 0.17]) {
          const s = sampleModel(problem, tiny, time, mode);
          expectFiniteFields(s);
          expect(s).toEqual(sampleModel(problem, supported, time, mode));
        }
      }
    },
  );

  it('restores a finite positive-mass trajectory after zero and tiny-input edits', () => {
    const dynamic = parameters({ m: 0.2, theta0Deg: 40 });
    const before = sampleModel('pendulum', dynamic, 0.47, 'trig');
    expect(deriveModel('pendulum', { ...dynamic, m: 0 }, 'trig').massless).toBe(true);
    const tiny = sampleModel('pendulum', { ...dynamic, m: Number.MIN_VALUE }, 0.47, 'trig');
    expectFiniteFields(tiny);
    const restored = sampleModel('pendulum', dynamic, 0.47, 'trig');
    expect(restored).toEqual(before);
    expect(deriveModel('pendulum', dynamic, 'trig').massless).toBe(false);
  });

  it.each<PendulumMode>(['linear', 'trig'])('constrains the spring pendulum to equilibrium in %s mode', (mode) => {
    const p = parameters({ m: 0, theta0Deg: 55, omega0Deg: 20 });
    const model = deriveModel('pendulum', p, mode);
    expect(model.massless).toBe(true);
    expect(model.inertia).toBe(0);
    expect(model.coordinateStiffness).toBe(p.k * p.l ** 2);
    expect(model.linearStiffness).toBe(p.k);
    expect(model.initialCoordinate).toBe(0);
    expect(model.initialRate).toBe(0);
    expect(model.omega).toBe(0);
    expect(model.frequency).toBe(0);
    expect(model.period).toBe(0);
    expect(model.amplitude).toBe(0);
    expectFiniteFields(model);
    for (const time of [-1, 0, 0.73, 1_000_000]) {
      const s = sampleModel('pendulum', p, time, mode);
      expect(s.q).toBe(0);
      expect(s.x).toBe(0);
      expect(s.qDot).toBe(0);
      expect(s.qDDot).toBe(0);
      expect(s.springTorque).toBe(0);
      expect(s.gravityTorque).toBe(0);
      expect(s.totalEnergy).toBe(0);
      expect(s.residual).toBe(0);
      expectFiniteFields(s);
    }
  });

  it('constrains the zero-mass spring network without dividing by inertia', () => {
    const p = parameters({ m: 0, x0: 0.2, v0: -0.5 });
    const model = deriveModel('network', p);
    expect(model.massless).toBe(true);
    expect(model.coordinateStiffness).toBeGreaterThan(0);
    expect(model.inertia).toBe(0);
    expect(model.omega).toBe(0);
    expect(model.period).toBe(0);
    expectFiniteFields(model);
    const s = sampleModel('network', p, 19);
    expect(s.q).toBe(0);
    expect(s.x).toBe(0);
    expect(s.force).toBe(0);
    expect(s.seriesJunction).toBe(0);
    expect(s.branchExtensions).toEqual([0, 0, 0, 0, 0]);
    expect(s.branchForces).toEqual([0, 0, 0, 0, 0]);
    expect(s.totalEnergy).toBe(0);
    expect(s.residual).toBe(0);
    expectFiniteFields(s);
  });

  it.each<PendulumMode>(['linear', 'trig'])('holds the chosen angle in the wholly degenerate %s pendulum', (mode) => {
    const p = parameters({ m: 0, k: 0, theta0Deg: 45, omega0Deg: 20 });
    const expectedTheta = (mode === 'linear' ? 12 : 45) * Math.PI / 180;
    const model = deriveModel('pendulum', p, mode);
    const s = sampleModel('pendulum', p, 999, mode);
    expect(model.massless).toBe(true);
    expect(model.coordinateStiffness).toBe(0);
    expect(model.omega).toBe(0);
    expect(model.frequency).toBe(0);
    expect(model.period).toBe(0);
    expect(model.amplitude).toBe(0);
    expect(s.theta).toBeCloseTo(expectedTheta, 14);
    expect(s.x).toBeCloseTo(p.l * (mode === 'trig' ? Math.sin(expectedTheta) : expectedTheta), 14);
    expect(s.thetaDot).toBe(0);
    expect(s.thetaDDot).toBe(0);
    expect(s.gravityTorque).toBe(0);
    expect(s.springTorque).toBe(0);
    expect(s.force).toBe(0);
    expect(s.kinetic).toBe(0);
    expect(s.potential).toBe(0);
    expect(s.totalEnergy).toBe(0);
    expect(s.residual).toBe(0);
    expectFiniteFields(model);
    expectFiniteFields(s);
  });

  it('marks positive-inertia models as dynamic and preserves their cached trig trajectory', () => {
    const dynamic = parameters({ theta0Deg: 45 });
    const before = sampleModel('pendulum', dynamic, 0.47, 'trig');
    sampleModel('pendulum', { ...dynamic, m: 0 }, 0.47, 'trig');
    expect(sampleModel('pendulum', dynamic, 0.47, 'trig')).toEqual(before);
    for (const problem of ['pendulum', 'network'] as ProblemId[]) {
      for (const mode of ['linear', 'trig'] as PendulumMode[]) {
        expect(deriveModel(problem, dynamic, mode).massless).toBe(false);
      }
    }
  });

  it('keeps invalid-time handling finite at zero mass', () => {
    const p = parameters({ m: 0 });
    expect(sampleModel('pendulum', p, Infinity, 'trig')).toEqual(sampleModel('pendulum', p, 0, 'trig'));
    expectFiniteFields(sampleModel('network', p, NaN));
  });
});
