# COMMANDS.md

Known working commands for:

- Adapter: Nanotec ZK-USB-CAN-1
- Transport: Windows COM port, ASCII command protocol (CiA 309-3 style)
- CANopen bitrate: 1 Mbit/s
- Drives: Nanotec PD6-E-M / PD6-EB80SD-MS-65-2
- Nodes used in this project: `1` and `2`

The ZK adapter is opened as a Windows serial COM port, but the COM-port baudrate is **not** the CAN bitrate. The CAN bitrate is set with `init`.

---

## 1. ZK-USB-CAN-1 adapter commands

### Initialize CAN at 1 Mbit/s

```text
init 0
```

Baudrate table:

```text
init -1   # stop bus
init 0    # 1000 kbit/s
init 1    # 800 kbit/s
init 2    # 500 kbit/s
init 3    # 250 kbit/s
init 4    # 125 kbit/s
init 5    # 100 kbit/s
init 6    # 50 kbit/s
init 7    # 20 kbit/s
init 8    # 10 kbit/s
```

### Reduce unsolicited CAN messages

```text
set notification 0
```

Notification modes:

```text
set notification 0   # no raw CAN messages
set notification 1   # default: only non-SDO raw messages
set notification 2   # all received raw messages
set notification 3   # all received and sent raw messages
```

### Adapter / bus diagnostics

```text
info name
info version
info state
info tick
info CAN_ERR
```

Expected when initialized at 1 Mbit/s:

```text
info state
state:0
```

### Read adapter information

These use node `0`, which addresses the adapter itself.

```text
0 r 0x1009 0 vs    # adapter hardware version
0 r 0x100A 0 vs    # adapter firmware version
0 r 0x4040 0 vs    # adapter serial number
```

### NMT node commands

```text
<node> start        # NMT Operational
<node> stop         # NMT Stopped
<node> preop        # NMT Pre-operational
<node> reset node   # reset drive node
<node> reset comm   # reset drive communication
```

Examples:

```text
1 start
2 start
1 preop
2 reset node
```

---

## 2. ZK ASCII SDO syntax

### Read object

```text
<node> r <index> <subindex> <datatype>
```

Example:

```text
1 r 0x6064 0 i32
```

### Write object

```text
<node> w <index> <subindex> <datatype> <value>
```

Example:

```text
1 w 0x607A 0 i32 10000
```

### Datatypes

```text
i8    SIGNED8
i16   SIGNED16
i32   SIGNED32
u8    UNSIGNED8
u16   UNSIGNED16
u32   UNSIGNED32
vs    Visual String
os    Octet String, base64
d     Domain, base64
```

---

## 3. Common read commands

Use these for both node `1` and node `2`.

### Position feedback

```text
<node> r 0x6064 0 i32    # Position Actual Value
<node> r 0x6063 0 i32    # Position Actual Internal Value
<node> r 0x6062 0 i32    # Position Demand Value
<node> r 0x60FC 0 i32    # Position Demand Internal Value
<node> r 0x60F4 0 i32    # Following Error Actual Value
```

Examples:

```text
1 r 0x6064 0 i32
2 r 0x6064 0 i32
```

### Velocity feedback

```text
<node> r 0x606C 0 i32    # Velocity Actual Value
<node> r 0x606B 0 i32    # Velocity Demand Value
```

> **Unit note (validated on this hardware):** `0x606C` returns values in ticks/min.
> To convert to °/s: `deg_per_s = raw × TICS2DEG × 60`

Velocity-mode-specific CiA 402 objects:

```text
<node> r 0x6044 0 i16    # VL Velocity Actual Value
<node> r 0x6043 0 i16    # VL Velocity Demand
```

### Torque / current-related feedback

There is no direct "actual current in amps" object in the currently used command list. Use torque/current-related objects:

```text
<node> r 0x6077 0 i16    # Torque Actual Value, thousandths of rated torque/current
<node> r 0x6074 0 i16    # Torque Demand, thousandths of rated torque/current
<node> r 0x6075 0 u32    # Motor Rated Current, mA
<node> r 0x6073 0 u16    # Max Current, thousandths of rated current
```

Approximate current in Amps from torque actual:

```text
actual_A = (torque_actual_i16 / 1000) × (rated_current_mA / 1000)
```

Where `rated_current_mA` = value of `0x6075` in mA (e.g. 6900 for a 6.9 A motor).

Example: if `6077 = 500` and `6075 = 6900`, then `actual_A = 0.5 × 6.9 = 3.45 A`.

### Drive state / diagnostics

```text
<node> r 0x6041 0 u16    # Statusword
<node> r 0x6040 0 u16    # Controlword
<node> r 0x6060 0 i8     # Modes Of Operation command
<node> r 0x6061 0 i8     # Modes Of Operation Display
<node> r 0x603F 0 u16    # Error Code
<node> r 0x1001 0 u8     # Error Register
<node> r 0x1003 0 u8     # Number of errors in Pre-defined Error Field
```

### Digital I/O

```text
<node> r 0x60FD 0 u32    # Digital Inputs
<node> r 0x60FE 1 u32    # Digital Outputs physical outputs
<node> r 0x60FE 2 u32    # Digital Outputs bit mask
```

### Identity / device info

```text
<node> r 0x1000 0 u32    # Device Type
<node> r 0x1008 0 vs     # Manufacturer Device Name
<node> r 0x1009 0 vs     # Manufacturer Hardware Version
<node> r 0x100A 0 vs     # Manufacturer Software Version
<node> r 0x1018 1 u32    # Vendor ID
<node> r 0x1018 2 u32    # Product Code
<node> r 0x1018 3 u32    # Revision Number
<node> r 0x1018 4 u32    # Serial Number
<node> r 0x4040 0 vs     # Drive Serial Number, Nanotec object
<node> r 0x4041 0 u32    # Device ID
<node> r 0x6503 0 vs     # Drive Catalogue Number
```

---

## 4. Enable / disable motor

### Enable one motor

Use this sequence before commanding motion.

```text
<node> start
<node> w 0x6040 0 u16 0x80    # fault reset
<node> w 0x6040 0 u16 0x06    # shutdown
<node> w 0x6040 0 u16 0x07    # switch on
<node> w 0x6040 0 u16 0x0F    # enable operation
```

### Enable both motors

```text
1 start
2 start

1 w 0x6040 0 u16 0x80
2 w 0x6040 0 u16 0x80

1 w 0x6040 0 u16 0x06
2 w 0x6040 0 u16 0x06

1 w 0x6040 0 u16 0x07
2 w 0x6040 0 u16 0x07

1 w 0x6040 0 u16 0x0F
2 w 0x6040 0 u16 0x0F
```

### Disable one motor

```text
<node> w 0x6040 0 u16 0x06    # disable operation / shutdown
<node> w 0x6040 0 u16 0x00    # switch off
```

### Disable both motors

```text
1 w 0x6040 0 u16 0x06
2 w 0x6040 0 u16 0x06

1 w 0x6040 0 u16 0x00
2 w 0x6040 0 u16 0x00
```

### Quick stop / halt-related controlword commands

Use carefully and test on the actual system.

```text
<node> w 0x6040 0 u16 0x02    # quick stop command pattern
<node> w 0x6040 0 u16 0x010F  # halt bit set while operation enabled
<node> w 0x6040 0 u16 0x000F  # halt bit cleared while operation enabled
```

---

## 5. Modes of operation

Common CiA 402 mode values used by PD6-E-M:

```text
0x6060 = 1     # Profile Position Mode
0x6060 = 2     # Velocity Mode
0x6060 = 3     # Profile Velocity Mode
0x6060 = 4     # Profile Torque Mode
0x6060 = 6     # Homing Mode
0x6060 = 7     # Interpolated Position Mode
0x6060 = 8     # Cyclic Synchronous Position
0x6060 = 9     # Cyclic Synchronous Velocity
0x6060 = 10    # Cyclic Synchronous Torque
```

Read actual active mode:

```text
<node> r 0x6061 0 i8
```

---

## 6. Profile Position mode

### Switch to Profile Position mode

```text
<node> w 0x6060 0 i8 1
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

### Set profile position limits/ramp values

```text
<node> w 0x6081 0 u32 <profile_velocity>       # Profile Velocity
<node> w 0x6083 0 u32 <profile_acceleration>   # Profile Acceleration
<node> w 0x6084 0 u32 <profile_deceleration>   # Profile Deceleration
<node> w 0x6085 0 u32 <quick_stop_deceleration>
<node> w 0x6086 0 i16 0                         # Motion Profile Type: 0 = trapezoidal
<node> w 0x6086 0 i16 3                         # Motion Profile Type: 3 = jerk-limited
```

> **Unit note (validated on this hardware):** `0x6081` expects ticks/min.
> To convert from °/s: `ticks_per_min = round(deg_per_s / (TICS2DEG × 60))`
> Example: 15 °/s → `round(15 / (6.3178e-04 × 60))` = 396

### Absolute move

```text
<node> w 0x607A 0 i32 <target_position>
<node> w 0x6040 0 u16 0x0F
<node> w 0x6040 0 u16 0x3F
```

Examples:

```text
1 w 0x607A 0 i32 10000
1 w 0x6040 0 u16 0x0F
1 w 0x6040 0 u16 0x3F

2 w 0x607A 0 i32 -7000
2 w 0x6040 0 u16 0x0F
2 w 0x6040 0 u16 0x3F
```

### Move both axes to 0

```text
1 w 0x607A 0 i32 0
2 w 0x607A 0 i32 0

1 w 0x6040 0 u16 0x0F
2 w 0x6040 0 u16 0x0F

1 w 0x6040 0 u16 0x3F
2 w 0x6040 0 u16 0x3F
```

### Read whether target reached

```text
<node> r 0x6041 0 u16
```

Check bit 10 of statusword (`0x0400`) for target reached.

---

## 7. Profile Velocity mode

Recommended for velocity commands with acceleration/deceleration ramps.

### Switch one node to Profile Velocity mode

```text
<node> w 0x6060 0 i8 3
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

### Set velocity ramp limits

```text
<node> w 0x6083 0 u32 <profile_acceleration>    # acceleration
<node> w 0x6084 0 u32 <profile_deceleration>    # deceleration
<node> w 0x6085 0 u32 <quick_stop_deceleration>
<node> w 0x607F 0 u32 <max_profile_velocity>
<node> w 0x6080 0 u32 <max_motor_speed>
<node> w 0x6086 0 i16 0                         # 0 = trapezoidal ramp
```

### Command target velocity

```text
<node> w 0x60FF 0 i32 <target_velocity>
```

Examples:

```text
1 w 0x6060 0 i8 3
1 w 0x6040 0 u16 0x06
1 w 0x6040 0 u16 0x07
1 w 0x6040 0 u16 0x0F
1 w 0x60FF 0 i32 5000
```

Reverse direction:

```text
1 w 0x60FF 0 i32 -5000
```

Stop with ramp:

```text
1 w 0x60FF 0 i32 0
```

### Read velocity feedback

```text
<node> r 0x606C 0 i32    # Velocity Actual Value
<node> r 0x606B 0 i32    # Velocity Demand Value
<node> r 0x60FF 0 i32    # Target Velocity
```

---

## 8. Velocity Mode (VL mode)

Velocity Mode is the older CiA 402 velocity mode. For new UI functions, prefer Profile Velocity mode unless there is a reason to use VL mode.

### Switch to Velocity Mode

```text
<node> w 0x6060 0 i8 2
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

### Command VL target velocity

```text
<node> w 0x6042 0 i16 <vl_target_velocity>
```

Examples:

```text
1 w 0x6060 0 i8 2
1 w 0x6040 0 u16 0x06
1 w 0x6040 0 u16 0x07
1 w 0x6040 0 u16 0x0F
1 w 0x6042 0 i16 1000
```

Stop:

```text
1 w 0x6042 0 i16 0
```

### Read VL velocity values

```text
<node> r 0x6042 0 i16    # VL Target Velocity
<node> r 0x6043 0 i16    # VL Velocity Demand
<node> r 0x6044 0 i16    # VL Velocity Actual Value
```

### VL acceleration/deceleration objects

These are records/arrays; subindices are used.

```text
<node> r 0x6048 1 u32    # VL Velocity Acceleration delta speed
<node> r 0x6048 2 u16    # VL Velocity Acceleration delta time
<node> r 0x6049 1 u32    # VL Velocity Deceleration delta speed
<node> r 0x6049 2 u16    # VL Velocity Deceleration delta time
<node> r 0x604A 1 u32    # VL Quick Stop delta speed
<node> r 0x604A 2 u16    # VL Quick Stop delta time
```

Write examples:

```text
<node> w 0x6048 1 u32 <delta_speed>
<node> w 0x6048 2 u16 <delta_time>
<node> w 0x6049 1 u32 <delta_speed>
<node> w 0x6049 2 u16 <delta_time>
```

---

## 9. Profile Torque mode

Only use if the system is configured for closed-loop torque operation and the mechanical system is safe for torque control.

### Switch to Profile Torque mode

```text
<node> w 0x6060 0 i8 4
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

### Command target torque

Torque values are thousandths of rated torque/current:

```text
<node> w 0x6071 0 i16 <target_torque>
<node> w 0x6087 0 u32 <torque_slope>
```

Examples:

```text
1 w 0x6071 0 i16 100     # about 10%
1 w 0x6071 0 i16 -100    # about -10%
1 w 0x6071 0 i16 0       # zero torque command
```

### Read torque feedback

```text
<node> r 0x6071 0 i16    # Target Torque
<node> r 0x6074 0 i16    # Torque Demand
<node> r 0x6077 0 i16    # Torque Actual Value
<node> r 0x6072 0 u16    # Max Torque
<node> r 0x6073 0 u16    # Max Current
<node> r 0x6075 0 u32    # Motor Rated Current, mA
```

---

## 10. Homing mode

Use only after defining the required homing method and wiring/configuring switches if needed.

### Switch to Homing mode

```text
<node> w 0x6060 0 i8 6
<node> w 0x6040 0 u16 0x06
<node> w 0x6040 0 u16 0x07
<node> w 0x6040 0 u16 0x0F
```

### Configure homing objects

```text
<node> w 0x6098 0 i8 <homing_method>
<node> w 0x6099 1 u32 <speed_during_search>
<node> w 0x6099 2 u32 <speed_during_zero_search>
<node> w 0x609A 0 u32 <homing_acceleration>
<node> w 0x607C 0 i32 <home_offset>
```

### Start homing

```text
<node> w 0x6040 0 u16 0x001F
```

### Stop / interrupt homing

```text
<node> w 0x6040 0 u16 0x000F
```

Read statusword and check homing bits:

```text
<node> r 0x6041 0 u16
```

---

## 11. Limits, units, and scaling helpers

### Position units

```text
<node> r 0x608F 1 u32    # Position Encoder Resolution: encoder increments
<node> r 0x608F 2 u32    # Position Encoder Resolution: motor revolutions
<node> r 0x6091 1 u32    # Gear Ratio: motor shaft revolutions
<node> r 0x6091 2 u32    # Gear Ratio: driving shaft revolutions
<node> r 0x6092 1 u32    # Feed Constant: feed
<node> r 0x6092 2 u32    # Feed Constant: shaft revolutions
<node> r 0x60A8 0 u32    # SI Unit Position
<node> r 0x60A9 0 u32    # SI Unit Velocity
```

### Software limits

```text
<node> r 0x607D 1 i32    # Min Software Position Limit
<node> r 0x607D 2 i32    # Max Software Position Limit

<node> w 0x607D 1 i32 <min_position>
<node> w 0x607D 2 i32 <max_position>
```

### Position range limits

```text
<node> r 0x607B 1 i32    # Min Position Range Limit
<node> r 0x607B 2 i32    # Max Position Range Limit

<node> w 0x607B 1 i32 <min_position>
<node> w 0x607B 2 i32 <max_position>
```

### Polarity

```text
<node> r 0x607E 0 u8     # Polarity
<node> w 0x607E 0 u8 <value>
```

---

## 12. Save / restore parameters

Be careful: these write to non-volatile memory.

### Store parameters

CANopen store parameters object uses the signature `save` = `0x65766173`.

```text
<node> w 0x1010 1 u32 0x65766173    # store all parameters
<node> w 0x1010 6 u32 0x65766173    # store motion / home parameters (used by homing sequence)
```

### Restore defaults

CANopen restore object uses the signature `load` = `0x64616F6C`.

```text
<node> w 0x1011 1 u32 0x64616F6C    # restore all default parameters
```

Usually power-cycle or reset node afterward:

```text
<node> reset node
```

---

## 13. Raw CAN commands through the adapter

Normally do not use these for the UI; prefer the SDO ASCII commands above.

### Write CAN message

```text
wm <cobid> <dataLength> <value1> ... <value8>
```

Example NMT stop all nodes:

```text
wm 0 2 2 0
```

### Send CAN message with hex-only byte values

```text
:< <cobid> <dataLength> <value1> ... <value8>
```

Example:

```text
:< 1F4 5 21 5A 03 01 CA
```

---

## 14. Useful command sequences

### Connect / initialize sequence

```text
init 0
set notification 0
1 start
2 start
```

### Safe UI startup sequence

```text
init 0
set notification 0

1 r 0x1000 0 u32
2 r 0x1000 0 u32

1 r 0x6041 0 u16
2 r 0x6041 0 u16

1 r 0x6064 0 i32
2 r 0x6064 0 i32
```

### Turn motors on in Profile Position mode

```text
1 start
2 start

1 w 0x6040 0 u16 0x80
2 w 0x6040 0 u16 0x80

1 w 0x6060 0 i8 1
2 w 0x6060 0 i8 1

1 w 0x6040 0 u16 0x06
2 w 0x6040 0 u16 0x06

1 w 0x6040 0 u16 0x07
2 w 0x6040 0 u16 0x07

1 w 0x6040 0 u16 0x0F
2 w 0x6040 0 u16 0x0F
```

### Turn motors off

```text
1 w 0x6040 0 u16 0x06
2 w 0x6040 0 u16 0x06

1 w 0x6040 0 u16 0x00
2 w 0x6040 0 u16 0x00
```

### Move to position 0,0

```text
1 w 0x607A 0 i32 0
2 w 0x607A 0 i32 0

1 w 0x6040 0 u16 0x0F
2 w 0x6040 0 u16 0x0F

1 w 0x6040 0 u16 0x3F
2 w 0x6040 0 u16 0x3F
```

### Velocity test on axis 1 using Profile Velocity

```text
1 w 0x6060 0 i8 3
1 w 0x6040 0 u16 0x06
1 w 0x6040 0 u16 0x07
1 w 0x6040 0 u16 0x0F

1 w 0x60FF 0 i32 1000
1 r 0x606C 0 i32

1 w 0x60FF 0 i32 0
```

---

## 15. Common errors

### Adapter internal errors

```text
ERROR: 100   # request not supported
ERROR: 101   # syntax error
ERROR: 102   # request not processed due to internal state
ERROR: 103   # timeout
ERROR 300    # CAN error passive
ERROR 301    # CAN bus off
ERROR: 303   # CAN buffer overflow
ERROR: 304   # CAN init
ERROR: 305   # CAN active at init/start-up
```

### Common causes

```text
ERROR 300
```

Usually means the adapter sees CAN errors. Check:

- drive power is on
- correct CAN bitrate (`init 0` for 1 Mbit/s)
- correct node ID
- CAN_H / CAN_L not swapped
- CAN_GND connected
- termination: 120 ohm at both physical ends only

```text
ERROR: 103
```

Usually means timeout waiting for response. Check:

- node ID
- drive powered and booted
- NMT state
- object index/subindex/datatype
- CAN wiring and termination

### SDO abort examples

```text
0602 0000   # object does not exist
0601 0001   # attempt to read a write-only object
0601 0002   # attempt to write a read-only object
0604 0042   # PDO mapping length would exceed PDO length
```

---

## 16. Notes for application code

- Always disable motors in `disconnect`, `catch`, and `finally` paths.
- Prefer Profile Position mode for point-to-point moves.
- Prefer Profile Velocity mode for velocity commands.
- Polling SDO values at low rate is fine for UI feedback.
- For faster updates, configure TPDOs instead of high-rate SDO polling.
- Keep the low-level command layer small and explicit.
