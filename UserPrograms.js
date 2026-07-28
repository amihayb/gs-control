/**
 * UserProgramsFromExcel.js
 * Auto-generated from sequence.xlsx — do not edit by hand.
 * Copy the programs you need into UserPrograms.js.
 *
 * Level lookup used:
 *   Level 0: angle =  0°,  vel =  0 °/s
 *   Level 1: angle =  4°,  vel =  1 °/s
 *   Level 2: angle =  8°,  vel =  3 °/s
 *   Level 3: angle = 10°,  vel =  5 °/s
 *   Level 4: angle = 13°,  vel = 15 °/s
 */

function repeat(steps, n) {
  return Array.from({ length: n }, () => steps).flat();
}

const PROG_ANKLE = [
  { ax1:    0, ax2:    0, vel:  3, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:    0, ax2:   -8, vel:  3, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel:  3, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:    8, vel:  3, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel:  3, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   -8, vel:  5, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:    8, vel:  5, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
];

const PROG_SHOLDER = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:   10, ax2:    0, vel:  5, waitMs:  1000, info: 'קדימה - אמצע' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   10, ax2:    0, vel:  5, waitMs:  1000, info: 'קדימה - אמצע' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   10, ax2:    0, vel: 15, waitMs:  1000, info: 'קדימה - אמצע' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   10, ax2:    0, vel: 15, waitMs:  1000, info: 'קדימה - אמצע' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_WIDE_SIDES = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -10, ax2:    0, vel:  5, waitMs:  1000, info: 'אחורה - אמצע' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:    0, vel:  5, waitMs:  1000, info: 'אחורה - אמצע' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - אמצע' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - אמצע' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_WIDE_FRONT = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -13, ax2:  -13, vel:  5, waitMs:  1000, info: 'אחורה - ימין' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:   13, vel:  5, waitMs:  1000, info: 'אחורה - שמאל' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:  -13, vel:  5, waitMs:  1000, info: 'אחורה - ימין' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:   13, vel:  5, waitMs:  1000, info: 'אחורה - שמאל' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
];

const PROG_ELBOWS = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -10, ax2:  -10, vel:  5, waitMs:  1000, info: 'אחורה - קדימה - ימין' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:   10, vel:  5, waitMs:  1000, info: 'אחורה - קדימה - שמאל' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:  -10, vel: 15, waitMs:  1000, info: 'אחורה - קדימה - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:   10, vel: 15, waitMs:  1000, info: 'אחורה - קדימה - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_HORIZONTAL = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:   10, ax2:  -10, vel:  5, waitMs:  1000, info: 'ימין - קדימה' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   10, ax2:   10, vel:  5, waitMs:  1000, info: 'שמאל - קדימה' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   13, ax2:  -13, vel: 15, waitMs:  1000, info: 'ימין - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:   13, ax2:   13, vel: 15, waitMs:  1000, info: 'שמאל - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_SQUAT = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_CROSS = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_LATERAL_GAP = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -10, ax2:  -10, vel:  5, waitMs:  1000, info: 'ימין - אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:   10, vel:  5, waitMs:  1000, info: 'שמאל - אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:  -10, vel: 15, waitMs:  1000, info: 'ימין - אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:  -10, ax2:   10, vel: 15, waitMs:  1000, info: 'שמאל - אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  3000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_HIP_GAP = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:    0, ax2:  -10, vel:  5, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   10, vel:  5, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_CROSS_SQUAT = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  1000, info: 'אמצע - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'אמצע - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 10),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_SOMETHING = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  ...repeat([
    { ax1:  -13, ax2:   13, vel: 15, waitMs:  1000, info: 'אחורה - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'אמצע' },
    { ax1:   13, ax2:  -13, vel: 15, waitMs:  1000, info: 'קדימה - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 15),
  ...repeat([
    { ax1:  -13, ax2:   13, vel: 15, waitMs:  1000, info: 'אחורה - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'אמצע' },
    { ax1:   13, ax2:  -13, vel: 15, waitMs:  1000, info: 'קדימה - ימין' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 15),
  ...repeat([
    { ax1:   13, ax2:    0, vel: 15, waitMs:  1000, info: 'קדימה - אחורה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'אמצע' },
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'ימין - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 15),
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'אחורה - קדימה' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'אמצע' },
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'ימין - שמאל' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'אמצע' },
  ], 15),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

// ── Program registry ─────────────────────────────────────────────────────────
const USER_PROGRAMS = [
  { label: '1 Ankle', steps: PROG_ANKLE },
  { label: '2 Sholder Press', steps: PROG_SHOLDER },
  { label: '3 Flys', steps: PROG_WIDE_SIDES },
  { label: '4 Front Raise', steps: PROG_WIDE_FRONT },
  { label: '5 Bicep Curl', steps: PROG_ELBOWS },
  { label: '6 Chest Fly', steps: PROG_HORIZONTAL },
  { label: '7 Triceps SL', steps: PROG_SQUAT },
  { label: '8 Kettlbell Rotation', steps: PROG_CROSS },
  { label: '9 Band Extention', steps: PROG_LATERAL_GAP },
  { label: '10 Hip Open', steps: PROG_HIP_GAP },
  { label: '11 Double Leg Squat', steps: PROG_CROSS_SQUAT },
  { label: '12 SL Balance', steps: PROG_SOMETHING },
];
