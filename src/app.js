// UI logic only. Low-level motor protocol is in nanotec-canopen.js.

const NODES    = [1, 2];
const TICS2DEG = 6.3178e-04;   // encoder ticks → degrees
const MAX_TICKS = 20000;        // hard travel limit (±)

let drive = null;
let pollTimer = null;

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
  const existing = document.getElementById('about-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'about-modal';
  modal.classList.add('scenario-submenu');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 30px 40px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    z-index: 1000;
    min-width: 340px;
    text-align: center;
  `;
  modal.innerHTML = `
    <h3 style="margin-top:0;">Nanotec CANopen Control</h3>
    <p style="color:var(--color-text-muted); margin:16px 0;">
      Browser-based Web Serial control panel<br>
      for Nanotec PD6-E-M motors via ZK-USB-CAN-1.
    </p>
    <p style="margin:16px 0;">
      Blau Robotics<br>
      <a href="mailto:amihay@blaurobotics.co.il"
         style="color:var(--color-btn-action); text-decoration:none;">
        amihay@blaurobotics.co.il
      </a>
    </p>
    <button onclick="document.getElementById('about-modal').remove()"
            style="margin-top:10px; padding:8px 24px;
                   background:var(--color-btn-action); color:#fff;
                   border:none; border-radius:8px; cursor:pointer;">
      Close
    </button>
  `;
  document.body.appendChild(modal);
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
    set("cur1", (Number(cur1raw) / 10).toFixed(2));
    set("cur2", (Number(cur2raw) / 10).toFixed(2));
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

window.goToPosition  = goToPosition;
window.motorsOn      = motorsOn;
window.motorsOff     = motorsOff;
window.toggleTheme   = toggleTheme;
window.about         = about;
window.emergencyStop = emergencyStop;

// Initialise UI state
setConnectedUi(false);
