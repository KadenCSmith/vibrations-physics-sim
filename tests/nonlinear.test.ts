import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS, deriveModel, sampleModel, sanitizeParameters, type Parameters } from '../src/physics/model';

const parameters = (changes: Partial<Parameters> = {}): Parameters => ({ ...DEFAULT_PARAMETERS, ...changes });

describe('full-trigonometric spring pendulum', () => {
  it('preserves legacy linear defaults while permitting finite angles in trig mode', () => {
    const p = parameters({ theta0Deg: 60 });
    expect(sanitizeParameters(p).theta0Deg).toBe(12);
    expect(sanitizeParameters(p, 'trig').theta0Deg).toBe(60);
    expect(deriveModel('pendulum', p).initialCoordinate).toBeCloseTo(12 * Math.PI / 180, 14);
    expect(deriveModel('pendulum', p, 'trig').initialCoordinate).toBeCloseTo(Math.PI / 3, 14);
  });

  it('satisfies full torque balance and exact initial conditions', () => {
    const p = parameters({ theta0Deg: 48, omega0Deg: 11 });
    const model = deriveModel('pendulum', p, 'trig');
    const start = sampleModel('pendulum', p, 0, 'trig');
    expect(start.theta).toBeCloseTo(48 * Math.PI / 180, 14);
    expect(start.thetaDot).toBeCloseTo(11 * Math.PI / 180, 14);
    for (const time of [0, 0.17, 0.43, 1.2, 100]) {
      const s = sampleModel('pendulum', p, time, 'trig');
      const expectedGravity = -p.m * p.g * p.l * Math.sin(s.theta);
      const expectedSpring = -p.k * p.l ** 2 * Math.sin(s.theta) * Math.cos(s.theta);
      expect(s.gravityTorque).toBeCloseTo(expectedGravity, 12);
      expect(s.springTorque).toBeCloseTo(expectedSpring, 12);
      expect(model.inertia * s.thetaDDot).toBeCloseTo(expectedGravity + expectedSpring, 12);
      expect(s.residual).toBeCloseTo(0, 12);
    }
  });

  it('uses true horizontal kinematics and distinguishes spring force from net force', () => {
    const p = parameters({ theta0Deg: 60, omega0Deg: 20 });
    const s = sampleModel('pendulum', p, 0, 'trig');
    expect(s.x).toBeCloseTo(p.l * Math.sin(s.theta), 14);
    expect(s.v).toBeCloseTo(p.l * Math.cos(s.theta) * s.thetaDot, 14);
    expect(s.a).toBeCloseTo(p.l * (Math.cos(s.theta) * s.thetaDDot - Math.sin(s.theta) * s.thetaDot ** 2), 14);
    expect(s.springForce).toBeCloseTo(-p.k * s.x, 14);
    expect(s.force).toBeCloseTo(p.m * s.a, 14);
    expect(s.kinetic).toBeCloseTo(0.5 * p.m * p.l ** 2 * s.thetaDot ** 2, 14);
    expect(s.kinetic).toBeGreaterThan(0.5 * p.m * s.v ** 2);
  });

  it('conserves full mechanical energy through long scrubs', () => {
    const p = parameters({ theta0Deg: 60 });
    const model = deriveModel('pendulum', p, 'trig');
    const energy = p.m * p.g * p.l * (1 - Math.cos(Math.PI / 3))
      + 0.5 * p.k * p.l ** 2 * Math.sin(Math.PI / 3) ** 2;
    for (const fraction of [0, 0.123, 0.25, 0.5, 0.77, 1, 37.31, 10_000.42]) {
      const s = sampleModel('pendulum', p, fraction * model.period, 'trig');
      expect(Math.abs(s.totalEnergy - energy) / energy).toBeLessThan(1e-8);
      expect(s.gravityPotential).toBeCloseTo(p.m * p.g * p.l * (1 - Math.cos(s.theta)), 11);
      expect(s.springPotential).toBeCloseTo(0.5 * p.k * p.l ** 2 * Math.sin(s.theta) ** 2, 11);
    }
  });

  it('reports the exact simple-pendulum period from an independent AGM relation', () => {
    const p = parameters({ k: 0, theta0Deg: 60 });
    const model = deriveModel('pendulum', p, 'trig');
    let arithmetic = 1;
    let geometric = Math.cos(Math.PI / 6);
    for (let i = 0; i < 10; i++) {
      [arithmetic, geometric] = [(arithmetic + geometric) / 2, Math.sqrt(arithmetic * geometric)];
    }
    const expected = 2 * Math.PI / (Math.sqrt(p.g / p.l) * arithmetic);
    expect(model.period).toBeCloseTo(expected, 10);
    expect(model.frequency).toBeCloseTo(1 / model.period, 14);
    expect(model.omega).toBeCloseTo(Math.sqrt(p.g / p.l), 14);
    expect(model.period).toBeGreaterThan(2 * Math.PI / model.omega);
  });

  it('reaches equilibrium and opposite turning points at cycle quarter times', () => {
    const p = parameters({ theta0Deg: 55 });
    const model = deriveModel('pendulum', p, 'trig');
    const quarter = sampleModel('pendulum', p, model.period / 4, 'trig');
    const half = sampleModel('pendulum', p, model.period / 2, 'trig');
    const end = sampleModel('pendulum', p, model.period, 'trig');
    expect(quarter.theta).toBeCloseTo(0, 9);
    expect(quarter.thetaDot).toBeLessThan(0);
    expect(half.theta).toBeCloseTo(-model.initialCoordinate, 9);
    expect(half.thetaDot).toBeCloseTo(0, 9);
    expect(end.theta).toBe(model.initialCoordinate);
    expect(end.thetaDot).toBe(model.initialRate);
  });

  it('has an amplitude-dependent period while retaining the small-angle omega reference', () => {
    const small = deriveModel('pendulum', parameters({ theta0Deg: 2 }), 'trig');
    const large = deriveModel('pendulum', parameters({ theta0Deg: 60 }), 'trig');
    expect(large.period).toBeGreaterThan(small.period);
    expect(large.omega).toBe(small.omega);
    expect(large.amplitude).toBeCloseTo(Math.PI / 3, 14);
    expect(large.xAmplitude).toBeCloseTo(DEFAULT_PARAMETERS.l * Math.sin(Math.PI / 3), 14);
  });

  it('approaches the linear solution as the angle tends to zero', () => {
    const p = parameters({ theta0Deg: 0.001 });
    const linear = deriveModel('pendulum', p);
    const trig = deriveModel('pendulum', p, 'trig');
    expect(trig.period).toBeCloseTo(linear.period, 9);
    for (const time of [0, 0.1, 0.43, 2]) {
      const expected = sampleModel('pendulum', p, time);
      const actual = sampleModel('pendulum', p, time, 'trig');
      expect(actual.theta).toBeCloseTo(expected.theta, 11);
      expect(actual.thetaDot).toBeCloseTo(expected.thetaDot, 10);
      expect(actual.x).toBeCloseTo(expected.x, 11);
    }
  });

  it('matches independently differenced horizontal velocity and acceleration', () => {
    const p = parameters({ theta0Deg: 50, omega0Deg: -10 });
    const time = 0.413;
    const dt = 1e-4;
    const before = sampleModel('pendulum', p, time - dt, 'trig');
    const now = sampleModel('pendulum', p, time, 'trig');
    const after = sampleModel('pendulum', p, time + dt, 'trig');
    expect((after.x - before.x) / (2 * dt)).toBeCloseTo(now.v, 6);
    expect((after.v - before.v) / (2 * dt)).toBeCloseTo(now.a, 6);
  });

  it('is sign-symmetric and reproducible after replacing the one-trajectory cache', () => {
    const positive = parameters({ theta0Deg: 45, omega0Deg: 8 });
    const negative = parameters({ theta0Deg: -45, omega0Deg: -8 });
    const first = sampleModel('pendulum', positive, 0.37, 'trig');
    const opposite = sampleModel('pendulum', negative, 0.37, 'trig');
    const repeated = sampleModel('pendulum', positive, 0.37, 'trig');
    expect(opposite.theta).toBeCloseTo(-first.theta, 12);
    expect(opposite.thetaDot).toBeCloseTo(-first.thetaDot, 12);
    expect(opposite.totalEnergy).toBeCloseTo(first.totalEnergy, 12);
    expect(repeated).toEqual(first);
  });

  it('detects rotation for high-energy nonzero-rate callers instead of inventing a turning point', () => {
    const p = parameters({ g: 0.1, l: 3, k: 0, theta0Deg: 60, omega0Deg: 20 });
    const model = deriveModel('pendulum', p, 'trig');
    const start = sampleModel('pendulum', p, 0, 'trig');
    const next = sampleModel('pendulum', p, model.period, 'trig');
    expect(model.amplitude).toBe(Infinity);
    expect(Number.isFinite(model.period)).toBe(true);
    expect(next.theta - start.theta).toBeCloseTo(2 * Math.PI, 11);
    expect(next.x).toBeCloseTo(start.x, 12);
    expect(next.thetaDot).toBeCloseTo(start.thetaDot, 12);
  });

  it('keeps an exact zero-energy release at equilibrium and handles invalid times', () => {
    const p = parameters({ theta0Deg: 0, omega0Deg: 0 });
    expect(sampleModel('pendulum', p, 100, 'trig').totalEnergy).toBe(0);
    expect(sampleModel('pendulum', p, 100, 'trig').theta).toBe(0);
    expect(sampleModel('pendulum', p, Infinity, 'trig')).toEqual(sampleModel('pendulum', p, 0, 'trig'));
    expect(sampleModel('network', p, 0.43, 'trig')).toEqual(sampleModel('network', p, 0.43));
  });
});
