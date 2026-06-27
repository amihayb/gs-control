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

function setConnectedUi(connected) {
  $("status").textContent = connected ? "Connected" : "Disconnected";
  $("connect").disabled = connected;
  $("disconnect").disabled = !connected;
  $("on").disabled = !connected;
  $("off").disabled = !connected;
  $("go").disabled = !connected;
}

async function pollPositions() {
  if (!drive) return;

  try {
    $("pos1").textContent = await drive.readPosition(1);
    $("pos2").textContent = await drive.readPosition(2);
  } catch (e) {
    log(`Position poll failed: ${e.message || e}`);
  }
}

$("connect").onclick = async () => {
  try {
    drive = new NanotecCanopen({
      nodes: NODES,
      canInitIndex: 0,       // CAN = 1 Mbit/s
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
    setConnectedUi(false);
  }
};

$("disconnect").onclick = async () => {
  clearInterval(pollTimer);
  pollTimer = null;

  try {
    if (drive) await drive.disconnect(); // includes motorsOff()
  } catch (e) {
    log(`Disconnect failed: ${e.message || e}`);
  }

  drive = null;
  setConnectedUi(false);
};

$("on").onclick = async () => {
  try {
    await drive.motorsOn();
  } catch (e) {
    log(`Motors ON failed: ${e.message || e}`);
  }
};

$("off").onclick = async () => {
  try {
    await drive.motorsOff();
  } catch (e) {
    log(`Motors OFF failed: ${e.message || e}`);
  }
};

$("go").onclick = async () => {
  try {
    const p1 = Number($("target1").value);
    const p2 = Number($("target2").value);

    await drive.moveAbs(1, p1);
    await drive.moveAbs(2, p2);
  } catch (e) {
    log(`Move failed: ${e.message || e}`);
  }
};

setConnectedUi(false);
