// UI logic only. Low-level motor protocol is in nanotec-canopen.js.

const NODES    = [1, 2];
const TICS2DEG = 6.3178e-04;   // encoder ticks → degrees
const MAX_TICKS = 20000;        // hard travel limit (±)
const HOMING_METHOD = 35;       // Nanotec method 35 = "current position as home" (no movement)
                                // Change if your firmware uses a different value

let drive = null;
let pollTimer = null;
let ratedCurrentMA = 6900;  // Motor Rated Current in mA (0x6075), read at connect

const $ = id => document.getElementById(id);

function log(message) {
  console.log(message);
  $("log").textContent += message + "\n";
  $("log").scrollTop = $("log").scrollHeight;
}

// ==================== Theme ====================

function updateThemeIcon(theme) {
  const icon = $('theme-icon');
  if (!icon) return;
  icon.className = theme === 'light' ? 'fa fa-sun-o' : 'fa fa-moon-o';
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('gs-theme', 'light');
    updateThemeIcon('light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('gs-theme', 'dark');
    updateThemeIcon('dark');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  updateThemeIcon(localStorage.getItem('gs-theme') || 'dark');
});

// ==================== About ====================

function about() {
  Swal.fire({
    title: 'Gevasol Stabilit Control',
    html:  'Browser-based Web Serial control panel<br>for Nanotec PD6-E-M motors via ZK-USB-CAN-1.<br><br>'
         + 'Blau Robotics<br>'
         + '<a href="mailto:amihay@blaurobotics.co.il" style="text-decoration:none;">'
         + 'amihay@blaurobotics.co.il</a><br>Phone: +972-54-6668902',
    icon: 'info',
  });
}

// ==================== UI state ====================

function setConnectedUi(connected) {
  $("status").textContent = connected ? "Connected" : "Disconnected";
  $("status").style.color = connected
    ? "var(--color-toggle-on)"
    : "var(--color-text-muted)";

  const connToggle = $("connection-toggle");
  if (connToggle.checked !== connected) {
    connToggle.checked = connected;
  }

  $("motor-toggle").disabled = !connected;
  if (!connected) {
    $("motor-toggle").checked = false;
  }

  const stopSign = $("emergency-stop");
  if (stopSign) stopSign.classList.toggle('connected', connected);
}

function setMotorUi(on) {
  const motorToggle = $("motor-toggle");
  if (motorToggle.checked !== on) {
    motorToggle.checked = on;
  }
}

// ==================== Position polling ====================

async function pollPositions() {
  if (!drive) return;
  try {
    const raw1 = await drive.readPosition(1);
    const raw2 = await drive.readPosition(2);
    const vel1raw = await drive.readVelocity(1);
    const vel2raw = await drive.readVelocity(2);
    const cur1raw = await drive.readCurrent(1);
    const cur2raw = await drive.readCurrent(2);

    const set = (id, val) => { const el = $(id); if (el) el.value = val; };

    set("pos1", (Number(raw1)    * TICS2DEG).toFixed(2));
    set("pos2", (Number(raw2)    * TICS2DEG).toFixed(2));
    set("vel1", (Number(vel1raw) * TICS2DEG * 60).toFixed(2));
    set("vel2", (Number(vel2raw) * TICS2DEG * 60).toFixed(2));
    set("cur1", (Number(cur1raw) / 1000 * ratedCurrentMA / 1000).toFixed(2));
    set("cur2", (Number(cur2raw) / 1000 * ratedCurrentMA / 1000).toFixed(2));
  } catch (e) {
    log(`Poll failed: ${e.message || e}`);
  }

  // Reschedule only after this cycle finishes (prevents overlapping reads)
  if (drive) pollTimer = setTimeout(pollPositions, 500);
}

// ==================== Connection toggle ====================

$("connection-toggle").onchange = async function () {
  if (this.checked) {
    // Connect
    try {
      drive = new NanotecCanopen({
        nodes: NODES,
        canInitIndex: 0,
        serialBaudRate: 115200,
        log
      });
      await drive.connect();

      // Read rated current once; fall back to default if not supported
      try {
        const rc = Number(await drive.readRatedCurrent(1));
        if (rc > 0) ratedCurrentMA = rc;
      } catch (_) {}
      log(`Rated current: ${ratedCurrentMA} mA`);

      await pollPositions();   // first read immediately; it reschedules itself
      setConnectedUi(true);
    } catch (e) {
      log(`Connect failed: ${e.message || e}`);
      drive = null;
      this.checked = false;
      setConnectedUi(false);
    }
  } else {
    // Disconnect
    clearTimeout(pollTimer);
    pollTimer = null;
    try {
      if (drive) await drive.disconnect();
    } catch (e) {
      log(`Disconnect failed: ${e.message || e}`);
    }
    drive = null;
    ['pos1','pos2','vel1','vel2','cur1','cur2'].forEach(id => {
      const el = $(id); if (el) el.value = '---';
    });
    setMotorUi(false);
    setConnectedUi(false);
  }
};

// ==================== Motor toggle ====================

$("motor-toggle").onchange = async function () {
  if (!drive) {
    this.checked = false;
    return;
  }
  if (this.checked) {
    try {
      await drive.motorsOn();
    } catch (e) {
      log(`Motors ON failed: ${e.message || e}`);
      this.checked = false;
    }
  } else {
    try {
      await drive.motorsOff();
    } catch (e) {
      log(`Motors OFF failed: ${e.message || e}`);
    }
  }
};

// ==================== Emergency stop ====================

async function emergencyStop() {
  if (!drive) return;
  abortProgram();
  log("EMERGENCY STOP");
  try {
    await drive.motorsOff();
    setMotorUi(false);
  } catch (e) {
    log(`Emergency stop error: ${e.message || e}`);
  }
}

// ==================== Movement panel actions ====================

// Jog: add deltaDeg to the target of one axis, clamp, then move
function jog(axis, deltaDeg) {
  const inputId = axis === 1 ? 'target1' : 'target2';
  const input = $(inputId);
  if (!input) return;
  const maxDeg = MAX_TICKS * TICS2DEG;
  const next = Math.max(-maxDeg, Math.min(maxDeg, (Number(input.value) || 0) + deltaDeg));
  input.value = next.toFixed(3);
  goToPosition();
}

// Diagonal jog: add delta1 to Axis 1 and delta2 to Axis 2, clamp both, then move
function jogDiag(delta1, delta2) {
  const input1 = $('target1');
  const input2 = $('target2');
  if (!input1 || !input2) return;
  const maxDeg = MAX_TICKS * TICS2DEG;
  input1.value = Math.max(-maxDeg, Math.min(maxDeg, (Number(input1.value) || 0) + delta1)).toFixed(3);
  input2.value = Math.max(-maxDeg, Math.min(maxDeg, (Number(input2.value) || 0) + delta2)).toFixed(3);
  goToPosition();
}

// Home: send both axes to 0°
function jogHome() {
  const t1 = $('target1'); if (t1) t1.value = '0';
  const t2 = $('target2'); if (t2) t2.value = '0';
  goToPosition();
}

// Ensure motors are on before moving — called by goToPosition and runProgram
async function ensureMotorsOn() {
  if (!$("motor-toggle").checked) {
    log("Motors were off — enabling motors...");
    await drive.motorsOn();
    setMotorUi(true);
  }
}

// Called from the Go to Position button inside panelUI.js
async function goToPosition() {
  if (!drive) {
    log("Not connected.");
    return;
  }
  abortProgram();
  try {
    await ensureMotorsOn();
    const deg1 = Number($("target1").value);
    const deg2 = Number($("target2").value);

    const t1 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, deg1 / TICS2DEG)));
    const t2 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, deg2 / TICS2DEG)));

    const velDeg = Math.max(2, Math.min(20, Number($("movementVelocity").value) || 15));
    const velTicks = Math.round(velDeg / (TICS2DEG * 60));

    log(`Move → Ax1: ${deg1.toFixed(3)}° (${t1} tics)  Ax2: ${deg2.toFixed(3)}° (${t2} tics)  Vel: ${velDeg}°/s (${velTicks})`);

    for (const node of NODES) await drive.writeObj(node, "0x6081", 0, "u32", velTicks);

    await drive.moveAbs(1, t1);
    await drive.moveAbs(2, t2);
  } catch (e) {
    log(`Move failed: ${e.message || e}`);
  }
}

// Called from Motors ON button inside panelUI.js
async function motorsOn() {
  if (!drive) {
    log("Not connected.");
    return;
  }
  try {
    await drive.motorsOn();
    setMotorUi(true);
  } catch (e) {
    log(`Motors ON failed: ${e.message || e}`);
  }
}

// Called from Motors OFF button inside panelUI.js
async function motorsOff() {
  if (!drive) {
    log("Not connected.");
    return;
  }
  abortProgram();
  try {
    await drive.motorsOff();
    setMotorUi(false);
  } catch (e) {
    log(`Motors OFF failed: ${e.message || e}`);
  }
}

// ==================== Homing ====================

async function setHomeForAllAxes() {
  if (!drive) { log("Not connected."); return; }

  const confirm = await Swal.fire({
    title:             'Set Home Position?',
    text:              'This will run the homing sequence on both axes and set the current position as home. Continue?',
    icon:              'warning',
    showCancelButton:  true,
    confirmButtonText: 'Yes, set home',
    cancelButtonText:  'Cancel',
  });
  if (!confirm.isConfirmed) { log("Homing cancelled."); return; }

  const btn = $("btn-set-home");
  if (btn) btn.disabled = true;
  try {
    // Disable all motors before starting
    for (const node of NODES) await drive.disableMotor(node);
    log("Motors disabled — starting homing sequence");

    // Home each axis (save is handled once below)
    for (const node of NODES) {
      log(`=== Homing node ${node} ===`);
      await drive.setCurrentPositionAsHome(node, {
        homingMethod: HOMING_METHOD,
        saveSubindex: 6,
        tolerance:    10,
        timeoutMs:    10000,
        onBeforeSave: () => false   // skip per-node save; ask once after all axes
      });
      log(`Node ${node}: homing complete`);
    }

    // Ask once for both axes
    const result = await Swal.fire({
      title:             'Save Home Position?',
      text:              'Save the new home to non-volatile memory for both axes?',
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: 'Save',
      cancelButtonText:  'Skip',
    });

    if (result.isConfirmed) {
      for (const node of NODES) {
        await drive.saveParameters(node, 6);
        log(`Node ${node}: home saved to NVM`);
      }
      log("=== All axes homed and saved ===");
    } else {
      log("=== All axes homed (save skipped) ===");
    }
  } catch (e) {
    log(`Homing failed: ${e.message || e}`);
    Swal.fire({
      title: 'Homing Failed',
      text:  e.message || String(e),
      icon:  'error',
    });
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ==================== Programs ====================

let _progRunning = false;
let _progDone    = Promise.resolve();   // resolves when current program fully exits

async function runProgram(steps, label, btnId) {
  if (!drive) { log("Not connected."); return; }

  // Abort any running program and wait for it to fully clean up
  if (_progRunning) {
    log(`Switching to ${label} — aborting current program`);
    _progRunning = false;
    await _progDone;
  }

  _progRunning = true;
  const btn = btnId ? document.getElementById(btnId) : null;

  if (btn) {
    btn.classList.add('in-progress');
    btn.style.setProperty('--progress', '0%');
  }

  const totalMs   = steps.reduce((sum, s) => sum + s.waitMs, 0);
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const pct = Math.min(99, Math.round(((Date.now() - startTime) / totalMs) * 100));
    if (btn) btn.style.setProperty('--progress', `${pct}%`);
  }, 80);

  log(`=== ${label} start (${steps.length} steps, ~${(totalMs / 1000).toFixed(1)}s) ===`);

  // Store the promise so switchers can await cleanup
  _progDone = (async () => {
    try {
      await ensureMotorsOn();
      for (let i = 0; i < steps.length; i++) {
        if (!_progRunning) { log(`${label} aborted at step ${i + 1}`); return; }

        const { ax1, ax2, waitMs } = steps[i];
        const t1 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, ax1 / TICS2DEG)));
        const t2 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, ax2 / TICS2DEG)));

        log(`  Step ${i + 1}/${steps.length}: Ax1=${ax1}° Ax2=${ax2}° wait=${waitMs}ms`);
        await drive.moveAbs(1, t1);
        await drive.moveAbs(2, t2);
        await new Promise(r => setTimeout(r, waitMs));
      }
      if (_progRunning) log(`=== ${label} complete ===`);
    } catch (e) {
      log(`${label} error: ${e.message || e}`);
    } finally {
      clearInterval(progressInterval);
      _progRunning = false;
      if (btn) {
        btn.style.setProperty('--progress', '100%');
        await new Promise(r => setTimeout(r, 300));
        btn.classList.remove('in-progress');
        btn.style.removeProperty('--progress');
      }
    }
  })();

  await _progDone;
}

function abortProgram() {
  if (_progRunning) {
    _progRunning = false;
  }
}

// ==================== Console Input ====================

// Known SDO object types, keyed as "UPPERCASEHEX:subindex" (no 0x prefix).
// If an object is not listed here, the user will be prompted to choose the type.
const SDO_TYPES = {
  // CiA 301 communication objects
  '1000:0': 'u32',  // Device Type
  '1001:0': 'u8',   // Error Register
  '1003:0': 'u8',   // Number of Errors
  '1010:6': 'u32',  // Save to NVM (store all)
  '1018:1': 'u32',  // Vendor ID
  '1018:2': 'u32',  // Product Code
  '1018:3': 'u32',  // Revision Number
  '1018:4': 'u32',  // Serial Number
  // CiA 402 drive profile
  '603F:0': 'u16',  // Error Code
  '6040:0': 'u16',  // Controlword
  '6041:0': 'u16',  // Statusword
  '6043:0': 'i16',  // VL Velocity Demand
  '6044:0': 'i16',  // VL Velocity Actual Value
  '6060:0': 'i8',   // Modes of Operation
  '6061:0': 'i8',   // Modes of Operation Display
  '6062:0': 'i32',  // Position Demand Value
  '6063:0': 'i32',  // Position Actual Internal Value
  '6064:0': 'i32',  // Position Actual Value
  '606B:0': 'i32',  // Velocity Demand Value
  '606C:0': 'i32',  // Velocity Actual Value
  '6073:0': 'u16',  // Max Current (thousandths of rated)
  '6074:0': 'i16',  // Torque Demand
  '6075:0': 'u32',  // Motor Rated Current (mA)
  '6077:0': 'i16',  // Torque Actual Value
  '6081:0': 'u32',  // Profile Velocity
  '6083:0': 'u32',  // Profile Acceleration
  '6084:0': 'u32',  // Profile Deceleration
  '6085:0': 'u32',  // Quick Stop Deceleration
  '6086:0': 'i16',  // Motion Profile Type
  '607A:0': 'i32',  // Target Position
  '6098:0': 'i8',   // Homing Method
  '60F4:0': 'i32',  // Following Error Actual Value
  '60FC:0': 'i32',  // Position Demand Internal Value
  '60FD:0': 'u32',  // Digital Inputs
  '60FE:1': 'u32',  // Digital Outputs (physical)
  '60FE:2': 'u32',  // Digital Outputs (bit mask)
  // Nanotec proprietary
  '4040:0': 'vs',   // Drive Serial Number
  '4041:0': 'u32',  // Device ID
  '6503:0': 'vs',   // Drive Catalogue Number
  // Nanotec controller gains
  '321A:1': 'u32',  // Current Kp Iq
  '321A:2': 'u32',  // Current Ki Iq
  '321A:3': 'u32',  // Current Kp Id
  '321A:4': 'u32',  // Current Ki Id
  '321B:1': 'u32',  // Velocity Kp
  '321B:2': 'u32',  // Velocity Ti
  '321C:1': 'u32',  // Position Kp
};

const commandHistory = [];
let historyIndex = -1;

function parseConsoleCommand(input) {
  const normalizeIndex = hex => /^0x/i.test(hex) ? hex : `0x${hex}`;
  const lookupKey = (hex, sub) => hex.replace(/^0x/i, '').toUpperCase() + ':' + sub;

  // Full format (type explicit): node-INDEX:sub:type=value  /  node-INDEX:sub:type
  const wm = input.match(/^(\d+)-([0-9a-fA-F]+):(\d+):(\w+)=(.+)$/);
  if (wm) return { op: 'write', node: parseInt(wm[1]), index: normalizeIndex(wm[2]),
                   key: lookupKey(wm[2], wm[3]), sub: parseInt(wm[3]), type: wm[4], value: wm[5] };

  const rm = input.match(/^(\d+)-([0-9a-fA-F]+):(\d+):(\w+)$/);
  if (rm) return { op: 'read', node: parseInt(rm[1]), index: normalizeIndex(rm[2]),
                   key: lookupKey(rm[2], rm[3]), sub: parseInt(rm[3]), type: rm[4] };

  // Short format (type omitted — looked up or prompted): node-INDEX:sub=value  /  node-INDEX:sub
  const sw = input.match(/^(\d+)-([0-9a-fA-F]+):(\d+)=(.+)$/);
  if (sw) return { op: 'write', node: parseInt(sw[1]), index: normalizeIndex(sw[2]),
                   key: lookupKey(sw[2], sw[3]), sub: parseInt(sw[3]), type: null, value: sw[4] };

  const sr = input.match(/^(\d+)-([0-9a-fA-F]+):(\d+)$/);
  if (sr) return { op: 'read', node: parseInt(sr[1]), index: normalizeIndex(sr[2]),
                   key: lookupKey(sr[2], sr[3]), sub: parseInt(sr[3]), type: null };

  return null;
}

async function handleConsoleCommand(input) {
  const cmd = parseConsoleCommand(input.trim());
  if (!cmd) {
    log(`Console: invalid format.`);
    log(`  Write: 1-321B:1=1000          (type auto-detected or prompted)`);
    log(`  Write: 1-321B:1:u16=1000      (type explicit)`);
    log(`  Read:  1-6064:0               (type auto-detected or prompted)`);
    log(`  Read:  1-6064:0:i32           (type explicit)`);
    return;
  }
  if (!drive || !drive.port) {
    log('Console: not connected.');
    return;
  }

  let type = cmd.type || SDO_TYPES[cmd.key];

  if (!type) {
    await new Promise(r => setTimeout(r, 100)); // let keyup event fire before Swal steals focus
    const result = await Swal.fire({
      title: `Unknown object ${cmd.key}`,
      text: 'Select the data type to use:',
      input: 'select',
      inputOptions: { i8: 'i8  (signed 8-bit)', i16: 'i16  (signed 16-bit)', i32: 'i32  (signed 32-bit)',
                      u8:  'u8  (unsigned 8-bit)', u16: 'u16  (unsigned 16-bit)', u32: 'u32  (unsigned 32-bit)' },
      inputPlaceholder: 'Select type…',
      showCancelButton: true,
      confirmButtonText: 'Send',
    });
    if (!result.isConfirmed || !result.value) return;
    type = result.value;
    SDO_TYPES[cmd.key] = type;  // remember for the rest of this session
    log(`Console: remembered ${cmd.key} → ${type} for this session`);
  }

  try {
    if (cmd.op === 'write') {
      await drive.writeObj(cmd.node, cmd.index, cmd.sub, type, cmd.value);
    } else {
      await drive.readObj(cmd.node, cmd.index, cmd.sub, type);
    }
  } catch (e) {
    log(`Console error: ${e.message || e}`);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const input = $('console-input');
  const btn   = $('console-send');
  if (!input || !btn) return;

  async function submit() {
    const val = input.value.trim();
    if (!val) return;
    if (commandHistory[0] !== val) commandHistory.unshift(val);
    historyIndex = -1;
    input.value = '';
    await handleConsoleCommand(val);
  }

  btn.addEventListener('click', submit);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = -1;
        input.value = '';
      }
    }
  });
});

// ==================== Calibration ====================

const CAL_PARAMS = [
  { id: 'pos-kp', label: 'Pos Kp',  reads: [['0x321C', '1']], writes: [['0x321C', '1']] },
  { id: 'vel-kp', label: 'Vel Kp',  reads: [['0x321B', '1']], writes: [['0x321B', '1']] },
  { id: 'vel-ti', label: 'Vel Ti',  reads: [['0x321B', '2']], writes: [['0x321B', '2']] },
  { id: 'cur-kp', label: 'Cur Kp',  reads: [['0x321A', '1']], writes: [['0x321A', '1'], ['0x321A', '3']] },
  { id: 'cur-ki', label: 'Cur Ki',  reads: [['0x321A', '2']], writes: [['0x321A', '2'], ['0x321A', '4']] },
];

async function readCalibrationParams(node) {
  if (!drive || !drive.port) return;
  for (const p of CAL_PARAMS) {
    const el = document.getElementById(`cal-cur-${p.id}-${node}`);
    if (!el) continue;
    try {
      const raw = await drive.readObj(node, p.reads[0][0], parseInt(p.reads[0][1]), 'u32');
      // readObj returns the full "cmd -> response" string; extract the numeric part
      const match = String(raw).match(/-?\d+/g);
      el.textContent = match ? match[match.length - 1] : raw;
    } catch (e) {
      el.textContent = '---';
    }
  }
}

async function applyCalibration(node) {
  if (!drive || !drive.port) { log('Calibration: not connected.'); return; }
  log(`=== Apply Calibration Axis ${node} ===`);
  for (const p of CAL_PARAMS) {
    const inputEl = document.getElementById(`cal-in-${p.id}-${node}`);
    if (!inputEl || inputEl.value.trim() === '') continue;
    const value = inputEl.value.trim();
    try {
      for (const [index, sub] of p.writes) {
        await drive.writeObj(node, index, parseInt(sub), 'u32', value);
      }
      // Refresh displayed current value
      const curEl = document.getElementById(`cal-cur-${p.id}-${node}`);
      if (curEl) curEl.textContent = value;
      inputEl.value = '';
    } catch (e) {
      log(`Calibration: error writing ${p.label} to node ${node}: ${e.message || e}`);
    }
  }
  log(`=== Apply Calibration Axis ${node} done ===`);
}

async function saveCalibrationNVM() {
  if (!drive || !drive.port) { log('Calibration: not connected.'); return; }
  const result = await Swal.fire({
    title:             'Save Parameters?',
    text:              'Save all calibration parameters to non-volatile memory for both axes?',
    icon:              'question',
    showCancelButton:  true,
    confirmButtonText: 'Save',
    cancelButtonText:  'Cancel',
  });
  if (!result.isConfirmed) { log('Save parameters cancelled.'); return; }
  log('Saving calibration parameters to NVM…');
  for (const node of NODES) {
    try {
      await drive.saveParameters(node, 3);   // Save to application parameters
      log(`  Node ${node}: saved.`);
    } catch (e) {
      log(`  Node ${node}: save failed — ${e.message || e}`);
    }
  }
  log('Save parameters done.');
}

window.readCalibrationParams = readCalibrationParams;
window.applyCalibration      = applyCalibration;
window.saveCalibrationNVM    = saveCalibrationNVM;

window.goToPosition      = goToPosition;
window.motorsOn          = motorsOn;
window.motorsOff         = motorsOff;
window.toggleTheme       = toggleTheme;
window.about             = about;
window.emergencyStop     = emergencyStop;
window.jog               = jog;
window.jogDiag           = jogDiag;
window.jogHome           = jogHome;
window.setHomeForAllAxes = setHomeForAllAxes;
window.runProgram        = runProgram;

// Initialise UI state
setConnectedUi(false);
MovementControl();
