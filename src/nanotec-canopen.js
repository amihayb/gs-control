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
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
