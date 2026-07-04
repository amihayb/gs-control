# MANUAL_NOTES.md

## ZK-USB-CAN-1 notes

- On Windows, the adapter is installed as a USB serial COM port.
- It is controlled through ASCII commands over the COM port.
- The protocol is based on CiA 309-3 ASCII mapping.
- The CAN bitrate is configured with the `init <index>` command.
- `init 0` means 1000 kbit/s / 1 Mbit/s CAN.
- SDO read command format:

```text
<node> r <index> <subindex> <datatype>
```

- SDO write command format:

```text
<node> w <index> <subindex> <datatype> <value>
```

- Relevant datatypes:
  - `i8` = SIGNED8
  - `i32` = SIGNED32
  - `u16` = UNSIGNED16
  - `u32` = UNSIGNED32

## PD6-E-M CANopen notes

- `0x6040:00` Controlword
- `0x6041:00` Statusword
- `0x6060:00` Modes of operation
- `0x6064:00` Position actual value
- `0x607A:00` Target position

For Profile Position mode, set:

```text
<node> w 0x6060 0 i8 1
```

A practical absolute move uses:

```text
<node> w 0x607A 0 i32 <target_position>
<node> w 0x6040 0 u16 0x0F
<node> w 0x6040 0 u16 0x3F
```

## Project-specific validated setup

- COM selection is done by the browser Web Serial picker.
- Browser serial baud rate: 115200.
- CAN speed: 1 Mbit/s using `init 0`.
- Nodes: 1 and 2.
- Position polling: `0x6064:00` as `i32`.
- Velocity feedback (`0x606C`) is in **ticks/min** on this hardware. Display conversion: `deg/s = raw × TICS2DEG × 60`.
- Profile velocity (`0x6081`) expects **ticks/min**. Write conversion: `ticks/min = round(deg/s / (TICS2DEG × 60))`. Example: 15 °/s → 396.
