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
    title: 'Nanotec CANopen Control',
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
    set("vel1", (Number(vel1raw) * TICS2DEG).toFixed(2));
    set("vel2", (Number(vel2raw) * TICS2DEG).toFixed(2));
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

// Home: send both axes to 0°
function jogHome() {
  const t1 = $('target1'); if (t1) t1.value = '0';
  const t2 = $('target2'); if (t2) t2.value = '0';
  goToPosition();
}

// Called from the Go to Position button inside panelUI.js
async function goToPosition() {
  if (!drive) {
    log("Not connected.");
    return;
  }
  try {
    const deg1 = Number($("target1").value);
    const deg2 = Number($("target2").value);

    const t1 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, deg1 / TICS2DEG)));
    const t2 = Math.round(Math.max(-MAX_TICKS, Math.min(MAX_TICKS, deg2 / TICS2DEG)));

    log(`Move → Ax1: ${deg1.toFixed(3)}° (${t1} tics)  Ax2: ${deg2.toFixed(3)}° (${t2} tics)`);

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

window.goToPosition      = goToPosition;
window.motorsOn          = motorsOn;
window.motorsOff         = motorsOff;
window.toggleTheme       = toggleTheme;
window.about             = about;
window.emergencyStop     = emergencyStop;
window.jog               = jog;
window.jogHome           = jogHome;
window.setHomeForAllAxes = setHomeForAllAxes;

// Initialise UI state
setConnectedUi(false);
