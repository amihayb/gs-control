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

```json
{ "type": "runProgram", "program": "Ankle", "ts": 1722031234567 }
{ "type": "stop",        "ts": 1722031234567 }
{ "type": "emergencyStop", "ts": 1722031234567 }
```

`program` must match a label in `USER_PROGRAMS` (e.g. `"Ankle"`, `"Squat"`, `"Hip Gap"`).  
`ts` is `Date.now()` — it must change on every press so Firebase fires the listener.

### Database security rules

Currently set to **test mode** (open read/write for 30 days from project creation).  
Before deploying for real use, change the rules in the Firebase console → Realtime Database → Rules to restrict write access (e.g. require authentication or a secret key).
