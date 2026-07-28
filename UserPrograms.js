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
  return Array.from({ length: n }, (_, i) =>
    steps.map(s => ({ ...s, rep: i + 1, repTotal: n }))
  ).flat();
}

const PROG_1_ANKLE = [
  { ax1:    0, ax2:    0, vel:  5, waitMs:  1000, info: 'Home' },
  { waitOnly: 5000, info: 'Body Weight Workout' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:    0, ax2:   -8, vel:  5, waitMs:  1000, info: 'Center - Right' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:    8, vel:  5, waitMs:  1000, info: 'Center - Left' },
    { ax1:    0, ax2:    0, vel:  5, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:    0, ax2:   -8, vel:  8, waitMs:  1000, info: 'Center - Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:    8, vel:  8, waitMs:  1000, info: 'Center - Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
];

const PROG_2_SHOULDER_PRESS = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Dumbbells' },
  ...repeat([
    { ax1:   10, ax2:    0, vel:  8, waitMs:  3000, info: 'Forward - Center' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:   10, ax2:    0, vel:  8, waitMs:  3000, info: 'Forward - Center' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:   10, ax2:    0, vel: 15, waitMs:  3000, info: 'Forward - Center' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:   10, ax2:    0, vel: 15, waitMs:  3000, info: 'Forward - Center' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_3_SIDE_FLYS = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Dumbbells' },
  { waitOnly: 5000, info: 'Get Ready!' },
  ...repeat([
    { ax1:  -10, ax2:    0, vel:  8, waitMs:  3000, info: 'Backward - Center' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:  -10, ax2:    0, vel:  8, waitMs:  3000, info: 'Backward - Center' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:  -10, ax2:    0, vel: 15, waitMs:  3000, info: 'Backward - Center' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch Leg' },
  ...repeat([
    { ax1:  -10, ax2:    0, vel: 15, waitMs:  3000, info: 'Backward - Center' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_4_FRONT_RAISE = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' }, 
  { pause: true, info: 'Take Dumbbells' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:  0, ax2:  -13, vel:  8, waitMs:  2000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5600, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  0, ax2:  13, vel:  8, waitMs:  2000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:  0, ax2:  -13, vel:  8, waitMs:  2000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5), 
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  0, ax2:  13, vel:  8, waitMs:  2000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  3000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Home' },
];

const PROG_5_BICEP_CURL = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Dumbbells' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:  0, ax2:  -13, vel:  8, waitMs:  2000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  0, ax2:  13, vel:  8, waitMs:  2000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  8, waitMs:  5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:  0, ax2:  -13, vel:  15, waitMs:  1000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:  13, ax2:  0, vel:  15, waitMs:  1000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:  -13, ax2:  0, vel:  15, waitMs: 5000, info: 'Backward'},
    { ax1:    0, ax2:    0, vel:  15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  -10, ax2:   10, vel: 15, waitMs:  1000, info: 'Backward - Forward - Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_6_CHEST_FLY = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Dumbbells' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  0, ax2:  -13, vel:  8, waitMs:  5000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:  0, ax2:  13, vel:  8, waitMs:  5000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  15, waitMs:  1000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:  0, ax2:  -13, vel:  15, waitMs:  5000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  15, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  15, waitMs:  1000, info: 'Forward'},
    { ax1:    0, ax2:    0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:  0, ax2:  13, vel:  15, waitMs:  5000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  15, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_7_TRICEPS_SL = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Dumbbells' },
  { waitOnly: 5000, info: 'Stand on One Leg' },
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  2000, info: 'Backward' },
    { ax1:  13, ax2:    0, vel: 15, waitMs:  5000, info: 'Forward' },
  ], 5),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { waitOnly: 15000, info: 'Switch to Other Leg' },
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  2000, info: 'Backward' },
    { ax1:  13, ax2:    0, vel: 15, waitMs:  5000, info: 'Forward' },
  ], 5),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { waitOnly: 15000, info: 'Switch to Other Leg' },
  ...repeat([
    { ax1:  13, ax2:    0, vel: 15, waitMs:  2000, info: 'Forward' },
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  5000, info: 'Backward' },
  ], 5),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { waitOnly: 15000, info: 'Switch to Other Leg' },
  ...repeat([
    { ax1:  13, ax2:    0, vel: 15, waitMs:  2000, info: 'Forward' },
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  5000, info: 'Backward' },
  ], 5),
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { waitOnly: 3000, info: 'Well Done!' },
];

const PROG_8_KETTLEBELL_ROTATION = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Kettlebell' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_9_BAND_EXTENSION = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Band' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    -13, ax2:    0, vel:  8, waitMs:  3300, info: 'Backward' },
    { ax1:  0, ax2:  0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:    0, ax2:    -13, vel:  8, waitMs:  4000, info: 'Right' },
    { ax1:  0, ax2:  0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  8, waitMs:  2000, info: 'Forward'},
    { ax1:    -13, ax2:    0, vel:  8, waitMs:  3300, info: 'Backward' },
    { ax1:  0, ax2:  0, vel:  8, waitMs:  2000, info: 'Center' },
    { ax1:    0, ax2:    13, vel:  8, waitMs:  4000, info: 'Left' },
    { ax1:  0, ax2:  0, vel:  8, waitMs:  2000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  15, waitMs:  1000, info: 'Forward'},
    { ax1:    -13, ax2:    0, vel:  15, waitMs:  200, info: 'Backward' },
    { ax1:  0, ax2:  0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:    0, ax2:    -13, vel:  15, waitMs:  4000, info: 'Right' },
    { ax1:  0, ax2:  0, vel:  15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  13, ax2:  0, vel:  15, waitMs:  1000, info: 'Forward'},
    { ax1:    -13, ax2:    0, vel:  15, waitMs:  200, info: 'Backward' },
    { ax1:  0, ax2:  0, vel:  15, waitMs:  1000, info: 'Center' },
    { ax1:    0, ax2:    13, vel:  15, waitMs:  4000, info: 'Left' },
    { ax1:  0, ax2:  0, vel:  15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_10_HIP_OPEN = [
  { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Home' },
  { waitOnly: 5000, info: 'Body Weight Workout' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:    0, ax2:  -10, vel:  8, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:   10, vel:  8, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel:  8, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_11_DOUBLE_LEG_SQUAT = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Band' },
  { waitOnly: 5000, info: 'Turn Right' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Turn Left' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Turn Right' },
  ...repeat([
    { ax1:    0, ax2:   13, vel: 15, waitMs:  4000, info: 'Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Turn Left' },
  ...repeat([
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  4000, info: 'Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

const PROG_12_SL_BALANCE = [
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
  { pause: true, info: 'Take Weight Vest' },
  { waitOnly: 5000, info: 'Stand on Right Leg' },
  ...repeat([
    { ax1:  -13, ax2:   13, vel: 15, waitMs:  1000, info: 'Backward - Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
    { ax1:   13, ax2:  -13, vel: 15, waitMs:  1000, info: 'Forward - Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  -13, ax2:   13, vel: 15, waitMs:  1000, info: 'Backward - Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
    { ax1:   13, ax2:  -13, vel: 15, waitMs:  1000, info: 'Forward - Right' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Right Leg' },
  ...repeat([
    { ax1:   13, ax2:    0, vel: 15, waitMs:  1000, info: 'Forward - Backward' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'Right - Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'Center' },
  ], 5),
  { waitOnly: 15000, info: 'Switch to Left Leg' },
  ...repeat([
    { ax1:  -13, ax2:    0, vel: 15, waitMs:  1000, info: 'Backward - Forward' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Center' },
    { ax1:    0, ax2:  -13, vel: 15, waitMs:  1000, info: 'Right - Left' },
    { ax1:    0, ax2:    0, vel: 15, waitMs:  4000, info: 'Center' },
  ], 5),
  { waitOnly: 3000, info: 'Well Done!' },
  { ax1:    0, ax2:    0, vel: 15, waitMs:  1000, info: 'Home' },
];

// ── Program registry ─────────────────────────────────────────────────────────
const USER_PROGRAMS = [
  { label: '1 Ankle Stability', steps: PROG_1_ANKLE },
  { label: '2 Shoulder Press', steps: PROG_2_SHOULDER_PRESS },
  { label: '3 Side Flys', steps: PROG_3_SIDE_FLYS },
  { label: '4 Front Raise', steps: PROG_4_FRONT_RAISE },
  { label: '5 Bicep Curl', steps: PROG_5_BICEP_CURL },
  { label: '6 Chest Fly', steps: PROG_6_CHEST_FLY },
  { label: '7 Triceps SL Squat', steps: PROG_7_TRICEPS_SL },
  { label: '8 Kettlebell Rotation', steps: PROG_8_KETTLEBELL_ROTATION },
  { label: '9 Band Extension', steps: PROG_9_BAND_EXTENSION },
  { label: '10 Hip Open', steps: PROG_10_HIP_OPEN },
  { label: '11 Double Leg Squat', steps: PROG_11_DOUBLE_LEG_SQUAT },
  { label: '12 SL Balance', steps: PROG_12_SL_BALANCE },
];
