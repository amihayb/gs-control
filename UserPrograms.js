/**
 * UserPrograms.js — Motion sequences for program buttons.
 *
 * Edit ONLY this file to change or add movement programs.
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
 *
 * To add a new program:
 *   1. Define a new const PROGn = [ ... ] below.
 *   2. Add an entry to USER_PROGRAMS at the bottom of this file.
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


const PROG4 = [
  { ax1:   0, ax2:   0, waitMs: 1000 },
  { ax1:  10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2:  10, waitMs: 1000 },
  { ax1:  10, ax2:  10, waitMs: 1000 },
  { ax1:  10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2:  10, waitMs: 1000 },
  { ax1:  10, ax2:  10, waitMs: 1000 },
  { ax1:  10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2: -10, waitMs: 1000 },
  { ax1: -10, ax2:  10, waitMs: 1000 },
  { ax1:  10, ax2:  10, waitMs: 1000 },
  { ax1:   0, ax2:   0, waitMs: 1000 },
];

const PROG5 = [
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  0, ax2: -15, waitMs: 1000 },
  { ax1: 0, ax2:  15, waitMs: 2000 },
  { ax1:  0, ax2:  -15, waitMs: 2000 },
  { ax1: -0, ax2: 15, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
];

const PROG6 = [
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  10, ax2: 0, waitMs: 2000 },
  { ax1: 0, ax2:  0, waitMs: 20000 },
  { ax1:  -10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  -10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  -10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
  { ax1:  -10, ax2: 0, waitMs: 2000 },
  { ax1:   0, ax2:   0, waitMs: 2000 },
];

// ── Program registry ─────────────────────────────────────────────────────────
// Add or remove entries here to control which buttons appear in the panel.
const USER_PROGRAMS = [
  { label: 'Program 1', steps: PROG1 },
  { label: 'Program 2', steps: PROG2 },
  { label: 'Edges', steps: PROG3 },
  { label: 'Circles', steps: PROG4 },
  { label: '67', steps: PROG5 },
  { label: 'Right', steps: PROG6 },
];

