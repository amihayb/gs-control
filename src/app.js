// UI logic only. Low-level motor protocol is in nanotec-canopen.js.

const NODES = [1, 2];
let drive = null;
let pollTimer = null;

const $ = id => document.getElementById(id);

function log(message) {
  console.log(message);
  $("log").textContent += message + "\n";
  $("log").scrollTop = $("log").scrollHeight;
}

// ==================== Theme ====================

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('gs-theme', 'light');
    $('theme-toggle-btn').textContent = '☾';
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('gs-theme', 'dark');
    $('theme-toggle-btn').textContent = '☀';
  }
}

// Set initial icon to match applied theme
(function () {
  const theme = localStorage.getItem('gs-theme') || 'dark';
  const btn = $('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
})();

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
    const p1 = await drive.readPosition(1);
    const p2 = await drive.readPosition(2);
    const pos1 = $("pos1");
    const pos2 = $("pos2");
    if (pos1) pos1.value = p1;
    if (pos2) pos2.value = p2;
  } catch (e) {
    log(`Position poll failed: ${e.message || e}`);
  }
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
      pollTimer = setInterval(pollPositions, 500);
      await pollPositions();
      setConnectedUi(true);
    } catch (e) {
      log(`Connect failed: ${e.message || e}`);
      drive = null;
      this.checked = false;
      setConnectedUi(false);
    }
  } else {
    // Disconnect
    clearInterval(pollTimer);
    pollTimer = null;
    try {
      if (drive) await drive.disconnect();
    } catch (e) {
      log(`Disconnect failed: ${e.message || e}`);
    }
    drive = null;
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

// ==================== Movement panel actions ====================

// Called from the Go to Position button inside panelUI.js
async function goToPosition() {
  if (!drive) {
    log("Not connected.");
    return;
  }
  try {
    const p1 = Number($("target1").value);
    const p2 = Number($("target2").value);
    await drive.moveAbs(1, p1);
    await drive.moveAbs(2, p2);
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

window.goToPosition = goToPosition;
window.motorsOn     = motorsOn;
window.motorsOff    = motorsOff;
window.toggleTheme  = toggleTheme;

// Initialise UI state
setConnectedUi(false);
