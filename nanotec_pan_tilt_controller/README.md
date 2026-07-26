# nanotec_pan_tilt_controller

Python driver for Nanotec PD6-E-M pan/tilt motors via the Nanotec ZK-USB-CAN-1 USB-CAN adapter.

## Hardware

| Component | Details |
|---|---|
| USB-CAN adapter | Nanotec ZK-USB-CAN-1 (appears as a Windows COM port) |
| Motor drives | Nanotec PD6-E-M / PD6-EB80SD-MS-65-2 |
| Protocol | CiA 309-3 ASCII command set over serial |
| CAN bitrate | 1 Mbit/s (set by `init 0` on connect) |
| Node IDs | Node 1 = Pitch, Node 2 = Roll |

## Files

| File | Purpose |
|---|---|
| `nanotec_pan_tilt_controller.py` | The driver class — copy this file to your project |
| `COMMANDS.md` | Full reference of ZK-USB-CAN-1 ASCII commands and SDO object list (copy here from the parent project) |

## Installation

Only one dependency is needed:

```bash
pip install pyserial
```

## Quick start

```python
import time
from nanotec_pan_tilt_controller import NanotecPanTiltController, NODE_PITCH, NODE_ROLL

mc = NanotecPanTiltController()
mc.connect("COM10")       # change to your COM port

mc.enable_all()
mc.move_both(5.0, -3.0)  # pitch=5°, roll=-3° at default 15°/s
time.sleep(3)

print(mc.read_all(NODE_PITCH))
# {'position': 5.001, 'speed': 0.0, 'current': 0.23, 'following_error': 2}

mc.go_zero()
time.sleep(3)
mc.disconnect()
```

Run the built-in demo (with a motor physically connected):

```bash
python nanotec_pan_tilt_controller.py
```

## API reference

### Constants

| Name | Value | Meaning |
|---|---|---|
| `NODE_PITCH` | 1 | CANopen node ID for the pitch axis |
| `NODE_ROLL` | 2 | CANopen node ID for the roll axis |
| `TICS2DEG` | 6.3178e-04 | Encoder ticks → degrees |
| `MAX_DEG` | ≈ 12.636 | Hard travel limit in degrees (±) |
| `DEFAULT_COM` | "COM10" | Default COM port |
| `DEFAULT_BAUD` | 115200 | Serial baud rate |

### Unit conventions

| Quantity | Unit in API | Device internal unit | Conversion |
|---|---|---|---|
| Angle | degrees (°) | encoder ticks | `ticks × TICS2DEG` |
| Velocity | degrees/second | device ticks* | `raw × TICS2DEG × 60` |
| Current | Amps (A) | per-mille of rated | `(raw/1000) × (rated_mA/1000)` |
| Rated current | milliamps (mA) | mA | no conversion |

*The velocity formula `× TICS2DEG × 60` is empirically validated on this hardware and matches the JS control panel project.

---

### Connection

#### `connect(com_port, baud_rate)`
Open the serial port and initialise the adapter (`init 0` + `set notification 0`).

#### `disconnect()`
Disable all motors and close the serial port safely.

---

### Motor enable / disable

#### `enable(node)`
Run the full CiA 402 state-machine sequence: NMT operational → fault reset → Profile Position mode → enable operation.

#### `disable(node)`
Send shutdown then switch-off commands to a node.

#### `enable_all()` / `disable_all()`
Convenience methods that call `enable` / `disable` for both pitch and roll nodes.

---

### NMT control

#### `nmt_start(node)` / `nmt_stop(node)` / `nmt_preop(node)`
Send NMT state-change commands.

#### `nmt_reset(node)`
Full node reset (`<node> reset node`).

#### `nmt_reset_comm(node)`
Reset node communication (`<node> reset comm`).

---

### Operating modes

#### `set_mode_position(node)` — mode 1
#### `set_mode_velocity(node)` — mode 3
#### `set_mode_torque(node)` — mode 4
#### `set_mode_homing(node)` — mode 6
Switch to a CiA 402 operating mode.

#### `read_mode(node)` → int
Read the currently active mode from the display object (0x6061).

---

### Profile Position motion

#### `move_abs(node, degrees, velocity_deg_s=15.0)`
Move one node to an absolute angle. Angle is clamped to ±`MAX_DEG` automatically.

#### `move_both(pitch_deg, roll_deg, velocity_deg_s=15.0)`
Move both axes. Both motors start moving immediately (not waiting for the first to finish).

#### `go_zero(velocity_deg_s=15.0)`
Send both axes to 0°.

#### `quick_stop(node)` / `quick_stop_all()`
Apply quick stop (0x6040 = 0x02).

#### `halt(node)` / `unhalt(node)`
Set / clear the halt bit while the node stays enabled.

---

### Motion profile parameters

#### `set_profile_velocity(node, deg_s)`
Write the profile velocity (0x6081) independently of a move command.

#### `set_profile_acceleration(node, value)` / `set_profile_deceleration(node, value)`
Write acceleration / deceleration ramp (0x6083 / 0x6084) in device units.

#### `set_quick_stop_decel(node, value)`
Write quick stop deceleration (0x6085).

#### `set_motion_profile_type(node, type_val)`
0 = trapezoidal (default), 3 = jerk-limited / S-curve (0x6086).

---

### Profile Velocity mode (continuous motion)

#### `set_target_velocity(node, deg_s)`
Command a continuous velocity (0x60FF). Call `set_mode_velocity()` + `enable()` first. Negative value reverses direction.

#### `stop_velocity(node)`
Ramp velocity to zero using the deceleration ramp.

---

### Homing

#### `set_homing_method(node, method=35)`
Write 0x6098. Method 35 = "current position as home" (no movement).

#### `set_home_offset(node, ticks)`
Write 0x607C in encoder ticks.

#### `start_homing(node)` / `stop_homing(node)`
Start / interrupt the homing procedure.

---

### Software limits

#### `set_software_limits(node, min_deg, max_deg)`
Write 0x607D:1 and :2 in degrees (converted to ticks internally).

#### `read_software_limits(node)` → `(min_deg, max_deg)`
Read 0x607D:1 and :2 and return as degrees.

---

### Position feedback

| Method | Object | Returns |
|---|---|---|
| `read_position(node)` | 0x6064 | Actual position, ° |
| `read_position_demand(node)` | 0x6062 | Position demand, ° |
| `read_position_internal(node)` | 0x6063 | Internal actual value, ° |
| `read_following_error(node)` | 0x60F4 | Following error, encoder ticks |

---

### Velocity feedback

| Method | Object | Returns |
|---|---|---|
| `read_speed(node)` | 0x606C | Actual velocity, °/s |
| `read_velocity_demand(node)` | 0x606B | Velocity demand, °/s |

---

### Current / torque feedback

| Method | Object | Returns |
|---|---|---|
| `read_current(node)` | 0x6077 + 0x6075 | Actual current, A |
| `read_torque_demand(node)` | 0x6074 + 0x6075 | Torque demand, A |
| `read_rated_current(node)` | 0x6075 | Rated current, mA |
| `read_max_current(node)` | 0x6073 | Max current, per-mille |

---

### Combined feedback

#### `read_all(node)` → dict
Returns `{"position": °, "speed": °/s, "current": A, "following_error": ticks}`.

---

### Drive diagnostics

| Method | Object | Returns |
|---|---|---|
| `read_statusword(node)` | 0x6041 | CiA 402 statusword (int) |
| `read_controlword(node)` | 0x6040 | CiA 402 controlword (int) |
| `read_error_code(node)` | 0x603F | Last error code (int) |
| `read_error_register(node)` | 0x1001 | Error register byte (int) |
| `read_digital_inputs(node)` | 0x60FD | Digital input bitmask (int) |
| `read_digital_outputs(node)` | 0x60FE:1 | Digital output bitmask (int) |
| `read_polarity(node)` | 0x607E | Polarity byte (int) |
| `set_polarity(node, value)` | 0x607E | Write polarity |

---

### Device identity

#### `read_device_info(node)` → dict
Returns `{device_type, hardware_version, firmware_version, vendor_id, product_code, revision_number, serial_number}`.

#### `read_drive_serial(node)` → str
Nanotec drive serial number (0x4040).

#### `read_catalogue_number(node)` → str
Nanotec catalogue number (0x6503).

---

### Controller gains (Nanotec proprietary)

#### `read_gains(node)` → dict
Returns `{pos_kp, vel_kp, vel_ti, cur_kp_iq, cur_ki_iq, cur_kp_id, cur_ki_id}`.

#### `write_gains(node, pos_kp=None, vel_kp=None, vel_ti=None, cur_kp=None, cur_ki=None)`
Write only the gains you pass (None = skip). `cur_kp` and `cur_ki` are written to both Iq and Id channels.

---

### Save / restore

#### `save_parameters(node, subindex=1)`
Write the CANopen "save" signature to 0x1010. Common subindex values: 1 (all), 6 (motion/home).

#### `save_home_parameters(node)`
Shortcut for `save_parameters(node, subindex=6)`.

#### `restore_defaults(node)`
Write the "load" signature to 0x1011:1. Usually requires a node reset afterward.

---

### Adapter diagnostics

#### `adapter_info()` → dict
Sends `info name`, `info version`, `info state` to the adapter and returns the responses.

---

### Low-level primitives

These are intended for advanced use or debugging.

#### `_cmd(s, timeout=1.0, poll_interval=0.002)` → list[str]
Send any raw ASCII command string, return response lines. Polls every `poll_interval` seconds (default 2 ms) until the adapter replies, so responses arrive as fast as the hardware allows rather than after a fixed delay. Raises `RuntimeError` if no response arrives within `timeout` seconds.

#### `_write(node, index, sub, dtype, value)` → list[str]
SDO write: `<node> w <index> <sub> <dtype> <value>`.

#### `_read(node, index, sub, dtype)` → float
SDO read: `<node> r <index> <sub> <dtype>`. Parses the numeric value from the response. Raises `RuntimeError` on an ERROR response or if no number is found.

#### `_read_str(node, index, sub)` → str
SDO read for Visual String (`vs`) objects (e.g. serial numbers). Returns the raw response text.

---

## Error handling

- `_read()` raises `RuntimeError` if the device responds with `ERROR: ...` or if no numeric value can be extracted.
- `disconnect()` always attempts to disable motors even if an error occurs.
- Always call `disconnect()` (or use a `try/finally` block) to leave motors in a safe state.

```python
from nanotec_pan_tilt_controller import NanotecPanTiltController

mc = NanotecPanTiltController()
mc.connect("COM10")
try:
    mc.enable_all()
    mc.move_both(5.0, 0.0)
    time.sleep(3)
finally:
    mc.disconnect()
```
