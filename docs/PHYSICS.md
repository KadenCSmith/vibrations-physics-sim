# Physics model

This simulation follows the two diagrams in Prof. Lee's **ENGR 317 F26 — Lecture Activity: Exam Review**, supplied as `Adobe Scan Oct 4, 2026.pdf`. It uses undamped, single-degree-of-freedom motion and SI units. The spring pendulum offers a full-trigonometric mode and the worksheet's small-angle comparison; the spring network remains linear. Demo values are illustrative; the worksheet supplies symbolic parameters.

## Spring–mass pendulum

The rod is massless, its hinge is frictionless, and the spring attaches to the point mass at the **full rod length** `l`. Positive `theta` points to the right from the downward vertical. The horizontal spring is unstretched at the vertical equilibrium. Vertical spring deflection is negligible to first order.

### Full-trigonometric mode

In `PendulumMode='trig'`, the requested torque balance is retained:

`-m g l sin(theta) - k l² sin(theta) cos(theta) = m l² thetaDDot`.

This model retains the idealized horizontal spring force with extension `x=l sin(theta)`. It does not add a diagonal spring-force direction or vertical extension of a spring fixed at the original bob height. The finite-angle equation is exact within that horizontal-force idealization.

The energies use the same equation consistently:

`T = ½ m l² thetaDot²`

`U_g = m g l (1-cos(theta))`

`U_s = ½ k l² sin²(theta)`.

The bob's total speed is `l abs(thetaDot)`. It differs from the horizontal velocity, so `½m v_x²` is not the complete kinetic energy at a finite angle.

The trigonometric snapshot reports the true horizontal coordinate and its chain-rule derivatives:

`x = l sin(theta)`

`v = l cos(theta) thetaDot`

`a = l [cos(theta) thetaDDot - sin(theta) thetaDot²]`.

`springForce=-k x` is the horizontal force from the spring. `force=m a` is the **net horizontal force**, including the rigid rod's constraint reaction. The generalized tangential force `(gravityTorque+springTorque)/l` is a different quantity. `inertialTerm=m l² thetaDDot` and `restoringTerm=mgl sin(theta)+k l² sin(theta)cos(theta)` balance to floating-point precision.

The initial angle can reach ±60 degrees in trig mode. The interface releases from rest, so positive-mass cases remain oscillations around downward equilibrium. The API still honors a requested nonzero angular rate and determines the turning amplitude from total energy.

`Model.omega=sqrt(g/l+k/m)` remains the **small-angle natural-frequency reference**. `Model.period` and `Model.frequency=1/period` report the actual finite-amplitude cycle. The angular cycle frequency is `2pi/Model.period`; it generally differs from `Model.omega` at a finite angle. Changing amplitude can therefore change the true period even though the small-angle reference is unchanged.

For turning amplitude A, define `u=sin(A/2)`, `a=g/l`, and `b=k/m`. Conservation of energy gives the smooth period integral

`period = 4 integral[0,pi/2] 1/sqrt[(1-u² sin²(phi)) (a+b(1-u²(1+sin²(phi))))] dphi`.

The substitution `sin(theta/2)=u sin(phi)` removes the turning-point singularity. Adaptive Simpson quadrature computes this period. A fixed-step fourth-order Runge–Kutta trajectory covers one cycle; cubic Hermite interpolation evaluates intermediate position and angular rate. Playback does not integrate on rendering frames. Scrubbing and plotting evaluate the same cached cycle, and long time values reduce to the same phase. Only the most recent physical-parameter combination is cached, with a bounded cycle table. Its negligible numerical endpoint drift is closed to the energy-derived period.

Nonzero-rate API callers can exceed the potential barrier for sufficiently low gravity. The evaluator detects rotation instead of inventing a bounded amplitude: `Model.amplitude=Infinity`, horizontal amplitude is l, and period is the duration of one full revolution. The angular coordinate advances by ±2pi per cycle, while its horizontal position and angular rate repeat. At the exact barrier energy, the separatrix has no finite cycle (`period=Infinity`, `frequency=0`) and is evaluated from its initial conditions. Neither case occurs for the interface's release-from-rest range.

### Small-angle comparison

For small angles, `x = l theta`, and `J_O = m l²`. Moments about the hinge give

`m l² thetaDDot + (m g l + k l²) theta = 0`.

The same equation follows from `T = ½ m l² thetaDot²` and `U = ½(m g l + k l²) theta²` in Lagrange's equation. Therefore

`omega_n = sqrt(g/l + k/m)`, `f_n = omega_n/(2 pi)`, `period = 2 pi/omega_n`.

The engine's `x`, `v`, and `a` use the linear coordinate `x=l theta`. A view may draw the rod at `(l sin(theta), l cos(theta))`; these exact drawing coordinates must not replace the engine's linear displacement in its forces or energies. Spring force is `-k x`, spring torque is `-k l² theta`, and gravitational torque is `-m g l theta`. `force` is the **equivalent total linear restoring force** `-(k+mg/l)x`; it includes the gravitational restoring contribution and is distinct from the horizontal spring force.

The linear comparison's initial-angle range is ±12 degrees. A nonzero initial angular rate can increase the resulting amplitude beyond this range; `Model.amplitude` reports the true linear-model amplitude instead of silently modifying the requested initial conditions. Views should identify cases outside small-angle validity. The gravity range starts at 0.1 m/s² so every allowed positive-mass linear combination has a finite period, including `k=0`.

## Five-spring network

The mass translates vertically; the ceiling, floor, and all support points stay fixed. `k1` and `k2` independently connect the mass to the ceiling. `k3` independently connects it to the floor. `k4` and `k5` form the **series pair** on the lower right, separated by a massless junction. These labels differ from the earlier Topic 4 practice problem.

`k45 = k4 k5/(k4+k5)`

`k_eq = k1+k2+k3+k45`

`m xDDot + k_eq x = 0`, with `omega_n = sqrt(k_eq/m)`.

Here `x` is downward displacement from **static equilibrium**. Weight and the baseline spring forces cancel; gravity is not omitted from the physical system. Spring deformations, force increments, and oscillation energy are measured relative to that equilibrium. Consequently the engine reports zero separate gravitational potential for this reduced oscillation model, and `U=½k_eq x²` is the effective potential including the equilibrium cancellation.

If the series junction moves down by `y`, its force balance gives

`y = k4/(k4+k5) x`.

Signed spring elongations in `k1...k5` order are

`[x, x, -x, y-x, -y]`.

The top springs lengthen and bottom springs shorten when the mass moves down. The softer series spring deforms more. `branchForces` reports `[-k1*x, -k2*x, -k3*x, -k45*x, -k45*x]`: the last two entries represent the **same series load path**, not two independent forces on the mass. Sum only one of these entries when recovering the total restoring force. All five physical spring energies can be added directly, and equal `½k_eq x²`.

## Compound spring system

The supplied third diagram has seven physical springs and five independent stiffness inputs. Its two identical upper springs form `kTop=2k1`, and its two identical lower springs form `kBottom=2k3`. The entire left path contains these two pairs and the middle spring in series:

`kLeft=1/(1/(2k1)+1/k2+1/(2k3))`.

That path is in parallel with the right spring, `kParallel=kLeft+k4`. The final spring connecting the collector to the mass is in series with that assembly:

`k_eq=kParallel*k5/(kParallel+k5)`.

For displacement `x` positive downward from loaded equilibrium, the collector moves by `z=k_eq*x/kParallel`. The left path's force increment is `FLeft=kLeft*z`. Its upper junction moves by `u=FLeft/(2k1)`, and its lower junction by `v=u+FLeft/k2`. Physical elongations, in the order `[k1-left,k1-right,k2,k3-left,k3-right,k4,k5]`, are `[u,u,v-u,z-v,z-v,z,x-z]`. The massless junctions enforce `2k1*u=k2*(v-u)=2k3*(z-v)` and `FLeft+k4*z=k5*(x-z)`. Only the final k₅ acts directly on the moving mass; internal spring forces must not all be summed as external forces on it.

The equation is `m*xDDot+k_eq*x=0`, with `omega_n=sqrt(k_eq/m)`, `f=omega_n/(2pi)`, and `T=2pi/omega_n`. The seven physical incremental spring energies sum to `½k_eq*x²`. Loaded equilibrium sits `mg/k_eq` below the unloaded mass position. Gravity cancels from the vibration equation after shifting to that equilibrium. Internal junctions and springs are massless; only the attached mass contributes kinetic energy. Equal individual spring stiffnesses `k` produce `kLeft=k/2`, `kParallel=3k/2`, and `k_eq=3k/5`.

## Exactly zero mass

The mass control includes `m=0`. All acceleration formulas obtained by dividing by mass or inertia, all frequency formulas containing `1/m`, and all dynamic trajectories described above require **positive mass**. Exactly zero inertia turns the undivided equation into a force or torque constraint. It is not an infinitely fast oscillator, and no oscillatory frequency or period is assigned to the static branch.

For the network, `k_eq x=0` and `k_eq>0`, so the massless state is `x=0`. For the pendulum with `k>0`, the full equation reduces to `-k l² sin(theta) cos(theta)=0`; within the available ±60-degree range, the stable balanced state is `theta=0`. The linear comparison similarly reduces to `k l² theta=0`. A displaced release is incompatible with these zero-inertia constraints; the static state is an algebraic selection, not a simulated instantaneous transient.

For the pendulum with both `m=0` and `k=0`, the equation becomes `0=0`. It cannot determine acceleration or a unique motion. The view holds the selected angle illustratively with no oscillation. The familiar gravity-only pendulum equation survives the limit `m→0+` after canceling a **nonzero** mass; that cancellation cannot be used at `m=0`.

The engine handles zero mass before any frequency calculation, inertia division, or trigonometric trajectory construction. Every `Model` contains a `massless` flag. All zero-mass snapshots report zero forces, torques, energies, and EOM residual. Their inertias and oscillation amplitudes are zero. In the wholly degenerate pendulum, x follows the held angle using `l theta` in linear mode or `l sin(theta)` in trig mode. Snapshot rates and accelerations are numeric zero placeholders for rendering; the interface identifies the undetermined dynamics.

`Model.omega`, `frequency`, and `period` use numeric zero sentinels for no defined oscillation rhythm, displayed as unavailable by the interface. These are not the positive-mass frequency limit. The clock uses a safe display duration and does not divide by the zero period or animate inertial motion.

## Analytical trajectory and interface

For generalized inertia `M`, stiffness `K`, coordinate `q`, and `omega=sqrt(K/M)`, the engine evaluates

`q(t)=q0 cos(omega t)+(qDot0/omega) sin(omega t)`

`qDot(t)=-q0 omega sin(omega t)+qDot0 cos(omega t)`

`qDDot(t)=-omega² q(t)`.

Its amplitude is `hypot(q0,qDot0/omega)`. `q=theta` for the pendulum and `q=x` for the network. Angles and rates are radians internally; `theta0Deg` and `omega0Deg` are converted on input. Views can scrub or resample a trajectory without numerical integration drift. `inertialTerm + restoringTerm` should vanish to floating-point precision; the units are torque for the pendulum and force for the network.

`sanitizeParameters(input, mode='linear')` returns a fresh complete object, substitutes defaults for missing or nonfinite entries, and clamps finite values to safe ranges without rounding. Its default preserves the ±12-degree linear limit; passing `'trig'` permits ±60 degrees. `deriveModel(problem,parameters,mode='linear')` and `sampleModel(problem,parameters,time,mode='linear')` preserve the earlier API defaults and sanitize at the same mode boundary. The network ignores the pendulum mode. The model never mutates supplied parameters. Invalid time values fall back to the initial state. The clock, graph scales, camera, playback speed, and labels are display state rather than physical parameters.

Tests verify initial conditions, periodicity, energy conservation, finite-difference derivatives, Newton/Lagrange residuals, the pure-pendulum limit, inertia and mass scaling, correct network connectivity, junction force balance, and equality of physical-branch and equivalent-spring energies. Additional trig tests check exact torque and potential, complete versus horizontal kinetic energy, period against an independent arithmetic–geometric-mean result for the simple pendulum, quarter-cycle turning points, finite-amplitude period changes, the small-angle limit, sign symmetry, reproducible cache replacement, long scrubs, and high-energy rotation detection.

Massless tests verify exact zero input, static balance, the wholly degenerate case, finite model/snapshot fields, invalid-time handling, and preservation of positive-mass cached trajectories.
