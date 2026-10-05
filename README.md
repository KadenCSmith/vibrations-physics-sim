# Vibrations Physics Sim

A browser-first educational simulation of four vibrations problems: a spring pendulum, a five-spring network, a compound spring system, and an inverted uniform bar with two springs. The navigation, Finder, Toolbox, typography, and black canvas follow [Zombie Fire Suppression Sim](https://github.com/KadenCSmith/zombie-fire-suppression-sim).

**[Open the public browser preview](https://kadencsmith.github.io/vibrations-physics-sim/)**

## Explore

- **Simulation** switches between the four problems. Keyboard shortcuts 1–4 select them.
- **Toolbox** changes mass, length, spring stiffness, gravity, and initial conditions.
- All simulations play automatically at quarter speed. Pause holds the motion until Play is pressed. Switching models, changing values, and opening drawers preserve playback; hidden tabs resume when visible.
- Drag the mass to choose a release position, change speed, or scrub the graph.
- The equation of motion labels each fixed input and changing value with its symbol and unit. Motion, Derivation, and Energy explain the model.
- **more info**, below either spring system's motion values, explains each physical spring, its connections, and the live equivalent stiffness and force contributions.
- Finder groups the complete formula library by all four simulations, shared foundations, and lecture extensions. Search concepts, derivative steps, trig identities, or source photo numbers.

The pendulum defaults to the full equation **−mgL sin θ − kL² sin θ cos θ = J₀ θ̈**, with J₀ = mL² and ideal horizontal spring force. Its geometry, derivatives, energy, and motion use that equation. A small-angle harmonic comparison is selectable in Toolbox. Full-mode release angles range up to ±60°; the linear comparison is limited to ±12°.

The spring network uses an analytical, undamped solution and follows the exam scan: k₄ and k₅ form the series branch; k₃ is a direct branch. Its coordinate is downward displacement from the loaded equilibrium. The differently numbered lecture practice network is separately labeled in Finder. Default numerical values are illustrative because the diagrams specify symbols rather than numerical data.

The compound system follows the supplied seven-spring diagram. Two k₁ springs act in parallel, followed by k₂ and a parallel pair of k₃ springs in series. This left path acts in parallel with k₄; their combined assembly is in series with the final k₅ attached to the mass. Its three massless junctions move consistently with spring force balance. The equation panel answers the requested equivalent stiffness, angular frequency in rad/s, frequency in Hz, and period in seconds. [Open simulation 03](https://kadencsmith.github.io/vibrations-physics-sim/?problem=compound).

The inverted uniform bar follows the requested small-angle model: **(mℓ²/3)θ̈ + (2kℓ² − mgℓ/2)θ = 0**. Both identical springs attach at the top; gravity acts at the midpoint. The Energy method and Lagrange tabs derive the equation separately, using the supplied Lagrange formula. Positive angular stiffness produces oscillation; zero stiffness produces neutral motion; negative stiffness produces exponential instability rather than a natural oscillation frequency. This preview holds at ±12° instead of extending the small-angle approximation indefinitely. Stable motion repeats at quarter speed; neutral and unstable paths stop at the angle boundary or the end of an eight-second observation window. [Open simulation 04](https://kadencsmith.github.io/vibrations-physics-sim/?problem=inverted).

Mass can be set to exactly 0 kg. This displays the massless equilibrium constraint, without inventing an acceleration or oscillation frequency. Positive mass starts at 0.1 kg; smaller positive entries normalize to that supported minimum. With both pendulum mass and spring stiffness zero, the held angle is an illustrative choice and the equation is the identity 0 = 0.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5182/>. Changes appear in the browser during development. This version is a web preview; desktop installers have not been added.

## Check and build

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

`dist/` contains the production web app. `npm run preview` serves that build locally.

## Architecture

React and TypeScript provide the application shell. Vite builds the web app. SVG draws the apparatus and response graphs, and KaTeX displays accessible mathematics. Physics is independent of animation and rendering. The network and linear comparison use analytical solutions. The nonlinear pendulum uses an energy-derived period and a cached, fixed-step numerical trajectory. Playback and scrubbing evaluate that reproducible trajectory without frame-dependent integration.

- `src/physics/model.ts`: parameters, analytical solutions, forces, energy, and spring-branch geometry.
- `src/hooks/useSimulationClock.ts`: playback and seeking.
- `src/ui/`: navigation, drawers, apparatus, graph, controls, and educational equations.
- `src/physics/formula*.ts`: searchable equations, explanations, and source provenance.
- `tests/`: initial conditions, torque/force balances, energy conservation, true nonlinear period, repeatable scrubbing, spring connectivity, formula rendering, and reference coverage.

See [physics assumptions](docs/PHYSICS.md), [teaching notes](docs/TEACHING.md), and the [38-photo reference inventory](docs/SOURCE_REFERENCES.md). Original scans and lecture photographs are reference material and are not distributed in this repository. The UI shell is adapted from the user's existing fire simulation; no new software license has been assigned.
