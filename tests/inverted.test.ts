import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS, deriveModel, sampleModel, type Parameters } from '../src/physics/model';

const DEG = Math.PI / 180;
const LIMIT = 12 * DEG;
const parameters = (changes: Partial<Parameters> = {}): Parameters => ({ ...DEFAULT_PARAMETERS, ...changes });
const critical = DEFAULT_PARAMETERS.m * DEFAULT_PARAMETERS.g / (4 * DEFAULT_PARAMETERS.l);

describe('upright uniform bar stiffness and stability', () => {
  it('uses full-height spring torques, half-height gravity, and uniform-bar inertia', () => {
    const p = parameters();
    const model = deriveModel('inverted', p);
    expect(model.stability).toBe('stable');
    expect(model.inertia).toBeCloseTo(0.96, 14);
    expect(model.coordinateStiffness).toBeCloseTo(11.268, 12);
    expect(model.omega ** 2).toBeCloseTo(6 * p.k / p.m - 3 * p.g / (2 * p.l), 12);
    expect(model.omega).toBeCloseTo(3.426, 3);
    expect(model.frequency * 2 * Math.PI).toBeCloseTo(model.omega, 12);
    expect(model.period * model.frequency).toBeCloseTo(1, 12);
    expect(model.growthRate).toBe(0);
    expect(model.smallAngleEndTime).toBe(Infinity);
    expect(model.observationDuration).toBe(4 * model.period);
  });

  it('changes stability at kcrit=mg/(4L), including roundoff-safe exact neutrality', () => {
    const neutral = deriveModel('inverted', parameters({ k: critical }));
    const stable = deriveModel('inverted', parameters({ k: critical + 0.001 }));
    const unstable = deriveModel('inverted', parameters({ k: critical - 0.001 }));
    expect(neutral.stability).toBe('neutral');
    expect(neutral.coordinateStiffness).toBe(0);
    expect(neutral.omega).toBe(0);
    expect(neutral.frequency).toBe(0);
    expect(neutral.period).toBe(Infinity);
    expect(stable.stability).toBe('stable');
    expect(stable.omega).toBeGreaterThan(0);
    expect(unstable.stability).toBe('unstable');
    expect(unstable.coordinateStiffness).toBeLessThan(0);
    expect(unstable.omega).toBe(0);
    expect(unstable.frequency).toBe(0);
    expect(unstable.period).toBe(Infinity);
    expect(unstable.growthRate! ** 2).toBeCloseTo(-unstable.coordinateStiffness / unstable.inertia, 12);
  });

  it('keeps the inverted bar within the 12-degree input range independently of pendulum mode', () => {
    const p = parameters({ theta0Deg: 60 });
    const model = deriveModel('inverted', p, 'trig');
    expect(model.initialCoordinate).toBe(LIMIT);
    expect(model.smallAngleEndTime).toBe(0);
    expect(model.observationDuration).toBe(0);
    expect(sampleModel('inverted', p, 0, 'trig').theta).toBeCloseTo(LIMIT, 14);
    expect(sampleModel('inverted', p, 0, 'trig')).toEqual(sampleModel('inverted', p, 0));
  });
});

describe('inverted bar analytical regimes', () => {
  it('satisfies a stable harmonic release with both initial conditions and period recurrence', () => {
    const p = parameters({ theta0Deg: -5, omega0Deg: 9 });
    const model = deriveModel('inverted', p);
    const start = sampleModel('inverted', p, 0);
    const end = sampleModel('inverted', p, model.period);
    expect(start.theta).toBeCloseTo(p.theta0Deg * DEG, 14);
    expect(start.thetaDot).toBeCloseTo(p.omega0Deg * DEG, 14);
    expect(start.thetaDDot).toBeCloseTo(-(model.omega ** 2) * start.theta, 13);
    expect(end.theta).toBeCloseTo(start.theta, 13);
    expect(end.thetaDot).toBeCloseTo(start.thetaDot, 13);
    expect(model.amplitude).toBeCloseTo(Math.hypot(start.theta, start.thetaDot / model.omega), 14);
  });

  it('gives straight-line drift at neutral stiffness and stops its window at the angle boundary', () => {
    const p = parameters({ k: critical, theta0Deg: 8, omega0Deg: 2 });
    const model = deriveModel('inverted', p);
    expect(model.smallAngleEndTime).toBeCloseTo(2, 12);
    expect(model.observationDuration).toBeCloseTo(2, 12);
    for (const t of [0, 0.5, 1, 2]) {
      const s = sampleModel('inverted', p, t);
      expect(s.theta).toBeCloseTo((8 + 2 * t) * DEG, 14);
      expect(s.thetaDot).toBeCloseTo(2 * DEG, 14);
      expect(s.thetaDDot).toBe(0);
      expect(s.potential).toBe(0);
      expect(s.totalEnergy).toBeCloseTo(0.5 * model.inertia * (2 * DEG) ** 2, 14);
    }
    const stationary = deriveModel('inverted', parameters({ k: critical, omega0Deg: 0 }));
    expect(stationary.smallAngleEndTime).toBe(Infinity);
    expect(stationary.observationDuration).toBe(8);
  });

  it('uses cosh/sinh in the unstable regime and reaches its boundary at the analytical time', () => {
    const p = parameters({ k: 0, theta0Deg: 2, omega0Deg: 0 });
    const model = deriveModel('inverted', p);
    const growth = model.growthRate!;
    const boundaryTime = Math.acosh(6) / growth;
    expect(model.smallAngleEndTime).toBeCloseTo(boundaryTime, 13);
    expect(model.observationDuration).toBeCloseTo(boundaryTime, 13);
    const t = 0.4 * boundaryTime;
    const s = sampleModel('inverted', p, t);
    expect(s.theta).toBeCloseTo(2 * DEG * Math.cosh(growth * t), 14);
    expect(s.thetaDot).toBeCloseTo(2 * DEG * growth * Math.sinh(growth * t), 14);
    expect(s.thetaDDot).toBeCloseTo(growth ** 2 * s.theta, 13);
    expect(sampleModel('inverted', p, boundaryTime).theta).toBeCloseTo(LIMIT, 13);
    expect(sampleModel('inverted', p, boundaryTime * 0.99).theta).toBeLessThan(LIMIT);
    // The evaluator retains the equation; the UI must stop at the boundary, not clip theta.
    expect(sampleModel('inverted', p, boundaryTime * 1.01).theta).toBeGreaterThan(LIMIT);
  });

  it('supports growing and decaying unstable solutions without numerical cancellation', () => {
    // g=1, L=1.5, k=0 gives the exact growth rate 1/s.
    const base = parameters({ g: 1, l: 1.5, k: 0, theta0Deg: 4 });
    const growing = { ...base, omega0Deg: 4 };
    const decaying = { ...base, omega0Deg: -4 };
    expect(deriveModel('inverted', growing).growthRate).toBe(1);
    expect(deriveModel('inverted', growing).smallAngleEndTime).toBeCloseTo(Math.log(3), 13);
    const decayModel = deriveModel('inverted', decaying);
    expect(decayModel.smallAngleEndTime).toBe(Infinity);
    expect(decayModel.observationDuration).toBe(8);
    const s = sampleModel('inverted', decaying, 8);
    expect(s.theta).toBeCloseTo(4 * DEG * Math.exp(-8), 16);
    expect(s.thetaDot).toBeCloseTo(-s.theta, 16);
    expect(s.thetaDDot).toBeCloseTo(s.theta, 16);
    expect(s.totalEnergy).toBeCloseTo(0, 18);
  });

  it('finds the first stable boundary even when initial velocity makes the amplitude exceed 12 degrees', () => {
    const omega = 0.1;
    const p = parameters({ k: critical + DEFAULT_PARAMETERS.m * omega ** 2 / 6, theta0Deg: 0, omega0Deg: 2 });
    const model = deriveModel('inverted', p);
    const expected = Math.asin(12 * DEG / (2 * DEG / model.omega)) / model.omega;
    expect(model.stability).toBe('stable');
    expect(model.amplitude).toBeGreaterThan(LIMIT);
    expect(model.smallAngleEndTime).toBeCloseTo(expected, 12);
    expect(model.observationDuration).toBe(model.smallAngleEndTime);
    expect(sampleModel('inverted', p, expected).theta).toBeCloseTo(LIMIT, 13);
    expect(sampleModel('inverted', p, expected * 0.9).theta).toBeLessThan(LIMIT);
  });

  it('tracks a reversal before the unstable bar reaches the opposite boundary', () => {
    const p = parameters({ k: 0, theta0Deg: 2, omega0Deg: -12 });
    const model = deriveModel('inverted', p);
    const t = model.smallAngleEndTime!;
    expect(t).toBeGreaterThan(0);
    expect(sampleModel('inverted', p, t).theta).toBeCloseTo(-LIMIT, 13);
    for (const fraction of [0, 0.1, 0.3, 0.7, 0.99]) {
      expect(Math.abs(sampleModel('inverted', p, t * fraction).theta)).toBeLessThan(LIMIT);
    }
  });
});

describe.each(['stable', 'neutral', 'unstable'] as const)('inverted %s torque and energy', (regime) => {
  const p = parameters({ k: regime === 'stable' ? 8 : regime === 'neutral' ? critical : 0, theta0Deg: 5, omega0Deg: -3 });

  it('keeps SI coordinates, two spring elongations, inertia, and all EOM terms consistent', () => {
    const model = deriveModel('inverted', p);
    const time = Math.min(0.25, model.observationDuration! * 0.2);
    const s = sampleModel('inverted', p, time);
    expect(s.x).toBe(p.l * s.theta);
    expect(s.v).toBe(p.l * s.thetaDot);
    expect(s.a).toBe(p.l * s.thetaDDot);
    expect(s.gravityTorque).toBeCloseTo(p.m * p.g * p.l * s.theta / 2, 13);
    expect(s.springTorque).toBeCloseTo(-2 * p.k * p.l ** 2 * s.theta, 13);
    expect(s.gravityTorque + s.springTorque).toBeCloseTo(model.inertia * s.thetaDDot, 12);
    expect(s.inertialTerm).toBeCloseTo(model.inertia * s.thetaDDot, 13);
    expect(s.restoringTerm).toBeCloseTo(model.coordinateStiffness * s.theta, 13);
    expect(s.residual).toBeCloseTo(0, 12);
    expect(s.springForce).toBeCloseTo(-2 * p.k * s.x, 13);
    expect(s.force).toBeCloseTo((p.m / 3) * s.a, 12);
    expect(s.branchExtensions).toEqual([s.x, -s.x]);
    expect(s.branchForces).toEqual([-p.k * s.x, p.k * s.x]);
    const dt = 1e-5;
    const before = sampleModel('inverted', p, time - dt);
    const after = sampleModel('inverted', p, time + dt);
    expect((after.theta - before.theta) / (2 * dt)).toBeCloseTo(s.thetaDot, 7);
    expect((after.thetaDot - before.thetaDot) / (2 * dt)).toBeCloseTo(s.thetaDDot, 7);
  });

  it('conserves signed vibration energy, including destabilizing negative gravity potential', () => {
    const model = deriveModel('inverted', p);
    const initialEnergy = 0.5 * model.inertia * (p.omega0Deg * DEG) ** 2
      + 0.5 * model.coordinateStiffness * (p.theta0Deg * DEG) ** 2;
    for (const fraction of [0, 0.1, 0.3, 0.5, 0.8, 1]) {
      const s = sampleModel('inverted', p, fraction * model.observationDuration!);
      expect(s.gravityPotential).toBeCloseTo(-p.m * p.g * p.l * s.theta ** 2 / 4, 13);
      expect(s.springPotential).toBeCloseTo(p.k * p.l ** 2 * s.theta ** 2, 13);
      expect(s.springPotential).toBeCloseTo(0.5 * p.k * (s.branchExtensions[0] ** 2 + s.branchExtensions[1] ** 2), 13);
      expect(s.gravityPotential + s.springPotential).toBeCloseTo(s.potential, 12);
      expect(s.potential).toBeCloseTo(0.5 * model.coordinateStiffness * s.theta ** 2, 13);
      expect(s.totalEnergy).toBeCloseTo(initialEnergy, 12);
    }
    if (regime === 'unstable') expect(initialEnergy).toBeLessThan(0);
  });
});

describe('inverted zero-mass and finite observation handling', () => {
  it('enforces the spring constraint at zero mass and identifies the free zero-torque case', () => {
    for (const k of [0, 8]) {
      const p = parameters({ m: 0, k, theta0Deg: 9, omega0Deg: 12 });
      const model = deriveModel('inverted', p);
      expect(model.massless).toBe(true);
      expect(model.stability).toBe(k === 0 ? 'free' : 'constraint');
      expect(model.inertia).toBe(0);
      expect(model.coordinateStiffness).toBeCloseTo(2 * k * p.l ** 2, 13);
      expect(model.omega).toBe(0);
      expect(model.frequency).toBe(0);
      for (const t of [0, 0.5, 100, Infinity]) {
        const s = sampleModel('inverted', p, t);
        Object.values(s).flat().forEach((value) => expect(Number.isFinite(value)).toBe(true));
        expect(s.theta).toBeCloseTo(k === 0 ? 9 * DEG : 0, 14);
        expect(s.thetaDot).toBe(0);
        expect(s.thetaDDot).toBe(0);
        expect(s.totalEnergy).toBe(0);
        expect(s.residual).toBe(0);
        expect(s.gravityTorque).toBe(0);
        expect(s.springTorque).toBe(0);
      }
    }
  });

  it('keeps every snapshot finite throughout each UI window and restores motion after zero mass', () => {
    const cases = [
      parameters(),
      parameters({ k: critical, omega0Deg: 2 }),
      parameters({ k: 0 }),
      parameters({ k: 0, theta0Deg: 0, omega0Deg: 0 }),
      parameters({ m: Number.MIN_VALUE, k: 100, l: 0.25, omega0Deg: 20 }),
    ];
    for (const p of cases) {
      const model = deriveModel('inverted', p);
      expect(Number.isFinite(model.observationDuration)).toBe(true);
      expect(model.observationDuration).toBeGreaterThanOrEqual(0);
      for (const fraction of [0, 0.1, 0.5, 0.8, 1]) {
        const s = sampleModel('inverted', p, fraction * model.observationDuration!);
        Object.values(s).flat().forEach((value) => expect(Number.isFinite(value)).toBe(true));
        expect(Math.abs(s.theta)).toBeLessThanOrEqual(LIMIT + 1e-12);
      }
      expect(sampleModel('inverted', p, NaN)).toEqual(sampleModel('inverted', p, 0));
    }
    const p = parameters({ m: 0, theta0Deg: 7, omega0Deg: 3 });
    expect(sampleModel('inverted', p, 0).theta).toBe(0);
    const restored = { ...p, m: 2 };
    expect(deriveModel('inverted', restored).stability).toBe('stable');
    expect(sampleModel('inverted', restored, 0).theta).toBeCloseTo(7 * DEG, 14);
    expect(sampleModel('inverted', restored, 0).thetaDot).toBeCloseTo(3 * DEG, 14);
  });
});
