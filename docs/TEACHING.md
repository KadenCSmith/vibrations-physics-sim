# Teaching notes

The two simulations implement the undamped, linearized problems in Prof. Lee’s ENGR 317 exam review. The numerical defaults are illustrative because the source problems specify symbolic values. Physical inputs use SI units. Degrees appear only at angular input and display boundaries.

## Problem 1: Spring pendulum

A point mass m is carried by a massless rigid rod of length L, rotating about a fixed pivot. A horizontal spring of stiffness k is undeformed at the downward equilibrium. There is no damping. For small angular displacement θ in radians, the spring extension is x ≈ Lθ.

Gravity supplies restoring torque −mgLθ, and the spring supplies restoring torque −kL²θ. The rotational inertia is I = mL². Consequently:

    mL² θ̈ + (mgL + kL²)θ = 0
    ωₙ = √(g/L + k/m)

The Lagrange derivation uses kinetic energy T = ½mL²θ̇² and quadratic potential V = ½(mgL + kL²)θ². The gravitational term comes from expanding mgL(1 − cos θ) to second order. Both derivations lead to the same differential equation.

The animation draws the bob on the circular arc: horizontal location L sin θ and vertical location −L cos θ. The analytical trajectory, spring extension readout, equation substitutions, and energy bars use the small-angle approximation consistently. Showing the drawing with exact geometry does not turn this into a nonlinear pendulum model. The panel makes this distinction explicit.

## Problem 2: Spring network

The mass moves vertically, with x positive downward and measured from the statically loaded equilibrium. Springs k₁ and k₂ connect above the mass, and k₃ connects below it. Springs k₄ and k₅ form a second lower branch in series, with a massless intermediate junction. The signed incremental extensions of the lower series springs add to −x, and the two springs carry the same incremental force.

    k₄₅ = k₄k₅/(k₄ + k₅)
    k_eq = k₁ + k₂ + k₃ + k₄₅
    m ẍ + k_eq x = 0
    ωₙ = √(k_eq/m)

Branches on opposite sides of the mass still contribute positively to equivalent stiffness. Their incremental restoring forces all oppose displacement. Gravity is balanced by the static spring preload at equilibrium. Choosing x from that loaded equilibrium cancels the constant gravity term, so it does not appear in the vibration equation. Gravity shifts equilibrium but does not alter the natural frequency of this ideal linear spring network.

The series extension and force readouts refer to signed changes of spring length from static equilibrium. For displacement x, δ₄ = −k₅x/(k₄ + k₅) and δ₅ = −k₄x/(k₄ + k₅), giving k₄δ₄ = k₅δ₅ = −k₄₅x. This common force is the series branch’s incremental force on the mass, positive downward. The intermediate junction moves downward by k₄x/(k₄ + k₅).

The effective potential of motion about loaded equilibrium is ½k_eq x². In absolute energy coordinates, changes in gravitational energy and in the static preload contribution to spring energy have equal and opposite linear terms. They cancel, leaving this quadratic vibration energy. The energy panel intentionally shows that effective energy rather than inventing an additional positive gravitational energy contribution.

## Shared analytical solution

For q = θ or x and initial coordinate q₀ and initial rate q̇₀:

    q(t) = q₀ cos(ωₙt) + (q̇₀/ωₙ) sin(ωₙt)
    q̇(t) = −ωₙq₀ sin(ωₙt) + q̇₀ cos(ωₙt)
    q̈(t) = −ωₙ²q(t)
    A = √(q₀² + (q̇₀/ωₙ)²)
    f = ωₙ/(2π), T = 2π/ωₙ

The panel does not assume a zero initial rate. Position and velocity inputs are both reflected in the response equation and total energy.

The inertia term and stiffness term are algebraic terms in the equation, not two independent external forces. Their sum is the equation residual. The actual restoring force or torque is −Kq. The equation panel displays rounded values; balance uses the unrounded snapshot values.

At an equilibrium crossing, displacement and restoring acceleration vanish while speed is greatest. At a turning point, speed vanishes and restoring acceleration has its greatest magnitude. Increasing release amplitude increases total energy, but it does not alter frequency in these linear models.

## Suggested explorations

1. Pause at a turning point and then at an equilibrium crossing. Compare displacement, velocity, acceleration, and the energy bars.
2. Double the mass while keeping spring values fixed. The spring network frequency decreases by √2. In the pendulum, only the spring contribution k/m changes; g/L does not.
3. Double every spring stiffness. The network frequency increases by √2. In the pendulum, only the spring contribution doubles.
4. Change k₄ or k₅ independently. Confirm that the softer series spring stretches farther, while both springs carry the same force.
5. Release from the same position with a nonzero initial velocity. The sine term appears, total energy increases, and the amplitude exceeds the original release position.
6. Increase the pendulum angle and compare Lθ with L sin θ. Explain why the linearized model becomes less accurate even though its analytical frequency remains unchanged.

## Interface intent

The side panel connects the drawing to the equation at the same simulation time. Its motion tab gives the response and natural frequency; its derivation tab explains how the equation is assembled; its energy tab displays the transfer between kinetic and potential energy. The spring pendulum derivation offers both Newton and Lagrange approaches. Equation rendering includes semantic MathML for assistive technology.
