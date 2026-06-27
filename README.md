# Nanotec Web Control

Browser-only Web Serial control panel for two Nanotec PD6-E-M motors via ZK-USB-CAN-1.

## Run

Click **Connect**, select the ZK-USB-CAN-1 COM port, then use **Motors ON**, **Go to position**, and **Motors OFF**.

## Notes

Read `RULES.md` before changing motor-control code.

Low-level protocol is in:

```text
src/nanotec-canopen.js
```

UI behavior is in:

```text
src/app.js
```
