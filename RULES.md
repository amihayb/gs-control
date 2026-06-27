# RULES.md

## Project target

This project is a browser-only Web Serial API control panel for two Nanotec PD6-E-M integrated motors over CANopen using a Nanotec ZK-USB-CAN-1 adapter on Windows.

Do not convert this project to Node.js, Electron, PCAN, SocketCAN, or IXXAT unless explicitly requested.

## Hardware assumptions

- Adapter: Nanotec ZK-USB-CAN-1.
- OS: Windows.
- Browser: Chrome or Edge.
- Transport from browser to adapter: Web Serial API.
- The adapter appears in Windows as a USB serial COM port.
- Motor 1 CANopen node ID: 1.
- Motor 2 CANopen node ID: 2.
- CAN bitrate: 1 Mbit/s.
- ZK adapter command for 1 Mbit/s CAN: `init 0`.

## Critical distinction

The Web Serial port baud rate is not the CAN bitrate.

Use:

```js
await port.open({ baudRate: 115200 });
```

for the browser-to-adapter virtual serial connection.

Use:

```text
init 0
```

to set the adapter's CAN side to 1 Mbit/s.

Do not change `baudRate: 115200` to represent CAN speed.

## Protocol

The ZK-USB-CAN-1 is controlled by ASCII commands based on CiA 309-3 ASCII mapping.

Use explicit SDO read/write commands:

```text
<node> r <index> <subindex> <datatype>
<node> w <index> <subindex> <datatype> <value>
```

Examples:

```text
1 r 0x6064 0 i32
1 w 0x607A 0 i32 10000
```

## Safety and shutdown

Always try to disable both motors on:

- Disconnect
- Error path
- UI shutdown path
- Any future emergency-stop path

Minimum disable sequence:

```text
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x00
```

Do not remove this behavior.

The only exception is a hard browser/process/PC/power failure, where JavaScript cannot run cleanup code.

## Motor enable sequence

Use the known working sequence:

```text
<node> start
<node> w 0x6040 0 u16 0x80
<node> w 0x6060 0 i8 1
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

This sets Profile Position mode and enables operation.

## Absolute move sequence

Use the known working sequence:

```text
<node> w 0x607A 0 i32 <target_position>
<node> w 0x6040 0 u16 0x0F
<node> w 0x6040 0 u16 0x3F
```

This writes target position, clears controlword bit 4, then applies the start-move rising edge.

## Known object dictionary entries

Only use these entries unless verified in the manuals:

| Object | Type | Meaning |
|---|---:|---|
| `0x6040:00` | `u16` | Controlword |
| `0x6041:00` | `u16` | Statusword |
| `0x6060:00` | `i8` | Modes of operation |
| `0x6061:00` | `i8` | Modes of operation display |
| `0x6064:00` | `i32` | Position actual value (ticks) |
| `0x607A:00` | `i32` | Target position (ticks) |
| `0x606C:00` | `i32` | Velocity actual value |
| `0x6077:00` | `i16` | Torque actual value (‰ of rated) |
| `0x6075:00` | `u32` | Motor rated current (mA) |
| `0x6098:00` | `i8` | Homing method |
| `0x607C:00` | `i32` | Home offset |
| `0x1010:06` | `u32` | Store motion/home parameters to NVM (`0x65766173`) |
| `0x603F:00` | `u16` | Error code |

Do not invent object indexes, data types, bit meanings, or drive-specific behavior.

## Unit conversion

```js
TICS2DEG  = 6.3178e-04   // encoder ticks → degrees (display only)
MAX_TICKS = 20000         // hard travel limit ± on both axes
```

Current in Amps (from torque actual and rated current):

```js
actual_A = (torque_actual_i16 / 1000) × (rated_current_mA / 1000)
```

`rated_current_mA` is read from `0x6075` at connect time; default fallback is 6900 mA.

## Code organization

Keep responsibilities separated:

- `src/nanotec-canopen.js`: low-level serial, command, CANopen object read/write, enable/disable/move, homing, NVM save.
- `src/app.js`: UI state and event handlers, polling loop, unit conversion (ticks ↔ degrees, per-mille → Amps).
- `src/panelUI.js`: dynamically builds the Movement Control sliding panel.
- `src/index.html`: layout only.

Do not mix UI rendering deeply into `nanotec-canopen.js`.

## Browser limitations

Web Serial requires:

- Chrome or Edge.
- `http://localhost` or HTTPS.
- A user gesture to select the COM port.

Do not try to auto-open COM10 without user selection; browsers do not allow this.
