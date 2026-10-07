# Vibrations Physics Sim

**[Open simulator ↗](https://kadencsmith.github.io/vibrations-physics-sim/)** · **[Open inverted spring network ↗](https://kadencsmith.github.io/vibrations-physics-sim/?problem=compound-inverted)**

**[Download ZIP ↓](https://github.com/KadenCSmith/vibrations-physics-sim/archive/refs/heads/main.zip)** · **[Download TAR.GZ ↓](https://github.com/KadenCSmith/vibrations-physics-sim/archive/refs/heads/main.tar.gz)**

An interactive vibrations lab with five simulations, live equations, series and parallel spring lessons, energy diagrams, and a searchable formula Finder. Use it directly in your browser, or download the source project to run locally.

## Choose a simulation

| Simulation | What to explore |
| --- | --- |
| [01 · Spring pendulum](https://kadencsmith.github.io/vibrations-physics-sim/?problem=pendulum) | Full sine/cosine torque model and a small-angle comparison. |
| [02 · Five-spring network](https://kadencsmith.github.io/vibrations-physics-sim/?problem=network) | Three direct paths in parallel with a k₄–k₅ series branch. |
| [03 · Compound spring system](https://kadencsmith.github.io/vibrations-physics-sim/?problem=compound) | Two parallel pairs in a series chain, a k₄ bypass, and final k₅. |
| [04 · Inverted spring pendulum](https://kadencsmith.github.io/vibrations-physics-sim/?problem=inverted) | A uniform bar with spring restoring torque and destabilizing gravity; energy and Lagrange derivations. |
| [05 · Inverted compound spring system](https://kadencsmith.github.io/vibrations-physics-sim/?problem=compound-inverted) | The seven-spring network flipped vertically: top mass, floor support, upward-positive displacement. |

## Explore the physics

- Use **Simulation** or keys **1–5** to choose a model. Each model remembers its own parameters.
- Drag the mass or bar to set a release. Arrow keys also move the focused compound mass. Use **Pause**, change speed, or scrub the graph to inspect an instant.
- Open **Toolbox** to change physical values. Edits restart the trajectory while preserving your choice to play or pause.
- On every spring network, the visible **Series or parallel?** cards compare live forces and deformations. Try equal springs or make k₅ softer with one click.
- In **simulation 05**, click any spring (or focus it and press Enter/Space) to inspect its connections, live deformation, force, energy and compliance, and edit stiffness directly. The identical k₁ and k₃ pairs share their respective stiffness settings.
- Expand **Spring-by-spring details & reduction** to trace the connections, equivalent stiffness, junction motion, and every spring's force.
- The equation panel connects the current motion to its **Motion**, **Derivation**, and **Energy** tabs. **Finder** searches formulas, intermediate steps, and source references.

**Series:** the transmitted force is equal and deformations add, so reciprocal stiffnesses add. Two equal springs give k/2. **Parallel:** deformation is equal and forces add, so stiffnesses add. Two equal springs give 2k. Connectivity determines these rules, including paths on opposite sides of a mass.

The new inverted network has the same equivalent stiffness and frequency as simulation 03 for the same parameters. Gravity compresses its springs at rest; x is measured upward from that loaded equilibrium. It assumes vertical guides and ideal springs that support tension and compression without buckling. The incremental equation remains m ẍ + k_eq x = 0.

All models are undamped, and example values are illustrative. The inverted bar uses a small-angle model and holds at ±12°; it distinguishes stable, neutral, and unstable motion. Exactly 0 kg displays an equilibrium constraint without assigning an acceleration or frequency.

## Run the downloaded project

The downloads contain source code. Requires **Node.js 22.12 or newer**; no desktop installer is included.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5182/>. To build and serve the production web app:

```sh
npm run build
npm run preview
```

## Development

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

React, TypeScript and Vite provide the app; SVG draws the scenes and KaTeX displays accessible equations. Physics lives in `src/physics`, independently of playback and rendering. Linear motion is analytical; the full pendulum uses a cached numerical trajectory. GitHub Actions checks the project and publishes the browser app after updates to `main`.

See [physics assumptions](docs/PHYSICS.md), [teaching notes](docs/TEACHING.md), and the [38-photo reference inventory](docs/SOURCE_REFERENCES.md). Tests cover force balance, energy conservation, motion, zero-mass constraints, spring connectivity, and formula rendering.

The navigation and black canvas are adapted from [Zombie Fire Suppression Sim](https://github.com/KadenCSmith/zombie-fire-suppression-sim). Original scans and lecture photos remain outside this repository. No new software license has been assigned to the user's original code.
