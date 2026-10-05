import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMETERS,
  compoundDeformation,
  deriveCompoundStiffness,
  deriveModel,
  sampleModel,
  type Parameters,
} from '../src/physics/model';

const parameters = (changes: Partial<Parameters> = {}): Parameters => ({ ...DEFAULT_PARAMETERS, ...changes });
const unequal = parameters({ m: 3, k1: 10, k2: 30, k3: 20, k4: 60, k5: 90 });

describe('seven-spring compound reduction', () => {
  it('reduces the two parallel pairs, their series path, the parallel branch, then final series spring', () => {
    const reduced = deriveCompoundStiffness(unequal);
    expect(reduced.kTop).toBe(20);
    expect(reduced.kBottom).toBe(40);
    expect(reduced.kLeft).toBeCloseTo(120 / 13, 12);
    expect(reduced.kParallel).toBeCloseTo(900 / 13, 12);
    expect(reduced.kEquivalent).toBeCloseTo(900 / 23, 12);
    const model = deriveModel('compound', unequal);
    expect(model.linearStiffness).toBeCloseTo(900 / 23, 12);
    expect(model.coordinateStiffness).toBe(model.linearStiffness);
    expect(model.k45).toBe(0);
  });

  it('gives 0.6k for seven identical physical springs and stays distinct from the five-spring network', () => {
    const p = parameters({ k1: 20, k2: 20, k3: 20, k4: 20, k5: 20 });
    expect(deriveCompoundStiffness(p)).toEqual({ kTop: 40, kBottom: 40, kLeft: 10, kParallel: 30, kEquivalent: 12 });
    expect(deriveModel('compound', p).linearStiffness).toBe(12);
    expect(deriveModel('network', p).linearStiffness).toBe(70);
  });

  it('satisfies every massless-node force balance with the seven actual spring deformations', () => {
    const d = compoundDeformation(unequal, 0.2);
    const { extensions: e, forces: f } = d;
    expect(e).toHaveLength(7);
    expect(f).toHaveLength(7);
    expect(e.every((extension) => extension > 0)).toBe(true);
    expect(d.upperJunction).toBeLessThan(d.lowerJunction);
    expect(d.lowerJunction).toBeLessThan(d.collector);
    expect(d.collector).toBeLessThan(0.2);
    expect(e[0]).toBe(d.upperJunction);
    expect(e[1]).toBe(e[0]);
    expect(e[2]).toBeCloseTo(d.lowerJunction - d.upperJunction, 14);
    expect(e[3]).toBeCloseTo(d.collector - d.lowerJunction, 14);
    expect(e[4]).toBe(e[3]);
    expect(e[5]).toBe(d.collector);
    expect(e[6]).toBeCloseTo(0.2 - d.collector, 14);
    // Independent balances at A, B, and C; adjacent springs act on opposite node faces.
    expect(unequal.k1 * (e[0] + e[1])).toBeCloseTo(unequal.k2 * e[2], 12);
    expect(unequal.k2 * e[2]).toBeCloseTo(unequal.k3 * (e[3] + e[4]), 12);
    expect(unequal.k3 * (e[3] + e[4]) + unequal.k4 * e[5]).toBeCloseTo(unequal.k5 * e[6], 12);
    expect(f[0] + f[1]).toBeCloseTo(f[2], 12);
    expect(f[2]).toBeCloseTo(f[3] + f[4], 12);
    expect(f[3] + f[4] + f[5]).toBeCloseTo(f[6], 12);
    expect(f[6]).toBeCloseTo(-deriveCompoundStiffness(unequal).kEquivalent * 0.2, 12);
  });

  it('reverses all node and spring displacements and restoring forces when x changes sign', () => {
    const positive = compoundDeformation(unequal, 0.17);
    const negative = compoundDeformation(unequal, -0.17);
    expect(negative.upperJunction).toBe(-positive.upperJunction);
    expect(negative.lowerJunction).toBe(-positive.lowerJunction);
    expect(negative.collector).toBe(-positive.collector);
    negative.extensions.forEach((extension, i) => expect(extension).toBe(-positive.extensions[i]));
    negative.forces.forEach((force, i) => expect(force).toBe(-positive.forces[i]));
  });

  it('matches seven physical spring energies to equivalent energy for unequal stiffnesses', () => {
    const p = parameters({ ...unequal, x0: -0.18, v0: 0.24 });
    const stiffnesses = [p.k1, p.k1, p.k2, p.k3, p.k3, p.k4, p.k5];
    const model = deriveModel('compound', p);
    for (const fraction of [0, 0.13, 0.25, 0.5, 0.77, 1.39]) {
      const s = sampleModel('compound', p, fraction * model.period);
      const physicalEnergy = s.branchExtensions.reduce((sum, extension, i) => sum + 0.5 * stiffnesses[i] * extension ** 2, 0);
      expect(physicalEnergy).toBeCloseTo(0.5 * model.linearStiffness * s.x ** 2, 12);
      expect(physicalEnergy).toBeCloseTo(s.springPotential, 12);
      expect(s.potential).toBe(s.springPotential);
      expect(s.gravityPotential).toBe(0);
      expect(s.gravityTorque).toBe(0);
      expect(s.springTorque).toBe(0);
      // Internal branch forces are not seven independent forces on the mass.
      expect(s.force).toBeCloseTo(s.branchForces[6], 12);
      expect(s.force).toBe(s.springForce);
      expect(s.force).toBeCloseTo(p.m * s.a, 12);
      expect(s.seriesJunction).toBe(0);
    }
  });
});

describe('compound analytical motion', () => {
  it('uses equivalent stiffness for natural frequency and period, with the correct mass scaling', () => {
    const model = deriveModel('compound', unequal);
    const omega = Math.sqrt((900 / 23) / unequal.m);
    expect(model.inertia).toBe(unequal.m);
    expect(model.omega).toBeCloseTo(omega, 12);
    expect(model.frequency).toBeCloseTo(omega / (2 * Math.PI), 12);
    expect(model.period).toBeCloseTo(2 * Math.PI / omega, 12);
    expect(deriveModel('compound', { ...unequal, m: 4 * unequal.m }).period).toBeCloseTo(2 * model.period, 12);
    expect(deriveModel('compound', { ...unequal, g: 0.1 }).omega).toBe(deriveModel('compound', { ...unequal, g: 20 }).omega);
  });

  it('satisfies initial position and rate, all derivatives, and recurrence after a cycle', () => {
    const p = parameters({ ...unequal, x0: 0.08, v0: -0.13 });
    const model = deriveModel('compound', p);
    const start = sampleModel('compound', p, 0);
    const end = sampleModel('compound', p, model.period);
    expect(start.x).toBe(p.x0);
    expect(start.v).toBe(p.v0);
    expect(start.a).toBeCloseTo(-model.linearStiffness * p.x0 / p.m, 12);
    expect(end.x).toBeCloseTo(start.x, 13);
    expect(end.v).toBeCloseTo(start.v, 13);
    expect(model.amplitude).toBeCloseTo(Math.hypot(p.x0, p.v0 / model.omega), 13);
    expect(model.xAmplitude).toBe(model.amplitude);
    const t = 0.43;
    const dt = 1e-5;
    const before = sampleModel('compound', p, t - dt);
    const now = sampleModel('compound', p, t);
    const after = sampleModel('compound', p, t + dt);
    expect((after.x - before.x) / (2 * dt)).toBeCloseTo(now.v, 7);
    expect((after.v - before.v) / (2 * dt)).toBeCloseTo(now.a, 7);
    expect(now.q).toBe(now.x);
    expect(now.qDot).toBe(now.v);
    expect(now.qDDot).toBe(now.a);
    expect(now.theta).toBe(0);
    expect(now.thetaDot).toBe(0);
    expect(now.thetaDDot).toBe(0);
  });

  it('conserves total energy and balances the EOM over many cycles independently of pendulum mode', () => {
    const p = parameters({ ...unequal, x0: -0.16, v0: 0.21 });
    const model = deriveModel('compound', p);
    const energy = 0.5 * model.linearStiffness * p.x0 ** 2 + 0.5 * p.m * p.v0 ** 2;
    for (const fraction of [0, 0.125, 0.25, 0.5, 0.875, 1, 31.71, 10000.37]) {
      const t = fraction * model.period;
      const s = sampleModel('compound', p, t);
      expect(s.totalEnergy).toBeCloseTo(energy, 12);
      expect(s.residual).toBeCloseTo(0, 12);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(model.amplitude + 1e-12);
      expect(sampleModel('compound', p, t, 'trig')).toEqual(s);
    }
  });

  it('holds equilibrium for zero initial conditions and falls back to t=0 for nonfinite time', () => {
    const p = parameters({ x0: 0, v0: 0 });
    const s = sampleModel('compound', p, 123);
    expect(s.x).toBe(0);
    expect(s.v).toBe(0);
    expect(s.totalEnergy).toBe(0);
    expect(s.branchExtensions).toEqual(Array(7).fill(0));
    expect(s.branchForces).toEqual(Array(7).fill(0));
    expect(sampleModel('compound', unequal, Infinity)).toEqual(sampleModel('compound', unequal, 0));
  });
});

describe('compound zero and positive mass boundary', () => {
  it('constrains the zero-mass assembly to loaded equilibrium with seven finite zero-energy springs', () => {
    const p = parameters({ ...unequal, m: 0, x0: 0.25, v0: 0.5 });
    const model = deriveModel('compound', p);
    expect(model.massless).toBe(true);
    expect(model.inertia).toBe(0);
    expect(model.omega).toBe(0);
    expect(model.frequency).toBe(0);
    expect(model.period).toBe(0);
    expect(model.coordinateStiffness).toBeCloseTo(900 / 23, 12);
    for (const time of [0, 0.43, 1e6, Infinity]) {
      const s = sampleModel('compound', p, time);
      Object.values(s).flat().forEach((value) => expect(Number.isFinite(value)).toBe(true));
      expect(s.x).toBe(0);
      expect(s.v).toBe(0);
      expect(s.a).toBe(0);
      expect(s.force).toBe(0);
      expect(s.residual).toBe(0);
      expect(s.totalEnergy).toBe(0);
      expect(s.branchExtensions).toEqual(Array(7).fill(0));
      expect(s.branchForces).toEqual(Array(7).fill(0));
    }
  });

  it('restores the supplied initial state when positive mass returns, including tiny-input normalization', () => {
    const p = parameters({ ...unequal, m: 0, x0: -0.11, v0: 0.19 });
    expect(sampleModel('compound', p, 0).x).toBe(0);
    const restored = { ...p, m: 0.2 };
    expect(deriveModel('compound', restored).massless).toBe(false);
    expect(sampleModel('compound', restored, 0).x).toBe(p.x0);
    expect(sampleModel('compound', restored, 0).v).toBe(p.v0);
    const tiny = { ...p, m: Number.MIN_VALUE };
    expect(deriveModel('compound', tiny)).toEqual(deriveModel('compound', { ...p, m: 0.1 }));
    expect(sampleModel('compound', tiny, 0.37)).toEqual(sampleModel('compound', { ...p, m: 0.1 }, 0.37));
  });
});
