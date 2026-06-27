/**
 * Panel UI — Movement Control side-panel open/close.
 * Builds and destroys the Movement Control panel and adjusts the
 * main-content margin so nothing is hidden behind it.
 */

function MovementControl() {
  document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('movement-control-button').classList.add('active');

  const existing = document.getElementById('movement-control-panel');
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'movement-control-panel';
  panel.classList.add('movement-panel');
  panel.innerHTML = `
    <div class="panel-header">
      <h1>Movement Control</h1>
      <button class="panel-close-btn" onclick="closeMovementControl()">&#x00D7;</button>
    </div>

    <div class="target-control" title="Axis 1 target position">
      <label for="target1">Axis 1</label>
      <input type="number" id="target1" value="0" step="1" style="width:70px;" />
    </div><br>

    <div class="target-control" title="Axis 2 target position">
      <label for="target2">Axis 2</label>
      <input type="number" id="target2" value="0" step="1" style="width:70px;" />
    </div><br>

    <div class="target-control" title="Profile velocity (visual only — not yet wired to move command)">
      <label for="movementVelocity">Velocity</label>
      <input type="number" id="movementVelocity" value="1000" min="1" style="width:70px;" />
    </div><br>

    <div class="target-control" style="display:flex; justify-content:center; margin-top:10px;">
      <button id="go"
              onclick="goToPosition()"
              style="background-color:var(--color-btn-active); color:var(--color-text-active); min-width:140px;">
        Go to Position
      </button>
    </div><br>

    <hr>

    <div class="target-control" style="display:flex; justify-content:center; margin-top:16px; gap:12px;">
      <button onclick="motorsOn()"
              style="background-color:var(--color-btn-action); color:var(--color-text-active); min-width:100px;">
        Motors ON
      </button>
      <button onclick="motorsOff()"
              style="background-color:var(--color-btn-action); color:var(--color-text-active); min-width:100px;">
        Motors OFF
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById('main-content').style.marginLeft = '720px';
}

function closeMovementControl() {
  const panel = document.getElementById('movement-control-panel');
  if (panel) {
    panel.remove();
  }
  document.getElementById('main-content').style.marginLeft = '370px';

  document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('movement-control-button').classList.add('active');
}

window.MovementControl      = MovementControl;
window.closeMovementControl = closeMovementControl;
