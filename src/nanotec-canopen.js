// Low-level Nanotec ZK-USB-CAN-1 + CANopen helpers.
// Keep this file small and explicit. See RULES.md and COMMANDS.md.

class NanotecCanopen {
  constructor({ nodes = [1, 2], canInitIndex = 0, serialBaudRate = 115200, timeoutMs = 1000, log = console.log } = {}) {
    this.nodes = nodes;
    this.canInitIndex = canInitIndex;       // 0 = 1 Mbit/s CAN
    this.serialBaudRate = serialBaudRate;   // Web Serial / virtual COM baudrate, not CAN bitrate
    this.timeoutMs = timeoutMs;
    this.log = log;

    this.port = null;
    this.reader = null;
    this.writer = null;
    this.readBuffer = "";
    this.reading = false;
  }

  async connect() {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not available. Use Chrome or Edge on localhost/HTTPS.");
    }

    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: this.serialBaudRate });

    this.writer = this.port.writable.getWriter();
    this.reader = this.port.readable.getReader();

    this.reading = true;
    this.readLoop();

    await this.send(`init ${this.canInitIndex}`);
    await this.send("set notification 0");
  }

  async disconnect() {
    try {
      await this.motorsOff();
    } catch (e) {
      this.log(`Motor disable failed: ${e.message || e}`);
    }

    this.reading = false;

    if (this.reader) {
      try { await this.reader.cancel(); } catch {}
      try { this.reader.releaseLock(); } catch {}
      this.reader = null;
    }

    if (this.writer) {
      try { this.writer.releaseLock(); } catch {}
      this.writer = null;
    }

    if (this.port) {
      try { await this.port.close(); } catch {}
      this.port = null;
    }
  }

  async readLoop() {
    const decoder = new TextDecoder();

    try {
      while (this.reading && this.port && this.port.readable) {
        const { value, done } = await this.reader.read();
        if (done) break;
        this.readBuffer += decoder.decode(value);
      }
    } catch (e) {
      if (this.reading) this.log(`Read loop error: ${e.message || e}`);
    }
  }

  getLine() {
    const i = this.readBuffer.indexOf("\n");
    if (i < 0) return null;

    const line = this.readBuffer.slice(0, i).trim();
    this.readBuffer = this.readBuffer.slice(i + 1);
    return line;
  }

  async send(command) {
    if (!this.writer) throw new Error("Not connected.");

    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(command + "\r\n"));
    await sleep(50);

    const start = Date.now();

    while (Date.now() - start < this.timeoutMs) {
      const line = this.getLine();
      if (line) {
        this.log(`${command} -> ${line}`);
        return line;
      }
      await sleep(10);
    }

    this.log(`${command} -> TIMEOUT`);
    return "TIMEOUT";
  }

  async writeObj(node, index, sub, type, value) {
    return this.send(`${node} w ${index} ${sub} ${type} ${value}`);
  }

  async readObj(node, index, sub, type) {
    return this.send(`${node} r ${index} ${sub} ${type}`);
  }

  async enableMotor(node) {
    await this.send(`${node} start`);
    await this.writeObj(node, "0x6040", 0, "u16", 0x80); // fault reset
    await this.writeObj(node, "0x6060", 0, "i8", 1);     // profile position mode
    await this.writeObj(node, "0x6040", 0, "u16", 0x06); // shutdown
    await this.writeObj(node, "0x6040", 0, "u16", 0x07); // switch on
    await this.writeObj(node, "0x6040", 0, "u16", 0x0F); // enable operation
  }

  async disableMotor(node) {
    await this.writeObj(node, "0x6040", 0, "u16", 0x06); // shutdown / disable operation
    await this.writeObj(node, "0x6040", 0, "u16", 0x00); // switch off
  }

  async motorsOn() {
    for (const node of this.nodes) await this.enableMotor(node);
  }

  async motorsOff() {
    for (const node of this.nodes) await this.disableMotor(node);
  }

  async moveAbs(node, position) {
    await this.writeObj(node, "0x607A", 0, "i32", position); // target position
    await this.writeObj(node, "0x6040", 0, "u16", 0x0F);     // bit 4 low
    await this.writeObj(node, "0x6040", 0, "u16", 0x3F);     // bit 4 rising edge + immediate
  }

  async readPosition(node) {
    return this.readObj(node, "0x6064", 0, "i32");
  }

  async readVelocity(node) {
    return this.readObj(node, "0x606C", 0, "i32");
  }

  // 0x6077: Torque Actual Value — per-mille of rated current (i16).
  // See COMMANDS.md §Torque / current-related feedback.
  async readCurrent(node) {
    return this.readObj(node, "0x6077", 0, "i16");
  }

  // 0x6075: Motor Rated Current — milliamps (u32).
  async readRatedCurrent(node) {
    return this.readObj(node, "0x6075", 0, "u32");
  }

  // ==================== SDO aliases ====================

  async readSdo(node, index, sub, type) {
    return this.readObj(node, index, sub, type);
  }

  async writeSdo(node, index, sub, type, value) {
    return this.writeObj(node, index, sub, type, value);
  }

  // ==================== Homing helpers ====================

  // Poll 0x6041 every 200 ms until predicate(statusword) is true.
  // Returns the final statusword value. Throws on timeout.
  async waitStatusword(node, predicate, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const sw = Number(await this.readSdo(node, "0x6041", 0, "u16"));
      if (predicate(sw)) return sw;
      await sleep(200);
    }
    throw new Error(`node ${node}: waitStatusword timeout after ${timeoutMs} ms`);
  }

  // Write the CANopen "save" signature to 0x1010:<saveSubindex>.
  // saveSubindex 1 = all parameters, 2 = application parameters (default).
  async saveParameters(node, saveSubindex = 2) {
    this.log(`[node ${node}] saving parameters → 0x1010:${saveSubindex}`);
    const result = await this.writeSdo(node, "0x1010", saveSubindex, "u32", 0x65766173);
    await sleep(500); // allow NVM write to complete
    this.log(`[node ${node}] save result: ${result}`);
    // Note: home offset and position reference persist across power cycles,
    // but absolute encoder startup behaviour still depends on drive configuration.
    return result;
  }

  // ==================== Homing sequence ====================

  /**
   * Define the current mechanical position as the home position and save it.
   *
   * @param {number} node - CANopen node ID
   * @param {object} opts
   * @param {number} opts.homingMethod  - 0x6098 value. -1 = "current position as home"
   *                                     on most Nanotec firmware. Adjust if needed.
   * @param {number} [opts.saveSubindex=2]  - 0x1010 sub-index for save (2 = application params)
   * @param {number} [opts.tolerance=10]    - max allowed abs(position) after homing (ticks)
   * @param {number} [opts.timeoutMs=10000] - timeout for each waiting step (ms)
   */
  async setCurrentPositionAsHome(node, {
    homingMethod,
    saveSubindex = 2,
    tolerance    = 10,
    timeoutMs    = 10000,
    onBeforeSave = null    // async () => boolean — return false to skip save
  } = {}) {

    // ── Step 1: Ensure drive is operational ────────────────────────────────
    const swBefore = Number(await this.readSdo(node, "0x6041", 0, "u16"));
    this.log(`[node ${node}] statusword before reset: 0x${swBefore.toString(16).padStart(4,'0')}`);

    if (swBefore & 0x0008) {                                          // bit3 = fault
      await this.writeSdo(node, "0x6040", 0, "u16", 0x0080);         // fault reset
    }
    await this.writeSdo(node, "0x6040", 0, "u16", 0x0006);           // shutdown
    await this.writeSdo(node, "0x6040", 0, "u16", 0x0007);           // switch on
    await this.writeSdo(node, "0x6040", 0, "u16", 0x000F);           // enable operation

    const swAfter = Number(await this.readSdo(node, "0x6041", 0, "u16"));
    this.log(`[node ${node}] statusword after enable: 0x${swAfter.toString(16).padStart(4,'0')}`);

    // ── Step 2: Switch to Homing Mode ─────────────────────────────────────
    await this.writeSdo(node, "0x6060", 0, "i8", 6);

    const modeDeadline2 = Date.now() + timeoutMs;
    while (Date.now() < modeDeadline2) {
      if (Number(await this.readSdo(node, "0x6061", 0, "i8")) === 6) break;
      await sleep(200);
    }
    const modeCheck = Number(await this.readSdo(node, "0x6061", 0, "i8"));
    if (modeCheck !== 6) throw new Error(`[node ${node}] timeout waiting for Homing Mode (6061h=${modeCheck})`);

    // ── Step 3: Configure homing ──────────────────────────────────────────
    const posBefore = Number(await this.readSdo(node, "0x6064", 0, "i32"));
    this.log(`[node ${node}] position before homing: ${posBefore} ticks`);
    this.log(`[node ${node}] homing method: ${homingMethod}`);

    await this.writeSdo(node, "0x6098", 0, "i8",  homingMethod);     // homing method
    await this.writeSdo(node, "0x607C", 0, "i32", 0);                // home offset = 0

    // ── Step 4: Execute homing ────────────────────────────────────────────
    this.log(`[node ${node}] homing start`);
    await this.writeSdo(node, "0x6040", 0, "u16", 0x000F);           // clear bit4
    await this.writeSdo(node, "0x6040", 0, "u16", 0x001F);           // start (bit4 rising edge)

    const finalSw = await this.waitStatusword(node, sw => {
      return (sw & 0x1000) !== 0   // bit12 = homing attained
          || (sw & 0x2000) !== 0   // bit13 = homing error
          || (sw & 0x0008) !== 0;  // bit3  = fault
    }, timeoutMs);

    this.log(`[node ${node}] homing result: statusword = 0x${finalSw.toString(16).padStart(4,'0')}`);

    if (finalSw & 0x0008) throw new Error(`[node ${node}] homing aborted — drive fault`);
    if (finalSw & 0x2000) throw new Error(`[node ${node}] homing aborted — homing error`);

    // ── Step 5: Verify position ───────────────────────────────────────────
    const posAfter = Number(await this.readSdo(node, "0x6064", 0, "i32"));
    this.log(`[node ${node}] position before: ${posBefore}  after: ${posAfter} ticks`);

    if (Math.abs(posAfter) > tolerance) {
      throw new Error(`[node ${node}] position after homing (${posAfter}) exceeds tolerance (±${tolerance} ticks)`);
    }

    // ── Step 6: Save parameters ───────────────────────────────────────────
    const doSave = onBeforeSave ? await onBeforeSave() : true;
    if (doSave) {
      await this.saveParameters(node, saveSubindex);
    } else {
      this.log(`[node ${node}] save skipped by user`);
    }

    // ── Step 7: Return to Profile Position Mode ───────────────────────────
    await this.writeSdo(node, "0x6060", 0, "i8", 1);

    const ppDeadline = Date.now() + timeoutMs;
    while (Date.now() < ppDeadline) {
      if (Number(await this.readSdo(node, "0x6061", 0, "i8")) === 1) break;
      await sleep(200);
    }
    const finalMode = Number(await this.readSdo(node, "0x6061", 0, "i8"));
    this.log(`[node ${node}] final operating mode (6061h): ${finalMode}`);

    if (finalMode !== 1) throw new Error(`[node ${node}] timeout returning to Profile Position Mode`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
