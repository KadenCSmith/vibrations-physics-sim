/** Linear, undamped models for the two ENGR 317 exam-review diagrams. */
export type ProblemId = 'pendulum' | 'network';

/** Physical quantities use SI units; the two named angle inputs use degrees. */
export interface Parameters {
  m: number;
  l: number;
  k: number;
  g: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  theta0Deg: number;
  x0: number;
  v0: number;
  omega0Deg: number;
}

export interface ParameterLimit {
  min: number;
  max: number;
  step: number;
}

export const DEFAULT_PARAMETERS: Parameters = {
  m: 2,
  l: 1.2,
  k: 8,
  g: 9.81,
  k1: 24,
  k2: 36,
  k3: 30,
  k4: 45,
  k5: 60,
  theta0Deg: 8,
  x0: 0.12,
  v0: 0,
  omega0Deg: 0,
};

/** UI-safe ranges. Positive gravity keeps the pendulum's period finite at k=0. */
export const PARAMETER_LIMITS: Record<keyof Parameters, ParameterLimit> = {
  m: { min: 0.2, max: 20, step: 0.1 },
  l: { min: 0.25, max: 3, step: 0.05 },
  k: { min: 0, max: 100, step: 0.5 },
  g: { min: 0.1, max: 20, step: 0.01 },
  k1: { min: 1, max: 200, step: 1 },
  k2: { min: 1, max: 200, step: 1 },
  k3: { min: 1, max: 200, step: 1 },
  k4: { min: 1, max: 200, step: 1 },
  k5: { min: 1, max: 200, step: 1 },
  theta0Deg: { min: -12, max: 12, step: 0.5 },
  x0: { min: -0.25, max: 0.25, step: 0.01 },
  v0: { min: -0.5, max: 0.5, step: 0.01 },
  omega0Deg: { min: -20, max: 20, step: 0.5 },
};

export interface Model {
  problem: ProblemId;
  omega: number;
  frequency: number;
  period: number;
  /** ml² for theta, or m for x. */
  inertia: number;
  /** Generalized stiffness: N m/rad for theta, N/m for x. */
  coordinateStiffness: number;
  /** Stiffness for linear displacement x=l theta (pendulum), or x (network). */
  linearStiffness: number;
  k45: number;
  initialCoordinate: number;
  initialRate: number;
  /** Amplitude of the generalized coordinate, including its initial rate. */
  amplitude: number;
  xAmplitude: number;
}

export interface Snapshot {
  time: number;
  q: number;
  qDot: number;
  qDDot: number;
  x: number;
  v: number;
  a: number;
  theta: number;
  thetaDot: number;
  thetaDDot: number;
  /** Total equivalent linear restoring force, -linearStiffness*x. */
  force: number;
  /** Actual horizontal spring force for the pendulum; all branches for network. */
  springForce: number;
  gravityTorque: number;
  springTorque: number;
  kinetic: number;
  potential: number;
  gravityPotential: number;
  springPotential: number;
  totalEnergy: number;
  /** The two left-hand terms of inertia*qDDot + stiffness*q = 0. */
  inertialTerm: number;
  restoringTerm: number;
  residual: number;
  /** Network's massless k4/k5 junction displacement, positive downward. */
  seriesJunction: number;
  /** Signed elongations, relative to static equilibrium, in k1...k5 order. */
  branchExtensions: number[];
  /** Restoring forces, in k1...k5 order. k4/k5 report the same series force. */
  branchForces: number[];
}

const DEG_TO_RAD = Math.PI / 180;

/** Missing/nonfinite entries use defaults. Values are clamped, never rounded. */
export function sanitizeParameters(input: Partial<Parameters>): Parameters {
  const result = { ...DEFAULT_PARAMETERS };
  for (const key of Object.keys(PARAMETER_LIMITS) as (keyof Parameters)[]) {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const { min, max } = PARAMETER_LIMITS[key];
    result[key] = Math.min(max, Math.max(min, value));
  }
  return result;
}

function deriveSanitizedModel(problem: ProblemId, p: Parameters): Model {
  const k45 = (p.k4 * p.k5) / (p.k4 + p.k5);
  const isPendulum = problem === 'pendulum';
  const inertia = isPendulum ? p.m * p.l ** 2 : p.m;
  const coordinateStiffness = isPendulum
    ? p.m * p.g * p.l + p.k * p.l ** 2
    : p.k1 + p.k2 + p.k3 + k45;
  const linearStiffness = isPendulum ? p.k + (p.m * p.g) / p.l : coordinateStiffness;
  const omega = Math.sqrt(coordinateStiffness / inertia);
  const initialCoordinate = isPendulum ? p.theta0Deg * DEG_TO_RAD : p.x0;
  const initialRate = isPendulum ? p.omega0Deg * DEG_TO_RAD : p.v0;
  const amplitude = Math.hypot(initialCoordinate, initialRate / omega);
  return {
    problem,
    omega,
    frequency: omega / (2 * Math.PI),
    period: (2 * Math.PI) / omega,
    inertia,
    coordinateStiffness,
    linearStiffness,
    k45,
    initialCoordinate,
    initialRate,
    amplitude,
    xAmplitude: amplitude * (isPendulum ? p.l : 1),
  };
}

export function deriveModel(problem: ProblemId, parameters: Parameters): Model {
  return deriveSanitizedModel(problem, sanitizeParameters(parameters));
}

/**
 * Evaluate the same analytical trajectory at any time, without integration drift.
 * Pendulum x=l*theta is the linear coordinate, not the drawing's l*sin(theta).
 */
export function sampleModel(problem: ProblemId, parameters: Parameters, time: number): Snapshot {
  const p = sanitizeParameters(parameters);
  const model = deriveSanitizedModel(problem, p);
  const t = Number.isFinite(time) ? time : 0;
  const phase = model.omega * t;
  const cosine = Math.cos(phase);
  const sine = Math.sin(phase);
  const q = model.initialCoordinate * cosine + (model.initialRate / model.omega) * sine;
  const qDot = -model.initialCoordinate * model.omega * sine + model.initialRate * cosine;
  const qDDot = -(model.omega ** 2) * q;
  const isPendulum = problem === 'pendulum';
  const lengthFactor = isPendulum ? p.l : 1;
  const x = lengthFactor * q;
  const v = lengthFactor * qDot;
  const a = lengthFactor * qDDot;
  const kinetic = 0.5 * model.inertia * qDot ** 2;
  const gravityPotential = isPendulum ? 0.5 * p.m * p.g * p.l * q ** 2 : 0;
  const springPotential = 0.5 * (isPendulum ? p.k : model.linearStiffness) * x ** 2;
  const potential = gravityPotential + springPotential;
  const force = -model.linearStiffness * x;
  const inertialTerm = model.inertia * qDDot;
  const restoringTerm = model.coordinateStiffness * q;
  const seriesJunction = isPendulum ? 0 : (p.k4 / (p.k4 + p.k5)) * x;
  const seriesForce = -model.k45 * x;

  return {
    time: t,
    q,
    qDot,
    qDDot,
    x,
    v,
    a,
    theta: isPendulum ? q : 0,
    thetaDot: isPendulum ? qDot : 0,
    thetaDDot: isPendulum ? qDDot : 0,
    force,
    springForce: isPendulum ? -p.k * x : force,
    gravityTorque: isPendulum ? -p.m * p.g * p.l * q : 0,
    springTorque: isPendulum ? -p.k * p.l ** 2 * q : 0,
    kinetic,
    potential,
    gravityPotential,
    springPotential,
    totalEnergy: kinetic + potential,
    inertialTerm,
    restoringTerm,
    residual: inertialTerm + restoringTerm,
    seriesJunction,
    branchExtensions: isPendulum ? [x] : [x, x, -x, seriesJunction - x, -seriesJunction],
    // k4 and k5 are one load path. Do not sum both entries for force on the mass.
    branchForces: isPendulum
      ? [-p.k * x]
      : [-p.k1 * x, -p.k2 * x, -p.k3 * x, seriesForce, seriesForce],
  };
}
