import serial
import time

COM_PORT = "COM10"
NODES = [1, 2]

ser = serial.Serial(COM_PORT, baudrate=115200, timeout=1)

def cmd(s, delay=0.05):
    ser.write((s + "\r\n").encode("ascii"))
    time.sleep(delay)
    out = []
    while ser.in_waiting:
        out.append(ser.readline().decode(errors="ignore").strip())
    if not out:
        out.append(ser.readline().decode(errors="ignore").strip())
    print(s, "->", out)
    return out

def write(node, index, sub, dtype, value):
    return cmd(f"{node} w {index} {sub} {dtype} {value}")

def enable_motor(node):
    cmd(f"{node} start")                 # NMT operational
    write(node, "0x6040", 0, "u16", 0x80) # fault reset
    time.sleep(0.1)
    write(node, "0x6060", 0, "i8", 1)     # Profile Position mode
    write(node, "0x6040", 0, "u16", 0x06) # shutdown
    write(node, "0x6040", 0, "u16", 0x07) # switch on
    write(node, "0x6040", 0, "u16", 0x0F) # enable operation

def move_abs(node, position):
    write(node, "0x607A", 0, "i32", position) # Target position
    write(node, "0x6040", 0, "u16", 0x0F)     # bit 4 low
    write(node, "0x6040", 0, "u16", 0x3F)     # bit 4 rising edge + immediate

def disable_motor(node):
    write(node, "0x6040", 0, "u16", 0x06)     # disable operation / shutdown

try:
    cmd("init 0")                # CAN = 1 Mbit/s
    cmd("set notification 0")

    for n in NODES:
        enable_motor(n)

    move_abs(1, 0)
    move_abs(2, 0)

    time.sleep(2)

    move_abs(1, 10000)

    time.sleep(2)

    move_abs(2, -7000)

    time.sleep(2)

    move_abs(1, 0)
    move_abs(2, 0)

    time.sleep(2)

    for n in NODES:
        disable_motor(n)

finally:
    try:
        for n in NODES:
            disable_motor(n)
    except Exception as e:
        print("Failed to disable motors:", e)

    ser.close()