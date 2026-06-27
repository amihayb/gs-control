# Gevasol Stabilit Control

Browser-only Web Serial control panel for two Nanotec PD6-E-M motors via ZK-USB-CAN-1.

## Run

Requires Chrome or Edge served from `http://localhost` (Web Serial does not work over `file://`).

A simple way to serve the project locally:

```text
cd src
python -m http.server 8080
```

Then open `http://localhost:8080` in Chrome or Edge.

1. Click **Connect** and select the ZK-USB-CAN-1 COM port.
2. Toggle **Motors ON** in the sidebar.
3. Open the **Movement Control** panel to:
   - Move each axis to a target position (degrees).
   - Jog axes by ±1° or ±5° using the arrow grid.
   - Return both axes to home (0°, 0°) with the home button.
   - Set the current position as home and save to NVM.
4. Use the **Emergency Stop** button to cut motor power immediately.

Travel is clamped to ±20 000 ticks on both axes.

## Source files

| File | Responsibility |
|---|---|
| `src/nanotec-canopen.js` | Low-level serial, CANopen SDO read/write, enable/disable/move/homing |
| `src/app.js` | UI state, event handlers, polling, unit conversion |
| `src/panelUI.js` | Movement Control sliding panel — buttons, jog grid, target inputs |
| `src/index.html` | Layout only |
| `src/StyleSheet.css` | Visual style |

Read `RULES.md` before changing motor-control code.
