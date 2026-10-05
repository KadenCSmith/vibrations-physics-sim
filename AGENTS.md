# Vibrations simulation

- Keep physical equations and state in `src/physics`; views consume snapshots.
- Use SI units internally; convert angles in degrees only at input/output boundaries.
- Match the two diagrams in Prof. Lee's ENGR 317 exam review and the supplied compound and inverted-bar diagrams. In simulation 2, k4 and k5 are the series branch. In simulation 3, the two k1 springs and two k3 springs form parallel pairs; the left path is those pairs in series with k2, then parallel with k4, then series with k5.
- In simulation 4, the massive uniform bar pivots at the bottom; two identical springs attach at the top, gravity acts at ℓ/2, and J₀=mℓ²/3. Use the requested small-angle model and distinguish stable oscillation, neutral motion, instability, and zero-inertia constraints. Hold nonperiodic motion at the ±12° validity boundary instead of looping it.
- Preserve both the full trigonometric pendulum and its small-angle comparison, with undamped motion. Use x = L sin(theta) for the full model and x = L theta for the linear comparison.
- Keep camera, graph scale, label visibility, and playback speed separate from physical parameters.
- Parameter edits or a dragged release reset the initial condition and clock; scrubbing evaluates the same analytical or cached nonlinear trajectory. Preserve the user's explicit playback intent.
- Maintain the browser-first React/TypeScript/Vite shell adapted from zombie-fire-suppression-sim v0.20. Do not package the desktop app until requested.
- Do not add a license for the user's original code without approval. Preserve provenance of reused shell code.
- Verify with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`, then inspect all four problems in Chrome.
