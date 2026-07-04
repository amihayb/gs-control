/**
 * UserPrograms.js — Motion sequences for Prog 1 / Prog 2 / Prog 3 buttons.
 *
 * Edit ONLY this file to change movement programs.
 * Do NOT edit app.js or panelUI.js for program changes.
 *
 * Each step:
 *   ax1    — Axis 1 target position in degrees
 *   ax2    — Axis 2 target position in degrees
 *   waitMs — milliseconds to wait after the move command is sent
 *            before proceeding to the next step
 *
 * Both axes move simultaneously on each step.
 * Positions are clamped to ±MAX_TICKS by the move function.
 */

const PROG1 = [
  { ax1:   0, ax2:   0, waitMs: 1000 },
  { ax1:  15, ax2:   0, waitMs: 2000 },
  { ax1:  15, ax2:  15, waitMs: 2000 },
  { ax1:   0, ax2:  15, waitMs: 2000 },
  { ax1: -15, ax2:  15, waitMs: 2000 },
  { ax1: -15, ax2:   0, waitMs: 2000 },
  { ax1: -15, ax2: -15, waitMs: 2000 },
  { ax1:   0, ax2: -15, waitMs: 2000 },
  { ax1:  15, ax2: -15, waitMs: 2000 },
  { ax1:  15, ax2:   0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 1000 },
];

const PROG2 = [
  { ax1:   0, ax2:   0, waitMs: 1000 },
  { ax1: -10, ax2:   0, waitMs: 2000 },
  { ax1:   0, ax2: -10, waitMs: 3000 },
  { ax1:  10, ax2:   0, waitMs: 3000 },
  { ax1:   0, ax2:  10, waitMs: 3000 },
  { ax1:   0, ax2:   0, waitMs: 1000 },
];

const PROG3 = [
  { ax1:   0, ax2:   0, waitMs: 1000 },
  { ax1:  15, ax2: -15, waitMs: 4000 },
  { ax1: -15, ax2:  15, waitMs: 4000 },
  { ax1:  15, ax2:  15, waitMs: 4000 },
  { ax1: -15, ax2: -15, waitMs: 4000 },
  { ax1:   0, ax2:   0, waitMs: 1000 },
];
