# Gevasol Stabilit Control

Browser-only Web Serial control panel for two Nanotec PD6-E-M motors via ZK-USB-CAN-1.

## Run

1. Click **Connect** and select the ZK-USB-CAN-1 COM port.
2. Toggle **Motors ON** in the sidebar.
3. Use the **Movement Control** panel (opens automatically) to:
   - Set move velocity (2–20 °/s, default 15 °/s); written to profile velocity (`0x6081`) on both axes before every move.
   - Move each axis to a target position (degrees).
   - Jog axes by ±1° or ±5° using the 8-direction arrow grid (4 cardinal + 4 diagonal; diagonal buttons move both axes simultaneously).
   - Return both axes to home (0°, 0°) with the home button.
   - Run a pre-defined motion program (Prog 1 / 2 / 3).
   - Set the current position as home and save to NVM.
4. Use the **Emergency Stop** button to cut motor power immediately.

Travel is clamped to ±20 000 ticks on both axes.

## Source files

| File | Responsibility |
|---|---|
| `nanotec-canopen.js` | Low-level serial, CANopen SDO read/write, enable/disable/move/homing |
| `app.js` | UI state, event handlers, polling, unit conversion |
| `panelUI.js` | Movement Control sliding panel — buttons, jog grid, target inputs |
| `UserPrograms.js` | Pre-defined motion programs (Prog 1 / 2 / 3) |
| `index.html` | Layout only |
| `StyleSheet.css` | Visual style |

Read `RULES.md` before changing motor-control code.
