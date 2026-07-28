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
| `UserPrograms.js` | 12 pre-defined motion programs (Ankle Stability → SL Balance) |
| `index.html` | Layout only |
| `StyleSheet.css` | Visual style |

Read `RULES.md` before changing motor-control code.

## Firebase remote control

The desktop app listens for commands sent by the mobile PWA via Firebase Realtime Database.

**Project:** `gs-control-6324d`  
**Database URL:** `https://gs-control-6324d-default-rtdb.firebaseio.com`  
**Firebase console:** [console.firebase.google.com](https://console.firebase.google.com/project/gs-control-6324d)

### How it works

- The desktop app connects to Firebase on load and logs `"Firebase remote listener ready."` in the log panel.
- The mobile app writes a command object to `gs-control/command` in the database.
- The desktop app receives it in under a second and calls the matching function.
- Commands with a `ts` (timestamp) older than the app's start time are ignored, so stale database values don't trigger on reload.

### Command format written by the mobile app

Every command is a JSON object written to `gs-control/command`. The `ts` field is `Date.now()` — it must change on every press so Firebase fires the listener.

| `type` | Extra fields | Action |
|---|---|---|
| `runProgram` | `program` | Run a named program |
| `stop` | — | Abort current program |
| `pauseResume` | — | Toggle pause/resume |
| `jog` | `axis` (`1`\|`2`), `delta` (degrees) | Jog one axis by ±degrees |
| `jogHome` | — | Move both axes to home (0°, 0°) |

#### `runProgram` — available programs

| `program` value | Description |
|---|---|
| `1 Ankle Stability` | Single-leg ankle tilt, both legs, 2 speeds |
| `2 Shoulder Press` | Forward tilt press on single leg, 2 speeds |
| `3 Side Flys` | Backward tilt fly on single leg, 2 speeds |
| `4 Front Raise` | Side + backward raise, both legs, 2 speeds |
| `5 Bicep Curl` | Side + forward + backward, both legs, 2 speeds |
| `6 Chest Fly` | Forward + side fly, both legs, 2 speeds |
| `7 Triceps SL Squat` | Forward/backward on single leg, 4 sets |
| `8 Kettlebell Rotation` | Side rotation on single leg, both sides, 2 rounds |
| `9 Band Extension` | Forward + backward + side, both legs, 2 speeds |
| `10 Hip Open` | Side tilt hip open, both legs, 2 speeds |
| `11 Double Leg Squat` | Side rotation squat with band, 4 sets |
| `12 SL Balance` | Diagonal balance challenge on single leg, 4 sets |

#### Examples

```json
{ "type": "runProgram", "program": "1 Ankle Stability", "ts": 1722031234567 }
{ "type": "stop",       "ts": 1722031234568 }
{ "type": "pauseResume","ts": 1722031234569 }
{ "type": "jog",        "axis": 1, "delta": 5, "ts": 1722031234570 }
{ "type": "jogHome",    "ts": 1722031234571 }
```

### Database security rules

Currently set to **test mode** (open read/write for 30 days from project creation).  
Before deploying for real use, change the rules in the Firebase console → Realtime Database → Rules to restrict write access (e.g. require authentication or a secret key).
