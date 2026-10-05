# Physics model

This simulation follows the two diagrams in Prof. Lee's **ENGR 317 F26 — Lecture Activity: Exam Review**, supplied as `Adobe Scan Oct 4, 2026.pdf`. It uses linear, undamped, single-degree-of-freedom motion and SI units. Demo values are illustrative; the worksheet supplies symbolic parameters.

## Spring–mass pendulum

The rod is massless, its hinge is frictionless, and the spring attaches to the point mass at the **full rod length** `l`. Positive `theta` points to the right from the downward vertical. The horizontal spring is unstretched at the vertical equilibrium. Vertical spring deflection is negligible to first order.

For small angles, `x = l theta`, and `J_O = m l²`. Moments about the hinge give

`m l² thetaDDot + (m g l + k l²) theta = 0`.

The same equation follows from `T = ½ m l² thetaDot²` and `U = ½(m g l + k l²) theta²` in Lagrange's equation. Therefore

`omega_n = sqrt(g/l + k/m)`, `f_n = omega_n/(2 pi)`, `period = 2 pi/omega_n`.

The engine's `x`, `v`, and `a` use the linear coordinate `x=l theta`. A view may draw the rod at `(l sin(theta), l cos(theta))`; these exact drawing coordinates must not replace the engine's linear displacement in its forces or energies. Spring force is `-k x`, spring torque is `-k l² theta`, and gravitational torque is `-m g l theta`. `force` is the **equivalent total linear restoring force** `-(k+mg/l)x`; it includes the gravitational restoring contribution and is distinct from the horizontal spring force.

The initial-angle range is ±12 degrees. A nonzero initial angular rate can increase the resulting amplitude beyond this range; `Model.amplitude` reports the true linear-model amplitude instead of silently modifying the requested initial conditions. Views should identify cases outside small-angle validity. The gravity range starts at 0.1 m/s² so every allowed combination has a finite period, including `k=0`.

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

## Analytical trajectory and interface

For generalized inertia `M`, stiffness `K`, coordinate `q`, and `omega=sqrt(K/M)`, the engine evaluates

`q(t)=q0 cos(omega t)+(qDot0/omega) sin(omega t)`

`qDot(t)=-q0 omega sin(omega t)+qDot0 cos(omega t)`

`qDDot(t)=-omega² q(t)`.

Its amplitude is `hypot(q0,qDot0/omega)`. `q=theta` for the pendulum and `q=x` for the network. Angles and rates are radians internally; `theta0Deg` and `omega0Deg` are converted on input. Views can scrub or resample a trajectory without numerical integration drift. `inertialTerm + restoringTerm` should vanish to floating-point precision; the units are torque for the pendulum and force for the network.

`sanitizeParameters` returns a fresh complete object, substitutes defaults for missing or nonfinite entries, and clamps finite values to safe ranges without rounding. This is also applied at the model boundary. The model never mutates supplied parameters. Invalid time values fall back to the initial state. The clock, graph scales, camera, playback speed, and labels are display state rather than physical parameters.

Tests verify initial conditions, periodicity, energy conservation, finite-difference derivatives, Newton/Lagrange residuals, the pure-pendulum limit, inertia and mass scaling, correct network connectivity, junction force balance, and equality of physical-branch and equivalent-spring energies.
