# Vibrations Physics Sim

A browser-first educational simulation of two ENGR 317 exam-review problems: a spring pendulum and a five-spring network. The navigation, Finder, Toolbox, typography, and black canvas follow [Zombie Fire Suppression Sim](https://github.com/KadenCSmith/zombie-fire-suppression-sim).

## Explore

- **Previous sims** switches between the two problems.
- **Toolbox** changes mass, length, spring stiffness, gravity, and initial conditions.
- Drag the mass to choose a release position; play, pause, change speed, or scrub the graph.
- The equation of motion substitutes the current position and acceleration live. Motion, Derivation, and Energy explain how the model works.
- Finder contains guides and the formula reference library, which is being expanded from the supplied lecture notes.

Both models use analytical, undamped free-vibration solutions. The pendulum uses a small-angle approximation. Its drawing uses trigonometric geometry, while its equations use the linear coordinate x = Lθ. The spring network follows the exam scan: k₄ and k₅ form the series branch; k₃ is a direct branch. Default numerical values are illustrative because the diagrams specify symbols rather than numerical data.

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

React and TypeScript provide the application shell. Vite builds the web app. SVG draws the apparatus and response graphs, and KaTeX displays accessible mathematics. The physics model is independent of animation and rendering; playback evaluates the exact analytical solution instead of integrating with frame-dependent steps.

- `src/physics/model.ts`: parameters, analytical solutions, forces, energy, and spring-branch geometry.
- `src/hooks/useSimulationClock.ts`: playback and seeking.
- `src/ui/`: navigation, drawers, apparatus, graph, controls, and educational equations.
- `tests/physics.test.ts`: initial conditions, equations of motion, energy conservation, and spring connectivity.

See [physics assumptions](docs/PHYSICS.md) and [teaching notes](docs/TEACHING.md). Original scans and lecture photographs are reference material and are not distributed in this repository. The UI shell is adapted from the user's existing fire simulation; no new software license has been assigned.
