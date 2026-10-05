# Vibrations simulation

- Keep physical equations and state in `src/physics`; views consume snapshots.
- Use SI units internally; convert angles in degrees only at input/output boundaries.
- Match the two diagrams in Prof. Lee's ENGR 317 exam review. In problem 2, k4 and k5 are the series branch.
- Preserve the small-angle, undamped model. Distinguish exact drawing geometry from linearized spring extension x = L theta.
- Keep camera, graph scale, label visibility, and playback speed separate from physical parameters.
- Parameter edits or a dragged release reset the initial condition and clock; scrubbing evaluates the same analytical trajectory.
- Maintain the browser-first React/TypeScript/Vite shell adapted from zombie-fire-suppression-sim v0.20. Do not package the desktop app until requested.
- Do not add a license for the user's original code without approval. Preserve provenance of reused shell code.
- Verify with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`, then inspect both problems in Chrome.
