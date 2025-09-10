# TODO

## Face Interaction (Mouse Drag)
- [x] Raycast selected cubelet face; derive face normal and plane.
- [x] Collect affected layer (within epsilon of plane) and animate quarter‑turns.
- [x] Infer direction from drag vector; support prime and double turns.
- [x] Snap to 90° and regrid; update logical state accordingly.

## Move System & Parser
- [ ] Parse Singmaster: `R U F L D B M E S x y z` with `'` and `2`.
- [ ] Queue + animate moves; debounce key input; configurable turn speed.
- [ ] History, undo/redo; scramble generator using valid random states.

## Cube State Model (`src/state/cube-state.ts`)
- [ ] Represent cubie permutation + orientation (corners/edges) or stickers.
- [ ] Implement move application for all faces/slices/rotations.
- [ ] Solved check, export/import state (JSON), and equality compare.
- [ ] Public API: `apply(sequence)`, `scramble(n)`, `isSolved()`.

## Rendering & Performance
- [ ] Reuse geometries/materials; consider `InstancedMesh` for stickers.
- [ ] Handle WebGL context loss; dispose on teardown; cap DPR on mobile.
- [ ] Minimize per‑frame allocations; profile with `Spector.js` (dev only).

## Testing
- [ ] Configure Vitest; add unit tests for state transitions and parser.
- [ ] Add Playwright E2E: rotate layers via UI, scramble/reset flows.
- [ ] Coverage target ≥80% for `src/state/**` and interaction helpers.

## UI & UX
- [ ] HUD: show move queue, last move, elapsed time; keyboard cheatsheet.
- [ ] Controls: buttons for scramble/reset; slider for animation speed.
- [ ] Optional: tutorial overlay and accessibility (rebind keys, focus order).

## Tooling & CI
- [ ] Add ESLint + Prettier configs; enforce on `npm run lint/format`.
- [ ] GitHub Actions: install, lint, build, test, Playwright (headed=false).
- [ ] Pre‑commit hooks (Husky) for lint and tests on changed files.

## Documentation
- [ ] README: quick start, controls, GIF demo, deployment notes.
- [ ] Update `AGENTS.md` when modules/commands change; add architecture diagram.

## Controls & Debug
- [x] Reset cube with key `0` (rebuild solved cube, regrid, reset camera).
- [x] Test Mode toggle with key `T`: display axes indicator (e.g., `THREE.AxesHelper`) and highlight the active rotation axis during interactions.
- [x] Add debug logs that can be toggled from code (e.g., `const DEBUG = true` or URL flag `?debug=1`) to trace moves, selected layer, and performance timings.
