# Teaching notes

The two simulations implement the undamped problems in Prof. Lee’s ENGR 317 exam review. The pendulum defaults to the full trigonometric equation, with a selectable small-angle comparison. The spring network is linear. The numerical defaults are illustrative because the source problems specify symbolic values. Physical inputs use SI units. Degrees appear only at angular input and display boundaries.

## Problem 1: Spring pendulum

A point mass m is carried by a massless rigid rod of length L, rotating about a fixed pivot. A horizontal spring of stiffness k is undeformed at the downward equilibrium. There is no damping. In full mode the ideal horizontal spring extension is x = L sin θ. The supplied torque equation assumes horizontal spring force; the drawing represents its moving height with an ideal guide. This is not a model of an arbitrary fixed-point angled spring. For the small-angle comparison, x ≈ Lθ.

The rotational inertia is J₀ = mL². Full-mode torques and energy are:

    τg = −mgL sin θ
    τs = −kL² sin θ cos θ
    τg + τs = J₀ θ̈
    T = ½mL²θ̇²
    Vg = mgL(1 − cos θ), Vs = ½kL² sin²θ

The animation, live substitutions, and energy bars follow this equation. A reproducible cached numerical trajectory supports animation and scrubbing, and an energy integral gives the amplitude-dependent period. The displayed linear natural frequency is a comparison, not the frequency of the full-mode trajectory.

For small angles, gravity supplies torque −mgLθ and the spring supplies torque −kL²θ, giving:

    mL² θ̈ + (mgL + kL²)θ = 0
    ωₙ = √(g/L + k/m)

The Lagrange derivation uses kinetic energy T = ½mL²θ̇² and quadratic potential V = ½(mgL + kL²)θ². The gravitational term comes from expanding mgL(1 − cos θ) to second order. Both derivations lead to the same differential equation.

The animation draws the bob on the circular arc: horizontal location L sin θ and vertical location −L cos θ. In full mode the horizontal position is x = L sin θ, its velocity is L cos θ·θ̇, and its acceleration is L(cos θ·θ̈ − sin θ·θ̇²). The kinetic energy uses total bob speed L|θ̇|, rather than only the horizontal velocity. In linear comparison mode the modeled coordinate is Lθ while the drawing still follows the circular arc. The panel labels each interpretation.

## Problem 2: Spring network

The mass moves vertically, with x positive downward and measured from the statically loaded equilibrium. Springs k₁ and k₂ connect above the mass, and k₃ connects below it. Springs k₄ and k₅ form a second lower branch in series, with a massless intermediate junction. The signed incremental extensions of the lower series springs add to −x, and the two springs carry the same incremental force.

    k₄₅ = k₄k₅/(k₄ + k₅)
    k_eq = k₁ + k₂ + k₃ + k₄₅
    m ẍ + k_eq x = 0
    ωₙ = √(k_eq/m)

Branches on opposite sides of the mass still contribute positively to equivalent stiffness. Their incremental restoring forces all oppose displacement. Gravity is balanced by the static spring preload at equilibrium. Choosing x from that loaded equilibrium cancels the constant gravity term, so it does not appear in the vibration equation. Gravity shifts equilibrium but does not alter the natural frequency of this ideal linear spring network.

The series extension and force readouts refer to signed changes of spring length from static equilibrium. For displacement x, δ₄ = −k₅x/(k₄ + k₅) and δ₅ = −k₄x/(k₄ + k₅), giving k₄δ₄ = k₅δ₅ = −k₄₅x. This common force is the series branch’s incremental force on the mass, positive downward. The intermediate junction moves downward by k₄x/(k₄ + k₅).

The effective potential of motion about loaded equilibrium is ½k_eq x². In absolute energy coordinates, changes in gravitational energy and in the static preload contribution to spring energy have equal and opposite linear terms. They cancel, leaving this quadratic vibration energy. The energy panel intentionally shows that effective energy rather than inventing an additional positive gravitational energy contribution.

## Analytical solution for linear modes

For the network, or the small-angle pendulum comparison, let q = x or θ with initial coordinate q₀ and initial rate q̇₀:

    q(t) = q₀ cos(ωₙt) + (q̇₀/ωₙ) sin(ωₙt)
    q̇(t) = −ωₙq₀ sin(ωₙt) + q̇₀ cos(ωₙt)
    q̈(t) = −ωₙ²q(t)
    A = √(q₀² + (q̇₀/ωₙ)²)
    f = ωₙ/(2π), T = 2π/ωₙ

The network permits nonzero initial velocity and reflects it in the response and energy. The pendulum lesson releases from rest. Full trigonometric motion generally is not a sine or cosine in time and does not use this harmonic closed form.

The inertia term and stiffness term are algebraic terms in the equation, not two independent external forces. Their sum is the equation residual. The actual restoring force or torque is −Kq. The equation panel displays rounded values; balance uses the unrounded snapshot values.

At an equilibrium crossing, displacement and restoring acceleration vanish while speed is greatest. At a turning point, speed vanishes. In the linear modes restoring acceleration has its greatest magnitude there; in full trigonometric mode this claim does not hold for every parameter and amplitude. Increasing release amplitude increases total energy, but it does not alter frequency in these linear models.

## What does 0 kg mean?

The mass slider includes zero to expose a modeling boundary. With no inertia, the undivided equation requires forces or torques to balance; it no longer predicts acceleration by division. The network therefore rests at `x=0`. A massless pendulum with a nonzero spring rests at `theta=0` within the available angle range. A displaced release cannot produce an inertial oscillation in either case. The static display is not a physical instantaneous settling process, and it has no oscillation frequency.

If pendulum mass and spring stiffness are both zero, the torque equation is simply `0=0`: any chosen configuration satisfies it, but the equation does not determine how that configuration moves. The app holds the selected angle as an illustration. Do not use `sqrt(g/L+k/m)` at exactly zero mass. For fixed positive spring stiffness, frequency grows as a **positive** mass approaches zero; the equation at exactly zero is a different, algebraic model.

## Suggested explorations

1. Pause at a turning point and then at an equilibrium crossing. Compare displacement, velocity, acceleration, and the energy bars.
2. Double the mass while keeping spring values fixed. The spring network frequency decreases by √2. In the pendulum, only the spring contribution k/m changes; g/L does not.
3. Double every spring stiffness. The network frequency increases by √2. In the pendulum, only the spring contribution doubles.
4. Change k₄ or k₅ independently. Confirm that the softer series spring stretches farther, while both springs carry the same force.
5. Release from the same position with a nonzero initial velocity. The sine term appears, total energy increases, and the amplitude exceeds the original release position.
6. In full pendulum mode, choose a 40° release and compare its measured period with the small-angle prediction. Compare Lθ with L sin θ, and inspect the separate gravity and spring torques.

## Interface intent

Both models autoplay at quarter speed. Explicit Pause holds the clock until Play is pressed. Edits and problem changes restart the trajectory without changing that playback intent. Hidden tabs suspend animation and resume when visible.

The side panel connects the drawing to the equation at the same simulation time. Constants and time-varying quantities are labeled with symbols, names, units, and consistent colors, so each number can be traced into the substituted equation. Its motion tab gives the response and natural frequency; its derivation tab explains how the equation is assembled; its energy tab displays the transfer between kinetic and potential energy. The spring pendulum derivation offers both Newton and Lagrange approaches. Equation rendering includes semantic MathML for assistive technology.

Finder contains the full formula catalogue grouped by simulation, shared foundations, and lecture extensions. Source filenames, corrected note errors, completed blanks, trigonometric identities, intermediate derivatives, and the numerical method are included. Structural stiffness, damping, and the differently numbered practice network are reference examples, not additional active simulations.
