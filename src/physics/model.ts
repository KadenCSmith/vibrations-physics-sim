/** Undamped models for the ENGR 317 exam-review diagrams. */
export type ProblemId = 'pendulum' | 'network' | 'compound' | 'inverted';
export type PendulumMode = 'linear' | 'trig';
export type InvertedStability = 'stable' | 'neutral' | 'unstable' | 'constraint' | 'free';

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

export interface CompoundStiffness {
  kTop: number;
  kBottom: number;
  kLeft: number;
  kParallel: number;
  kEquivalent: number;
}

export interface CompoundDeformation {
  /** Downward increments at the nodes below 2*k1, k2, and the upper assembly. */
  upperJunction: number;
  lowerJunction: number;
  collector: number;
  /** Seven physical springs: [k1-left, k1-right, k2, k3-left, k3-right, k4, k5]. */
  extensions: number[];
  /** Signed restoring forces -ki*extension. Only final k5 acts directly on the mass. */
  forces: number[];
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

/** UI-safe ranges. Zero mass is a static constraint, handled before dynamical formulas. */
export const PARAMETER_LIMITS: Record<keyof Parameters, ParameterLimit> = {
  m: { min: 0, max: 20, step: 0.1 },
  l: { min: 0.25, max: 3, step: 0.05 },
  k: { min: 0, max: 100, step: 0.5 },
  g: { min: 0.1, max: 20, step: 0.01 },
  k1: { min: 1, max: 200, step: 1 },
  k2: { min: 1, max: 200, step: 1 },
  k3: { min: 1, max: 200, step: 1 },
  k4: { min: 1, max: 200, step: 1 },
  k5: { min: 1, max: 200, step: 1 },
  theta0Deg: { min: -60, max: 60, step: 0.5 },
  x0: { min: -0.25, max: 0.25, step: 0.01 },
  v0: { min: -0.5, max: 0.5, step: 0.01 },
  omega0Deg: { min: -20, max: 20, step: 0.5 },
};

export interface Model {
  problem: ProblemId;
  /** Zero inertia produces a static constraint, not a zero-inertia oscillator. */
  massless: boolean;
  /** Small-angle natural angular frequency; not 2*pi/period in finite-angle mode. */
  omega: number;
  /** Actual cycle frequency in trig mode; ordinary natural frequency otherwise. */
  frequency: number;
  /** Actual cycle period in trig mode. Infinity denotes a separatrix without a cycle. */
  period: number;
  /** ml² for theta, or m for x. */
  inertia: number;
  /** Generalized stiffness: N m/rad for theta, N/m for x. */
  coordinateStiffness: number;
  /** Small-angle equivalent linear stiffness, or network stiffness. */
  linearStiffness: number;
  k45: number;
  initialCoordinate: number;
  initialRate: number;
  /** Turning amplitude; for nonperiodic inverted motion, max |theta| in the observation window. */
  amplitude: number;
  xAmplitude: number;
  /** The inverted bar's stiffness classification, including the two zero-mass cases. */
  stability?: InvertedStability;
  /** Exponential rate for an unstable inverted bar; zero in its other regimes. */
  growthRate?: number;
  /** First 12-degree boundary time; Infinity means the sampled motion remains within it. */
  smallAngleEndTime?: number;
  /** Finite plotting/playback window for the inverted bar, never beyond its angle boundary. */
  observationDuration?: number;
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
  /** Net m*a in trig pendulum; inverted top-equivalent torque/L=(m/3)*a; restoring force otherwise. */
  force: number;
  /** Actual horizontal pendulum spring force, or total restoring force on the spring-network mass. */
  springForce: number;
  gravityTorque: number;
  springTorque: number;
  kinetic: number;
  potential: number;
  gravityPotential: number;
  springPotential: number;
  totalEnergy: number;
  /** EOM terms: inertia*qDDot and the mode's full generalized restoring term. */
  inertialTerm: number;
  restoringTerm: number;
  residual: number;
  /** Network's massless k4/k5 junction displacement, positive downward. */
  seriesJunction: number;
  /** Network: k1...k5; compound: seven springs; inverted: two local axial elongations [x,-x]. */
  branchExtensions: number[];
  /** Inverted axial signs [-kx,+kx] do not sum to its top force; network series entries repeat one force. */
  branchForces: number[];
}

const DEG_TO_RAD = Math.PI / 180;
const SMALL_ANGLE_LIMIT = 12 * DEG_TO_RAD;

/**
 * Missing/nonfinite entries use defaults. Values are clamped, never rounded.
 * Exactly zero mass is supported; positive mass starts at the slider's 0.1 kg step.
 */
export function sanitizeParameters(input: Partial<Parameters>, mode: PendulumMode = 'linear'): Parameters {
  const result = { ...DEFAULT_PARAMETERS };
  for (const key of Object.keys(PARAMETER_LIMITS) as (keyof Parameters)[]) {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const { min, max } = key === 'theta0Deg' && mode === 'linear'
      ? { min: -12, max: 12 }
      : PARAMETER_LIMITS[key];
    const supportedMin = key === 'm' && value > 0 ? PARAMETER_LIMITS.m.step : min;
    result[key] = Math.min(max, Math.max(supportedMin, value));
  }
  return result;
}

/** Reduce (2*k1, k2, 2*k3) in series, parallel k4, then series final k5. */
export function deriveCompoundStiffness(parameters: Parameters): CompoundStiffness {
  const p = sanitizeParameters(parameters);
  const kTop = 2 * p.k1;
  const kBottom = 2 * p.k3;
  const kLeft = 1 / (1 / kTop + 1 / p.k2 + 1 / kBottom);
  const kParallel = kLeft + p.k4;
  const kEquivalent = (kParallel * p.k5) / (kParallel + p.k5);
  return { kTop, kBottom, kLeft, kParallel, kEquivalent };
}

/** All coordinates are downward increments from the loaded static equilibrium. */
export function compoundDeformation(parameters: Parameters, x: number): CompoundDeformation {
  const p = sanitizeParameters(parameters);
  const { kTop, kLeft, kParallel, kEquivalent } = deriveCompoundStiffness(p);
  const displacement = Number.isFinite(x) ? x : 0;
  const collector = (kEquivalent * displacement) / kParallel;
  const leftForce = kLeft * collector;
  const upperJunction = leftForce / kTop;
  const lowerJunction = upperJunction + leftForce / p.k2;
  const extensions = [
    upperJunction,
    upperJunction,
    lowerJunction - upperJunction,
    collector - lowerJunction,
    collector - lowerJunction,
    collector,
    displacement - collector,
  ];
  const stiffnesses = [p.k1, p.k1, p.k2, p.k3, p.k3, p.k4, p.k5];
  const forces = extensions.map((extension, i) => extension === 0 ? 0 : -stiffnesses[i] * extension);
  return { upperJunction, lowerJunction, collector, extensions, forces };
}

type InvertedMotion = { q: number; rate: number; acceleration: number };

function invertedMotion(model: Model, time: number): InvertedMotion {
  const q0 = model.initialCoordinate;
  const rate0 = model.initialRate;
  if (model.stability === 'neutral') return { q: q0 + rate0 * time, rate: rate0, acceleration: 0 };
  if (model.stability === 'unstable') {
    const growth = model.growthRate!;
    // Equivalent to q0*cosh(rt)+(rate0/r)*sinh(rt), without cancellation on a decaying branch.
    const growing = 0.5 * (q0 + rate0 / growth);
    const decaying = 0.5 * (q0 - rate0 / growth);
    const forward = growing === 0 ? 0 : growing * Math.exp(growth * time);
    const backward = decaying === 0 ? 0 : decaying * Math.exp(-growth * time);
    const q = forward + backward;
    return { q, rate: growth * (forward - backward), acceleration: growth ** 2 * q };
  }
  const cosine = Math.cos(model.omega * time);
  const sine = Math.sin(model.omega * time);
  const q = q0 * cosine + (rate0 / model.omega) * sine;
  return {
    q,
    rate: -q0 * model.omega * sine + rate0 * cosine,
    acceleration: -(model.omega ** 2) * q,
  };
}

/** First contact with either small-angle boundary, without clipping or changing the response. */
function invertedBoundaryTime(model: Model): number {
  const q0 = model.initialCoordinate;
  const rate0 = model.initialRate;
  if (Math.abs(q0) >= SMALL_ANGLE_LIMIT) return 0;
  if (model.stability === 'neutral') {
    return rate0 === 0 ? Infinity : (Math.sign(rate0) * SMALL_ANGLE_LIMIT - q0) / rate0;
  }
  if (model.stability === 'unstable') {
    const growth = model.growthRate!;
    // q=A*exp(rt)+B*exp(-rt). With A=0 the response decays toward upright equilibrium.
    const growing = 0.5 * (q0 + rate0 / growth);
    const decaying = 0.5 * (q0 - rate0 / growth);
    if (growing === 0) return Infinity;
    const sign = Math.sign(growing);
    const a = sign * growing;
    const b = sign * decaying;
    const discriminant = Math.max(0, SMALL_ANGLE_LIMIT ** 2 - 4 * a * b);
    const exponential = (SMALL_ANGLE_LIMIT + Math.sqrt(discriminant)) / (2 * a);
    return Math.max(0, Math.log(exponential) / growth);
  }
  const amplitude = Math.hypot(q0, rate0 / model.omega);
  if (amplitude < SMALL_ANGLE_LIMIT) return Infinity;
  const phase = Math.atan2(rate0 / model.omega, q0);
  const alpha = Math.acos(Math.min(1, SMALL_ANGLE_LIMIT / amplitude));
  const cycle = 2 * Math.PI;
  const phases = [alpha, -alpha, Math.PI + alpha, Math.PI - alpha];
  return Math.min(...phases.map((target) => ((phase + target) % cycle + cycle) % cycle / model.omega));
}

/** Uniform upright bar, pivoted at its bottom, with two k springs at its full height. */
function deriveInvertedModel(p: Parameters): Model {
  const inertia = p.m * p.l ** 2 / 3;
  const springStiffness = 2 * p.k * p.l ** 2;
  const gravityStiffness = p.m * p.g * p.l / 2;
  const rawStiffness = springStiffness - gravityStiffness;
  // Recognize an exactly neutral parameter ratio despite multiplication roundoff.
  const tolerance = 16 * Number.EPSILON * Math.max(springStiffness, gravityStiffness);
  const coordinateStiffness = Math.abs(rawStiffness) <= tolerance ? 0 : rawStiffness;
  const stability: InvertedStability = coordinateStiffness > 0 ? 'stable' : coordinateStiffness < 0 ? 'unstable' : 'neutral';
  const omega = stability === 'stable' ? Math.sqrt(coordinateStiffness / inertia) : 0;
  const growthRate = stability === 'unstable' ? Math.sqrt(-coordinateStiffness / inertia) : 0;
  const model: Model = {
    problem: 'inverted', massless: false, stability, growthRate,
    omega, frequency: omega / (2 * Math.PI), period: omega > 0 ? 2 * Math.PI / omega : Infinity,
    inertia, coordinateStiffness, linearStiffness: coordinateStiffness / p.l ** 2, k45: 0,
    initialCoordinate: p.theta0Deg * DEG_TO_RAD, initialRate: p.omega0Deg * DEG_TO_RAD,
    amplitude: 0, xAmplitude: 0,
  };
  model.smallAngleEndTime = invertedBoundaryTime(model);
  model.observationDuration = Math.min(stability === 'stable' ? 4 * model.period : 8, model.smallAngleEndTime);
  model.amplitude = stability === 'stable'
    ? Math.hypot(model.initialCoordinate, model.initialRate / omega)
    : Math.max(Math.abs(model.initialCoordinate), Math.abs(invertedMotion(model, model.observationDuration).q));
  model.xAmplitude = p.l * model.amplitude;
  return model;
}

function sampleInvertedModel(p: Parameters, time: number): Snapshot {
  const model = deriveInvertedModel(p);
  const t = Number.isFinite(time) ? time : 0;
  const { q: theta, rate: thetaDot, acceleration: thetaDDot } = invertedMotion(model, t);
  const x = p.l * theta;
  const v = p.l * thetaDot;
  const a = p.l * thetaDDot;
  const kinetic = 0.5 * model.inertia * thetaDot ** 2;
  const gravityPotential = -p.m * p.g * p.l * theta ** 2 / 4;
  const springPotential = p.k * p.l ** 2 * theta ** 2;
  const potential = 0.5 * model.coordinateStiffness * theta ** 2;
  const inertialTerm = model.inertia * thetaDDot;
  const restoringTerm = model.coordinateStiffness * theta;
  return {
    time: t, q: theta, qDot: thetaDot, qDDot: thetaDDot,
    x, v, a, theta, thetaDot, thetaDDot,
    force: -model.linearStiffness * x, springForce: -2 * p.k * x,
    gravityTorque: p.m * p.g * p.l * theta / 2, springTorque: -2 * p.k * p.l ** 2 * theta,
    kinetic, potential, gravityPotential, springPotential, totalEnergy: kinetic + potential,
    inertialTerm, restoringTerm, residual: inertialTerm + restoringTerm, seriesJunction: 0,
    branchExtensions: [x, -x], branchForces: [-p.k * x, p.k * x],
  };
}

function deriveSanitizedModel(problem: ProblemId, p: Parameters): Model {
  const k45 = problem === 'compound' ? 0 : (p.k4 * p.k5) / (p.k4 + p.k5);
  const isPendulum = problem === 'pendulum';
  const inertia = isPendulum ? p.m * p.l ** 2 : p.m;
  const coordinateStiffness = isPendulum
    ? p.m * p.g * p.l + p.k * p.l ** 2
    : problem === 'compound'
      ? deriveCompoundStiffness(p).kEquivalent
      : p.k1 + p.k2 + p.k3 + k45;
  const linearStiffness = isPendulum ? p.k + (p.m * p.g) / p.l : coordinateStiffness;
  const omega = Math.sqrt(coordinateStiffness / inertia);
  const initialCoordinate = isPendulum ? p.theta0Deg * DEG_TO_RAD : p.x0;
  const initialRate = isPendulum ? p.omega0Deg * DEG_TO_RAD : p.v0;
  const amplitude = Math.hypot(initialCoordinate, initialRate / omega);
  return {
    problem,
    massless: false,
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

export function deriveModel(problem: ProblemId, parameters: Parameters, mode: PendulumMode = 'linear'): Model {
  const p = sanitizeParameters(parameters, problem === 'inverted' ? 'linear' : mode);
  if (p.m === 0) return deriveMasslessModel(problem, p);
  if (problem === 'inverted') return deriveInvertedModel(p);
  return problem === 'pendulum' && mode === 'trig'
    ? getTrigTrajectory(p).model
    : deriveSanitizedModel(problem, p);
}

/**
 * Evaluate one deterministic trajectory at the requested time.
 * Linear mode uses the analytical response and x=l*theta.
 * Trig mode uses the cached numerical cycle and x=l*sin(theta).
 */
export function sampleModel(problem: ProblemId, parameters: Parameters, time: number, mode: PendulumMode = 'linear'): Snapshot {
  const p = sanitizeParameters(parameters, problem === 'inverted' ? 'linear' : mode);
  if (p.m === 0) return sampleMasslessModel(problem, p, time, mode);
  if (problem === 'inverted') return sampleInvertedModel(p, time);
  if (problem === 'pendulum' && mode === 'trig') return sampleTrigPendulum(p, time);
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
  const seriesJunction = problem === 'network' ? (p.k4 / (p.k4 + p.k5)) * x : 0;
  const seriesForce = -model.k45 * x;
  const compound = problem === 'compound' ? compoundDeformation(p, x) : undefined;

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
    branchExtensions: compound?.extensions
      ?? (isPendulum ? [x] : [x, x, -x, seriesJunction - x, -seriesJunction]),
    // k4 and k5 are one load path. Do not sum both entries for force on the mass.
    branchForces: compound?.forces
      ?? (isPendulum ? [-p.k * x] : [-p.k1 * x, -p.k2 * x, -p.k3 * x, seriesForce, seriesForce]),
  };
}

function deriveMasslessModel(problem: ProblemId, p: Parameters): Model {
  const k45 = problem === 'compound' || problem === 'inverted' ? 0 : (p.k4 * p.k5) / (p.k4 + p.k5);
  const isPendulum = problem === 'pendulum';
  const isInverted = problem === 'inverted';
  const coordinateStiffness = isPendulum
    ? p.k * p.l ** 2
    : isInverted ? 2 * p.k * p.l ** 2
      : problem === 'compound'
        ? deriveCompoundStiffness(p).kEquivalent
        : p.k1 + p.k2 + p.k3 + k45;
  // With no mass and no pendulum spring, 0=0 leaves position/evolution undetermined.
  // The view holds the chosen angle, while reporting the indeterminate dynamics.
  const initialCoordinate = (isPendulum || isInverted) && p.k === 0 ? p.theta0Deg * DEG_TO_RAD : 0;
  return {
    problem,
    massless: true,
    omega: 0,
    frequency: 0,
    period: 0,
    inertia: 0,
    coordinateStiffness,
    linearStiffness: isPendulum ? p.k : isInverted ? 2 * p.k : coordinateStiffness,
    k45,
    initialCoordinate,
    initialRate: 0,
    amplitude: 0,
    xAmplitude: 0,
    ...(isInverted ? {
      stability: p.k > 0 ? 'constraint' as const : 'free' as const,
      growthRate: 0, smallAngleEndTime: Infinity, observationDuration: 1,
    } : {}),
  };
}

function sampleMasslessModel(problem: ProblemId, p: Parameters, time: number, mode: PendulumMode): Snapshot {
  const model = deriveMasslessModel(problem, p);
  const isAngular = problem === 'pendulum' || problem === 'inverted';
  const theta = isAngular ? model.initialCoordinate : 0;
  const x = isAngular ? p.l * (problem === 'pendulum' && mode === 'trig' ? Math.sin(theta) : theta) : 0;
  return {
    time: Number.isFinite(time) ? time : 0,
    q: model.initialCoordinate,
    qDot: 0,
    // Zero placeholders keep rendering finite; zero inertia does not determine acceleration.
    qDDot: 0,
    x,
    v: 0,
    a: 0,
    theta,
    thetaDot: 0,
    thetaDDot: 0,
    force: 0,
    springForce: 0,
    gravityTorque: 0,
    springTorque: 0,
    kinetic: 0,
    potential: 0,
    gravityPotential: 0,
    springPotential: 0,
    totalEnergy: 0,
    inertialTerm: 0,
    restoringTerm: 0,
    residual: 0,
    seriesJunction: 0,
    branchExtensions: problem === 'pendulum' ? [x] : problem === 'inverted' ? [x, -x] : Array(problem === 'compound' ? 7 : 5).fill(0),
    branchForces: problem === 'pendulum' ? [0] : Array(problem === 'compound' ? 7 : problem === 'inverted' ? 2 : 5).fill(0),
  };
}

type TrigTrajectory = {
  key: string;
  model: Model;
  states: Float64Array;
  steps: number;
  dt: number;
  angularAdvance: number;
};

// Only the most recent physical pendulum is retained: no growing parameter cache.
let cachedTrigTrajectory: TrigTrajectory | undefined;

function trigAcceleration(p: Parameters, theta: number): number {
  const sine = Math.sin(theta);
  return -(p.g / p.l) * sine - (p.k / p.m) * sine * Math.cos(theta);
}

/** Potential per unit rotational inertia; half-angle form avoids cancellation. */
function trigPotential(p: Parameters, theta: number): number {
  return 2 * (p.g / p.l) * Math.sin(theta / 2) ** 2
    + 0.5 * (p.k / p.m) * Math.sin(theta) ** 2;
}

/** Fixed-step fourth-order Runge–Kutta, independent of rendering frame times. */
function trigStep(p: Parameters, theta: number, rate: number, dt: number): [number, number] {
  const a1 = trigAcceleration(p, theta);
  const v2 = rate + 0.5 * dt * a1;
  const a2 = trigAcceleration(p, theta + 0.5 * dt * rate);
  const v3 = rate + 0.5 * dt * a2;
  const a3 = trigAcceleration(p, theta + 0.5 * dt * v2);
  const v4 = rate + dt * a3;
  const a4 = trigAcceleration(p, theta + dt * v3);
  return [
    theta + (dt / 6) * (rate + 2 * v2 + 2 * v3 + v4),
    rate + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
  ];
}

function integrateSmooth(fn: (value: number) => number, start: number, end: number, tolerance: number): number {
  const middle = (start + end) / 2;
  const fa = fn(start);
  const fm = fn(middle);
  const fb = fn(end);
  const whole = ((end - start) / 6) * (fa + 4 * fm + fb);
  function refine(a: number, b: number, leftValue: number, midValue: number, rightValue: number,
    estimate: number, tol: number, depth: number): number {
    const mid = (a + b) / 2;
    const fl = fn((a + mid) / 2);
    const fr = fn((mid + b) / 2);
    const left = ((mid - a) / 6) * (leftValue + 4 * fl + midValue);
    const right = ((b - mid) / 6) * (midValue + 4 * fr + rightValue);
    const delta = left + right - estimate;
    if (depth <= 0 || Math.abs(delta) <= 15 * tol) return left + right + delta / 15;
    return refine(a, mid, leftValue, fl, midValue, left, tol / 2, depth - 1)
      + refine(mid, b, midValue, fr, rightValue, right, tol / 2, depth - 1);
  }
  return refine(start, end, fa, fm, fb, whole, tolerance, 20);
}

function getTrigTrajectory(p: Parameters): TrigTrajectory {
  const key = [p.m, p.l, p.k, p.g, p.theta0Deg, p.omega0Deg].join('|');
  if (cachedTrigTrajectory?.key === key) return cachedTrigTrajectory;

  const base = deriveSanitizedModel('pendulum', p);
  const theta0 = base.initialCoordinate;
  const rate0 = base.initialRate;
  const gravity = p.g / p.l;
  const spring = p.k / p.m;
  const energy = 0.5 * rate0 ** 2 + trigPotential(p, theta0);
  const barrierAngle = spring > gravity ? Math.acos(-gravity / spring) : Math.PI;
  const barrierEnergy = trigPotential(p, barrierAngle);
  let amplitude: number;
  let period: number;
  let angularAdvance = 0;

  if (energy === 0) {
    amplitude = 0;
    period = base.period;
  } else if (energy < barrierEnergy) {
    // E=2u²(a+b-bu²), u=sin(A/2). The rationalized root is stable at A→0.
    const discriminant = Math.max(0, (gravity + spring) ** 2 - 2 * spring * energy);
    const uSquared = energy / (gravity + spring + Math.sqrt(discriminant));
    amplitude = rate0 === 0 ? Math.abs(theta0) : 2 * Math.asin(Math.sqrt(Math.min(1, uSquared)));
    const u2 = Math.sin(amplitude / 2) ** 2;
    // sin(theta/2)=sin(A/2) sin(phi) removes the turning-point singularity.
    const integrand = (phi: number) => {
      const sinSquared = Math.sin(phi) ** 2;
      return 1 / Math.sqrt((1 - u2 * sinSquared)
        * (gravity + spring * (1 - u2 * (1 + sinSquared))));
    };
    period = 4 * integrateSmooth(integrand, 0, Math.PI / 2, 1e-11 / base.omega);
  } else if (energy > barrierEnergy) {
    // Nonzero-rate callers can rotate even though the UI releases from rest.
    amplitude = Infinity;
    period = integrateSmooth((theta) => 1 / Math.sqrt(2 * (energy - trigPotential(p, theta))),
      0, 2 * Math.PI, 1e-11 / base.omega);
    angularAdvance = Math.sign(rate0) * 2 * Math.PI;
  } else {
    // The exact separatrix approaches an unstable equilibrium without a cycle.
    amplitude = barrierAngle;
    period = Infinity;
  }

  const model: Model = {
    ...base,
    // omega remains the small-angle reference; frequency/period are the actual cycle.
    period,
    frequency: 1 / period,
    amplitude,
    xAmplitude: amplitude >= Math.PI / 2 ? p.l : p.l * Math.sin(amplitude),
  };
  const steps = Number.isFinite(period)
    ? energy === 0 ? 1 : Math.min(65_536, Math.max(2_048,
      Math.ceil(period * Math.max(base.omega, Math.abs(rate0)) / 0.001)))
    : 0;
  const dt = Number.isFinite(period) ? period / steps : 0.001 / Math.max(base.omega, Math.abs(rate0));
  const states = new Float64Array(2 * (steps + 1));
  states[0] = theta0;
  states[1] = rate0;
  for (let i = 1; i <= steps; i++) {
    const [theta, rate] = trigStep(p, states[2 * (i - 1)], states[2 * (i - 1) + 1], dt);
    states[2 * i] = theta;
    states[2 * i + 1] = rate;
  }
  if (steps > 0) {
    // Quadrature supplies the period. Close its negligibly drifted endpoint exactly.
    states[2 * steps] = theta0 + angularAdvance;
    states[2 * steps + 1] = rate0;
  }
  cachedTrigTrajectory = { key, model, states, steps, dt, angularAdvance };
  return cachedTrigTrajectory;
}

function trigStateAt(p: Parameters, trajectory: TrigTrajectory, time: number): [number, number] {
  const { model, states, steps, dt, angularAdvance } = trajectory;
  if (time === 0) return [model.initialCoordinate, model.initialRate];
  if (steps === 0) {
    // Separatrix only: deterministically integrate from the requested initial state.
    const count = Math.max(1, Math.ceil(Math.abs(time) / dt));
    const step = time / count;
    let theta = model.initialCoordinate;
    let rate = model.initialRate;
    for (let i = 0; i < count; i++) [theta, rate] = trigStep(p, theta, rate, step);
    return [theta, rate];
  }
  const cycles = Math.floor(time / model.period);
  const phaseTime = time - cycles * model.period;
  const index = Math.min(steps - 1, Math.floor(phaseTime / dt));
  const fraction = Math.max(0, Math.min(1, (phaseTime - index * dt) / dt));
  const q0 = states[2 * index];
  const r0 = states[2 * index + 1];
  const q1 = states[2 * (index + 1)];
  const r1 = states[2 * (index + 1) + 1];
  // Cubic Hermite interpolation preserves endpoint position and angular velocity.
  const f2 = fraction ** 2;
  const f3 = fraction ** 3;
  const theta = (2 * f3 - 3 * f2 + 1) * q0 + (f3 - 2 * f2 + fraction) * dt * r0
    + (-2 * f3 + 3 * f2) * q1 + (f3 - f2) * dt * r1 + cycles * angularAdvance;
  const rate = ((6 * f2 - 6 * fraction) * q0 + (3 * f2 - 4 * fraction + 1) * dt * r0
    + (-6 * f2 + 6 * fraction) * q1 + (3 * f2 - 2 * fraction) * dt * r1) / dt;
  return [theta, rate];
}

function sampleTrigPendulum(p: Parameters, time: number): Snapshot {
  const trajectory = getTrigTrajectory(p);
  const { model } = trajectory;
  const t = Number.isFinite(time) ? time : 0;
  const [theta, thetaDot] = trigStateAt(p, trajectory, t);
  const sine = Math.sin(theta);
  const cosine = Math.cos(theta);
  const gravityTorque = -p.m * p.g * p.l * sine;
  const springTorque = -p.k * p.l ** 2 * sine * cosine;
  const thetaDDot = (gravityTorque + springTorque) / model.inertia;
  const x = p.l * sine;
  const v = p.l * cosine * thetaDot;
  const a = p.l * (cosine * thetaDDot - sine * thetaDot ** 2);
  const kinetic = 0.5 * model.inertia * thetaDot ** 2;
  const gravityPotential = 2 * p.m * p.g * p.l * Math.sin(theta / 2) ** 2;
  const springPotential = 0.5 * p.k * x ** 2;
  const inertialTerm = model.inertia * thetaDDot;
  const restoringTerm = -gravityTorque - springTorque;
  return {
    time: t, q: theta, qDot: thetaDot, qDDot: thetaDDot,
    x, v, a, theta, thetaDot, thetaDDot,
    force: p.m * a,
    springForce: -p.k * x,
    gravityTorque, springTorque,
    kinetic, gravityPotential, springPotential,
    potential: gravityPotential + springPotential,
    totalEnergy: kinetic + gravityPotential + springPotential,
    inertialTerm, restoringTerm, residual: inertialTerm + restoringTerm,
    seriesJunction: 0,
    branchExtensions: [x],
    branchForces: [-p.k * x],
  };
}
