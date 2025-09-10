# Project Context

## Overview
This is a Vite + TypeScript + Three.js Rubik’s Cube project. It renders a 3×3 cube with orbit controls, keyboard moves, and mouse drag face-rotation. The goal is an interactive, solvable cube with a clean state model and test coverage.

## Current Features
- Orbit + grid: drag to orbit, wheel to zoom.
- Keyboard moves: `U`, `R`, `F`, `M` (hold Shift for prime). `S` scrambles, `0` resets, `T` toggles Test Mode.
- Mouse drag turns: click a face, drag across it for smooth in-drag rotation; snaps to 90° on release. Active layer highlights while dragging.
- Debug: enable logs with `?debug=1` or `window.__DEBUG__ = true`.

## Structure
- `src/core/renderer.ts`: Scene/camera/renderer, resize, lights.
- `src/scene/cube.ts`: Builds cubelet grid and `regridCubelets` snapping.
- `src/controls/interaction.ts`: Layer rotation helper and key→axis mapping types.
- `src/main.ts`: Bootstraps scene, input (keyboard + drag), highlighting, reset.
- `AGENTS.md`: Contributor guidelines. `TODO.md`: Next-step checklist.

## Dev Commands
- `npm install` · `npm run dev` (HMR)
- `npm run build` · `npm run preview`

## Key Decisions
- Layer selection uses WORLD coordinates with tolerance `eps = step * 0.3` to avoid missed cubelets yet not grab adjacent layers.
- Drag computes rotation axis via `axis = normalize(n × tangent)` and maps to nearest principal axis; live rotation through a temporary pivot, then detach + `regridCubelets`.
- Reset rebuilds the cube and disposes geometries/materials to prevent WebGL leaks.

## Next Steps
See `TODO.md`: move parser + cube state model, drag polish (gizmos), tests (Vitest/Playwright), and CI/tooling.

## Quick Resume
1) `npm install`  2) `npm run dev`  3) Try `U/R/F/M`, drag faces, `S`, `0`, `T`. 4) Use `?debug=1` if needed.
