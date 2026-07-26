"""
nanotec_pan_tilt_controller.py — Standalone Python driver for Nanotec PD6-E-M pan/tilt motors.

Hardware:
    Adapter : Nanotec ZK-USB-CAN-1 (USB → CAN, appears as a Windows COM port)
    Drives  : Nanotec PD6-E-M (CANopen CiA 402)
    Protocol: CiA 309-3 ASCII command set

All public angle inputs and outputs are in degrees.
All velocity inputs and outputs are in degrees/second.
Current outputs are in Amps.

Dependency: pyserial  (pip install pyserial)
"""

import re
import time

import serial

# ── Module-level constants ────────────────────────────────────────────────────

NODE_PITCH   = 1               # CANopen node ID for the pitch axis
NODE_ROLL    = 2               # CANopen node ID for the roll axis

TICS2DEG     = 6.3178e-04      # encoder ticks → degrees  (matches JS project)
MAX_DEG      = 20000 * TICS2DEG  # ≈ 12.636°  hard travel limit (±)

DEFAULT_COM  = "COM10"
DEFAULT_BAUD = 115200

# CiA 402 modes of operation (0x6060)
MODE_PROFILE_POSITION  = 1
MODE_VELOCITY          = 2
MODE_PROFILE_VELOCITY  = 3
MODE_PROFILE_TORQUE    = 4
MODE_HOMING            = 6

# CANopen "save all parameters" magic word written to 0x1010
_SAVE_SIGNATURE    = 0x65766173   # ASCII "save"
_RESTORE_SIGNATURE = 0x64616F6C   # ASCII "load"


# ── Helper ────────────────────────────────────────────────────────────────────

def _deg_to_ticks(degrees: float) -> int:
    """Convert degrees to encoder ticks (rounds to nearest integer)."""
    return round(degrees / TICS2DEG)


def _ticks_to_deg(ticks: float) -> float:
    """Convert encoder ticks to degrees."""
    return ticks * TICS2DEG


def _vel_deg_s_to_ticks(deg_s: float) -> int:
    """
    Convert velocity from °/s to the device velocity unit used by 0x6081 / 0x60FF.
    Formula validated against the JS project on the actual hardware:
        ticks = round(deg_s / (TICS2DEG * 60))
    """
    return round(deg_s / (TICS2DEG * 60))


def _vel_ticks_to_deg_s(raw: float) -> float:
    """
    Convert device velocity (0x606C / 0x606B) to °/s.
    Formula validated against the JS project on the actual hardware:
        deg_s = raw * TICS2DEG * 60
    """
    return raw * TICS2DEG * 60


# ── Main class ────────────────────────────────────────────────────────────────

class NanotecPanTiltController:
    """
    High-level Python driver for a Nanotec ZK-USB-CAN-1 + PD6-E-M pan/tilt system.

    Wraps the CiA 309-3 ASCII serial protocol. All public methods use degrees,
    degrees/second, and Amps. Internal tick conversions are handled automatically.

    Usage::

        mc = NanotecPanTiltController()
        mc.connect("COM10")
        mc.enable_all()
        mc.move_both(5.0, -3.0)
        time.sleep(3)
        print(mc.read_all(NODE_PITCH))
        mc.go_zero()
        time.sleep(3)
        mc.disconnect()
    """

    def __init__(self) -> None:
        self._ser: serial.Serial | None = None

    # ═══════════════════════════════════════════════════════════════════════════
    # Connection
    # ═══════════════════════════════════════════════════════════════════════════

    def connect(self, com_port: str = DEFAULT_COM, baud_rate: int = DEFAULT_BAUD) -> None:
        """
        Open the serial port and initialise the CAN adapter.

        Sends ``init 0`` (1 Mbit/s CAN bus) and ``set notification 0``
        (suppress unsolicited CAN frames).
        """
        self._ser = serial.Serial(com_port, baudrate=baud_rate, timeout=1)
        self._cmd("init 0")
        self._cmd("set notification 0")

    def disconnect(self) -> None:
        """Disable all motors and close the serial port safely."""
        try:
            self.disable_all()
        except Exception:
            pass
        if self._ser and self._ser.is_open:
            self._ser.close()
        self._ser = None

    # ═══════════════════════════════════════════════════════════════════════════
    # Motor enable / disable
    # ═══════════════════════════════════════════════════════════════════════════

    def enable(self, node: int) -> None:
        """
        Enable a single motor node using the CiA 402 state-machine sequence:
        NMT operational → fault reset → Profile Position mode → enable operation.
        """
        self._cmd(f"{node} start")
        self._write(node, "0x6040", 0, "u16", 0x80)   # fault reset
        self._write(node, "0x6060", 0, "i8",  1)       # Profile Position mode
        self._write(node, "0x6040", 0, "u16", 0x06)   # shutdown
        self._write(node, "0x6040", 0, "u16", 0x07)   # switch on
        self._write(node, "0x6040", 0, "u16", 0x0F)   # enable operation

    def disable(self, node: int) -> None:
        """Disable a single motor node (shutdown then switch off)."""
        self._write(node, "0x6040", 0, "u16", 0x06)   # shutdown / disable operation
        self._write(node, "0x6040", 0, "u16", 0x00)   # switch off

    def enable_all(self) -> None:
        """Enable both the pitch and roll motor nodes."""
        for node in (NODE_PITCH, NODE_ROLL):
            self.enable(node)

    def disable_all(self) -> None:
        """Disable both the pitch and roll motor nodes."""
        for node in (NODE_PITCH, NODE_ROLL):
            self.disable(node)

    # ═══════════════════════════════════════════════════════════════════════════
    # NMT control
    # ═══════════════════════════════════════════════════════════════════════════

    def nmt_start(self, node: int) -> None:
        """Send NMT 'Operational' command to a node."""
        self._cmd(f"{node} start")

    def nmt_stop(self, node: int) -> None:
        """Send NMT 'Stopped' command to a node."""
        self._cmd(f"{node} stop")

    def nmt_preop(self, node: int) -> None:
        """Send NMT 'Pre-operational' command to a node."""
        self._cmd(f"{node} preop")

    def nmt_reset(self, node: int) -> None:
        """Send NMT 'Reset node' command (full drive reset)."""
        self._cmd(f"{node} reset node")

    def nmt_reset_comm(self, node: int) -> None:
        """Send NMT 'Reset communication' command."""
        self._cmd(f"{node} reset comm")

    # ═══════════════════════════════════════════════════════════════════════════
    # Operating modes
    # ═══════════════════════════════════════════════════════════════════════════

    def set_mode_position(self, node: int) -> None:
        """Switch the node to CiA 402 Profile Position mode (0x6060 = 1)."""
        self._write(node, "0x6060", 0, "i8", MODE_PROFILE_POSITION)

    def set_mode_velocity(self, node: int) -> None:
        """Switch the node to CiA 402 Profile Velocity mode (0x6060 = 3)."""
        self._write(node, "0x6060", 0, "i8", MODE_PROFILE_VELOCITY)

    def set_mode_torque(self, node: int) -> None:
        """Switch the node to CiA 402 Profile Torque mode (0x6060 = 4)."""
        self._write(node, "0x6060", 0, "i8", MODE_PROFILE_TORQUE)

    def set_mode_homing(self, node: int) -> None:
        """Switch the node to CiA 402 Homing mode (0x6060 = 6)."""
        self._write(node, "0x6060", 0, "i8", MODE_HOMING)

    def read_mode(self, node: int) -> int:
        """Return the currently active mode of operation (reads 0x6061 display object)."""
        return int(self._read(node, "0x6061", 0, "i8"))

    # ═══════════════════════════════════════════════════════════════════════════
    # Profile Position motion
    # ═══════════════════════════════════════════════════════════════════════════

    def move_abs(self, node: int, degrees: float, velocity_deg_s: float = 15.0) -> None:
        """
        Move a single node to an absolute position in degrees.

        The angle is clamped to ±MAX_DEG before sending. The profile velocity
        is set for this move; the drive uses its stored acceleration/deceleration
        ramps unless you call set_profile_acceleration / set_profile_deceleration.
        """
        clamped = max(-MAX_DEG, min(MAX_DEG, degrees))
        ticks   = _deg_to_ticks(clamped)
        vel     = max(1, _vel_deg_s_to_ticks(velocity_deg_s))
        self._write(node, "0x6081", 0, "u32", vel)     # profile velocity
        self._write(node, "0x607A", 0, "i32", ticks)   # target position
        self._write(node, "0x6040", 0, "u16", 0x0F)   # bit 4 low
        self._write(node, "0x6040", 0, "u16", 0x3F)   # bit 4 rising edge → start move

    def move_both(self, pitch_deg: float, roll_deg: float, velocity_deg_s: float = 15.0) -> None:
        """
        Move pitch and roll axes simultaneously.

        Each axis receives its command immediately after the other; both motors
        begin moving without waiting for the first to finish.
        """
        self.move_abs(NODE_PITCH, pitch_deg, velocity_deg_s)
        self.move_abs(NODE_ROLL,  roll_deg,  velocity_deg_s)

    def go_zero(self, velocity_deg_s: float = 15.0) -> None:
        """Send both axes to 0°."""
        self.move_both(0.0, 0.0, velocity_deg_s)

    def quick_stop(self, node: int) -> None:
        """Apply quick stop to a single node (0x6040 = 0x02)."""
        self._write(node, "0x6040", 0, "u16", 0x02)

    def quick_stop_all(self) -> None:
        """Apply quick stop to both pitch and roll nodes."""
        for node in (NODE_PITCH, NODE_ROLL):
            self.quick_stop(node)

    def halt(self, node: int) -> None:
        """Set the halt bit on a node while keeping it enabled (0x6040 = 0x010F)."""
        self._write(node, "0x6040", 0, "u16", 0x010F)

    def unhalt(self, node: int) -> None:
        """Clear the halt bit on a node to resume motion (0x6040 = 0x000F)."""
        self._write(node, "0x6040", 0, "u16", 0x000F)

    # ═══════════════════════════════════════════════════════════════════════════
    # Motion profile parameters
    # ═══════════════════════════════════════════════════════════════════════════

    def set_profile_velocity(self, node: int, deg_s: float) -> None:
        """
        Write the Profile Velocity object (0x6081) for future moves on this node.
        This is set automatically by move_abs; call this to change it independently.
        """
        self._write(node, "0x6081", 0, "u32", max(1, _vel_deg_s_to_ticks(deg_s)))

    def set_profile_acceleration(self, node: int, value: int) -> None:
        """
        Write Profile Acceleration (0x6083). Value is in the device's internal
        unit (ticks/s²); consult the motor datasheet for your application.
        """
        self._write(node, "0x6083", 0, "u32", value)

    def set_profile_deceleration(self, node: int, value: int) -> None:
        """Write Profile Deceleration (0x6084). Same unit as set_profile_acceleration."""
        self._write(node, "0x6084", 0, "u32", value)

    def set_quick_stop_decel(self, node: int, value: int) -> None:
        """Write Quick Stop Deceleration (0x6085). Same unit as set_profile_acceleration."""
        self._write(node, "0x6085", 0, "u32", value)

    def set_motion_profile_type(self, node: int, type_val: int) -> None:
        """
        Write Motion Profile Type (0x6086).
        0 = trapezoidal ramp (default)
        3 = jerk-limited (S-curve)
        """
        self._write(node, "0x6086", 0, "i16", type_val)

    # ═══════════════════════════════════════════════════════════════════════════
    # Profile Velocity mode (continuous velocity control)
    # ═══════════════════════════════════════════════════════════════════════════

    def set_target_velocity(self, node: int, deg_s: float) -> None:
        """
        Set the target velocity (0x60FF) for Profile Velocity mode in °/s.
        Call set_mode_velocity() and enable() before using this.
        Use a negative value to reverse direction. Call stop_velocity() to brake.
        """
        self._write(node, "0x60FF", 0, "i32", _vel_deg_s_to_ticks(deg_s))

    def stop_velocity(self, node: int) -> None:
        """Ramp the velocity to zero by writing 0x60FF = 0 (uses deceleration ramp)."""
        self._write(node, "0x60FF", 0, "i32", 0)

    # ═══════════════════════════════════════════════════════════════════════════
    # Homing
    # ═══════════════════════════════════════════════════════════════════════════

    def set_homing_method(self, node: int, method: int = 35) -> None:
        """
        Set the homing method (0x6098).
        Method 35 = "current position as home" (no movement) — Nanotec default.
        """
        self._write(node, "0x6098", 0, "i8", method)

    def set_home_offset(self, node: int, ticks: int) -> None:
        """Write the home offset (0x607C) in encoder ticks."""
        self._write(node, "0x607C", 0, "i32", ticks)

    def start_homing(self, node: int) -> None:
        """Start the homing procedure (0x6040 = 0x001F). Call set_mode_homing() first."""
        self._write(node, "0x6040", 0, "u16", 0x001F)

    def stop_homing(self, node: int) -> None:
        """Interrupt the homing procedure (0x6040 = 0x000F)."""
        self._write(node, "0x6040", 0, "u16", 0x000F)

    # ═══════════════════════════════════════════════════════════════════════════
    # Software limits
    # ═══════════════════════════════════════════════════════════════════════════

    def set_software_limits(self, node: int, min_deg: float, max_deg: float) -> None:
        """
        Write the software position limits (0x607D:1 and :2) in degrees.
        The values are converted to encoder ticks internally.
        """
        self._write(node, "0x607D", 1, "i32", _deg_to_ticks(min_deg))
        self._write(node, "0x607D", 2, "i32", _deg_to_ticks(max_deg))

    def read_software_limits(self, node: int) -> tuple[float, float]:
        """
        Read the software position limits (0x607D:1 and :2).
        Returns (min_deg, max_deg) converted from encoder ticks.
        """
        mn = self._read(node, "0x607D", 1, "i32")
        mx = self._read(node, "0x607D", 2, "i32")
        return _ticks_to_deg(mn), _ticks_to_deg(mx)

    # ═══════════════════════════════════════════════════════════════════════════
    # Position feedback
    # ═══════════════════════════════════════════════════════════════════════════

    def read_position(self, node: int) -> float:
        """Return the actual position in degrees (0x6064 Position Actual Value)."""
        return _ticks_to_deg(self._read(node, "0x6064", 0, "i32"))

    def read_position_demand(self, node: int) -> float:
        """Return the position demand value in degrees (0x6062)."""
        return _ticks_to_deg(self._read(node, "0x6062", 0, "i32"))

    def read_position_internal(self, node: int) -> float:
        """Return the internal position actual value in degrees (0x6063)."""
        return _ticks_to_deg(self._read(node, "0x6063", 0, "i32"))

    def read_following_error(self, node: int) -> int:
        """
        Return the following error actual value in encoder ticks (0x60F4).
        This is the difference between demand and actual position.
        Returned as raw ticks since it is a relative error value.
        """
        return int(self._read(node, "0x60F4", 0, "i32"))

    # ═══════════════════════════════════════════════════════════════════════════
    # Velocity feedback
    # ═══════════════════════════════════════════════════════════════════════════

    def read_speed(self, node: int) -> float:
        """
        Return the actual velocity in degrees/second (0x606C Velocity Actual Value).
        Conversion: raw × TICS2DEG × 60 (empirically validated on this hardware).
        """
        return _vel_ticks_to_deg_s(self._read(node, "0x606C", 0, "i32"))

    def read_velocity_demand(self, node: int) -> float:
        """Return the velocity demand value in degrees/second (0x606B)."""
        return _vel_ticks_to_deg_s(self._read(node, "0x606B", 0, "i32"))

    # ═══════════════════════════════════════════════════════════════════════════
    # Current / torque feedback
    # ═══════════════════════════════════════════════════════════════════════════

    def read_current(self, node: int) -> float:
        """
        Return the actual motor current in Amps.

        Reads 0x6077 (Torque Actual Value, per-mille of rated) and
        0x6075 (Motor Rated Current, mA), then computes:
            actual_A = (torque_permille / 1000) × (rated_mA / 1000)
        """
        torque_permille = self._read(node, "0x6077", 0, "i16")
        rated_ma        = self._read(node, "0x6075", 0, "u32")
        return (torque_permille / 1000.0) * (rated_ma / 1000.0)

    def read_torque_demand(self, node: int) -> float:
        """
        Return the torque demand in Amps (0x6074).
        Same conversion as read_current() but uses the demand value.
        """
        torque_permille = self._read(node, "0x6074", 0, "i16")
        rated_ma        = self._read(node, "0x6075", 0, "u32")
        return (torque_permille / 1000.0) * (rated_ma / 1000.0)

    def read_rated_current(self, node: int) -> float:
        """Return the Motor Rated Current in milliamps (0x6075, unit is mA)."""
        return self._read(node, "0x6075", 0, "u32")

    def read_max_current(self, node: int) -> float:
        """
        Return the max current setting in per-mille of rated current (0x6073).
        E.g. 1000 = 100% of rated current.
        """
        return self._read(node, "0x6073", 0, "u16")

    # ═══════════════════════════════════════════════════════════════════════════
    # Combined feedback
    # ═══════════════════════════════════════════════════════════════════════════

    def read_all(self, node: int) -> dict:
        """
        Return a dict of all main feedback values for a node:
            position        – actual position, degrees
            speed           – actual velocity, degrees/second
            current         – actual current, Amps
            following_error – position following error, encoder ticks
        """
        return {
            "position":        self.read_position(node),
            "speed":           self.read_speed(node),
            "current":         self.read_current(node),
            "following_error": self.read_following_error(node),
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # Drive diagnostics
    # ═══════════════════════════════════════════════════════════════════════════

    def read_statusword(self, node: int) -> int:
        """Return the CiA 402 Statusword (0x6041). Bit 10 = target reached."""
        return int(self._read(node, "0x6041", 0, "u16"))

    def read_controlword(self, node: int) -> int:
        """Return the CiA 402 Controlword (0x6040)."""
        return int(self._read(node, "0x6040", 0, "u16"))

    def read_error_code(self, node: int) -> int:
        """Return the last error code (0x603F)."""
        return int(self._read(node, "0x603F", 0, "u16"))

    def read_error_register(self, node: int) -> int:
        """Return the error register byte (0x1001)."""
        return int(self._read(node, "0x1001", 0, "u8"))

    def read_digital_inputs(self, node: int) -> int:
        """Return the digital inputs bitmask (0x60FD)."""
        return int(self._read(node, "0x60FD", 0, "u32"))

    def read_digital_outputs(self, node: int) -> int:
        """Return the digital outputs physical state bitmask (0x60FE:1)."""
        return int(self._read(node, "0x60FE", 1, "u32"))

    def read_polarity(self, node: int) -> int:
        """Return the polarity configuration byte (0x607E)."""
        return int(self._read(node, "0x607E", 0, "u8"))

    def set_polarity(self, node: int, value: int) -> None:
        """
        Write the polarity configuration (0x607E).
        Bit 7 = position polarity, bit 6 = velocity polarity.
        """
        self._write(node, "0x607E", 0, "u8", value)

    # ═══════════════════════════════════════════════════════════════════════════
    # Device identity
    # ═══════════════════════════════════════════════════════════════════════════

    def read_device_info(self, node: int) -> dict:
        """
        Return a dict of device identity objects:
            device_type       – 0x1000 (u32)
            hardware_version  – 0x1009 (string)
            firmware_version  – 0x100A (string)
            vendor_id         – 0x1018:1 (u32)
            product_code      – 0x1018:2 (u32)
            revision_number   – 0x1018:3 (u32)
            serial_number     – 0x1018:4 (u32)
        """
        return {
            "device_type":      int(self._read(node, "0x1000", 0, "u32")),
            "hardware_version": self._read_str(node, "0x1009", 0),
            "firmware_version": self._read_str(node, "0x100A", 0),
            "vendor_id":        int(self._read(node, "0x1018", 1, "u32")),
            "product_code":     int(self._read(node, "0x1018", 2, "u32")),
            "revision_number":  int(self._read(node, "0x1018", 3, "u32")),
            "serial_number":    int(self._read(node, "0x1018", 4, "u32")),
        }

    def read_drive_serial(self, node: int) -> str:
        """Return the Nanotec drive serial number string (0x4040, vs type)."""
        return self._read_str(node, "0x4040", 0)

    def read_catalogue_number(self, node: int) -> str:
        """Return the Nanotec drive catalogue number string (0x6503, vs type)."""
        return self._read_str(node, "0x6503", 0)

    # ═══════════════════════════════════════════════════════════════════════════
    # Controller gains (Nanotec proprietary objects)
    # ═══════════════════════════════════════════════════════════════════════════

    def read_gains(self, node: int) -> dict:
        """
        Return the PID controller gains as a dict:
            pos_kp     – Position Kp  (0x321C:1)
            vel_kp     – Velocity Kp  (0x321B:1)
            vel_ti     – Velocity Ti  (0x321B:2)
            cur_kp_iq  – Current Kp Iq (0x321A:1)
            cur_ki_iq  – Current Ki Iq (0x321A:2)
            cur_kp_id  – Current Kp Id (0x321A:3)
            cur_ki_id  – Current Ki Id (0x321A:4)
        """
        return {
            "pos_kp":    int(self._read(node, "0x321C", 1, "u32")),
            "vel_kp":    int(self._read(node, "0x321B", 1, "u32")),
            "vel_ti":    int(self._read(node, "0x321B", 2, "u32")),
            "cur_kp_iq": int(self._read(node, "0x321A", 1, "u32")),
            "cur_ki_iq": int(self._read(node, "0x321A", 2, "u32")),
            "cur_kp_id": int(self._read(node, "0x321A", 3, "u32")),
            "cur_ki_id": int(self._read(node, "0x321A", 4, "u32")),
        }

    def write_gains(
        self,
        node: int,
        pos_kp:    int | None = None,
        vel_kp:    int | None = None,
        vel_ti:    int | None = None,
        cur_kp:    int | None = None,
        cur_ki:    int | None = None,
    ) -> None:
        """
        Write PID controller gains. Only non-None values are written.

        Note: cur_kp is written to both Iq and Id channels (0x321A:1 and :3),
        and cur_ki is written to both (0x321A:2 and :4), matching the JS UI behaviour.
        """
        if pos_kp is not None:
            self._write(node, "0x321C", 1, "u32", pos_kp)
        if vel_kp is not None:
            self._write(node, "0x321B", 1, "u32", vel_kp)
        if vel_ti is not None:
            self._write(node, "0x321B", 2, "u32", vel_ti)
        if cur_kp is not None:
            self._write(node, "0x321A", 1, "u32", cur_kp)
            self._write(node, "0x321A", 3, "u32", cur_kp)
        if cur_ki is not None:
            self._write(node, "0x321A", 2, "u32", cur_ki)
            self._write(node, "0x321A", 4, "u32", cur_ki)

    # ═══════════════════════════════════════════════════════════════════════════
    # Save / restore parameters
    # ═══════════════════════════════════════════════════════════════════════════

    def save_parameters(self, node: int, subindex: int = 1) -> None:
        """
        Save parameters to non-volatile memory (0x1010:<subindex>).

        Common subindex values:
            1 – store all parameters
            2 – store application parameters
            3 – store application parameters (alt)
            6 – store motion / home parameters (used after homing)
        """
        self._write(node, "0x1010", subindex, "u32", _SAVE_SIGNATURE)
        time.sleep(0.5)   # allow NVM write to complete

    def save_home_parameters(self, node: int) -> None:
        """Save motion/home parameters to NVM (0x1010:6). Call after a homing sequence."""
        self.save_parameters(node, subindex=6)

    def restore_defaults(self, node: int) -> None:
        """
        Restore all default parameters (0x1011:1).
        Usually requires a power cycle or nmt_reset() afterward.
        """
        self._write(node, "0x1011", 1, "u32", _RESTORE_SIGNATURE)

    # ═══════════════════════════════════════════════════════════════════════════
    # Adapter diagnostics
    # ═══════════════════════════════════════════════════════════════════════════

    def adapter_info(self) -> dict:
        """
        Query the ZK-USB-CAN-1 adapter itself (not any drive node).
        Returns a dict with keys: name, version, state.
        """
        return {
            "name":    " ".join(self._cmd("info name")).strip(),
            "version": " ".join(self._cmd("info version")).strip(),
            "state":   " ".join(self._cmd("info state")).strip(),
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # Low-level primitives
    # ═══════════════════════════════════════════════════════════════════════════

    def _cmd(self, s: str, timeout: float = 1.0, poll_interval: float = 0.002) -> list[str]:
        """
        Send a raw ASCII command string and return all response lines.

        Polls in_waiting every `poll_interval` seconds (default 2 ms) until
        data arrives, then drains the buffer. Returns as soon as a response
        is available rather than waiting a fixed delay.

        Raises RuntimeError if no response arrives within `timeout` seconds.
        """
        if self._ser is None or not self._ser.is_open:
            raise RuntimeError("Not connected. Call connect() first.")
        self._ser.write((s + "\r\n").encode("ascii"))
        deadline = time.monotonic() + timeout
        while not self._ser.in_waiting:
            if time.monotonic() >= deadline:
                raise RuntimeError(f"Timeout waiting for response to: {s!r}")
            time.sleep(poll_interval)
        out: list[str] = []
        while self._ser.in_waiting:
            out.append(self._ser.readline().decode(errors="ignore").strip())
        print(f"{s} -> {out}")
        return out

    def _write(self, node: int, index: str, sub: int, dtype: str, value) -> list[str]:
        """
        Send an SDO write command: ``<node> w <index> <sub> <dtype> <value>``.
        Returns the raw response lines (usually an acknowledgement or empty).
        """
        return self._cmd(f"{node} w {index} {sub} {dtype} {value}")

    def _read(self, node: int, index: str, sub: int, dtype: str) -> float:
        """
        Send an SDO read command and return the parsed numeric value.

        Uses the same extraction strategy as the JS calibration code:
        takes the last integer match from the response with ``-?\\d+``.
        Raises RuntimeError if the device returns an error or no number is found.
        """
        lines    = self._cmd(f"{node} r {index} {sub} {dtype}")
        response = " ".join(lines)
        if "ERROR" in response.upper():
            raise RuntimeError(
                f"Device error reading [{node}] {index}:{sub} {dtype}: {response}"
            )
        matches = re.findall(r"-?\d+", response)
        if not matches:
            raise RuntimeError(
                f"No numeric value in response for [{node}] {index}:{sub} {dtype}: {response!r}"
            )
        return float(matches[-1])

    def _read_str(self, node: int, index: str, sub: int) -> str:
        """
        Send an SDO read command for a Visual String (vs) object and return
        the response as a plain string (no numeric parsing).
        """
        lines = self._cmd(f"{node} r {index} {sub} vs")
        return " ".join(lines).strip()


# ── Demo ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mc = NanotecPanTiltController()

    print("Connecting...")
    mc.connect(DEFAULT_COM, DEFAULT_BAUD)

    print("\n--- Adapter info ---")
    info = mc.adapter_info()
    for k, v in info.items():
        print(f"  {k}: {v}")

    print("\n--- Enabling motors ---")
    mc.enable_all()
    time.sleep(0.3)

    print(f"\n--- Moving pitch={5.0}°  roll={-5.0}° at 10°/s ---")
    mc.move_both(5.0, -5.0, velocity_deg_s=10.0)
    time.sleep(3)

    print("\n--- Reading feedback ---")
    for node, name in [(NODE_PITCH, "Pitch"), (NODE_ROLL, "Roll")]:
        d = mc.read_all(node)
        print(
            f"  {name}: "
            f"pos={d['position']:.3f}°  "
            f"speed={d['speed']:.3f}°/s  "
            f"current={d['current']:.3f}A  "
            f"err={d['following_error']} ticks"
        )

    print("\n--- Device info (pitch node) ---")
    dev = mc.read_device_info(NODE_PITCH)
    for k, v in dev.items():
        print(f"  {k}: {v}")

    print("\n--- Gains (pitch node) ---")
    gains = mc.read_gains(NODE_PITCH)
    for k, v in gains.items():
        print(f"  {k}: {v}")

    print("\n--- Returning to zero ---")
    mc.go_zero(velocity_deg_s=10.0)
    time.sleep(3)

    print("\n--- Disconnecting ---")
    mc.disconnect()
    print("Done.")
