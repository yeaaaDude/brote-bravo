/** Continuous slingshot physics in the field's 1600 × 700 world coordinates. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => Number.isFinite(value) ? value : 0;

/**
 * Wind is a deterministic acceleration, snapshotted when the seed is released.
 * speed is world units/s², not km/h. angle follows CSS: right=0°, down=90°.
 */
export function windAt(level = 1, time = 0) {
  const mission = clamp(Math.floor(finite(level)) || 1, 1, 20);
  const t = finite(time);
  if (mission === 1) return { x: 0, y: 0, speed: 0, angle: 0, label: 'Calma' };
  const region = Math.floor((mission - 1) / 5);
  const phase = mission * .37;
  const gust = .5 + .5 * Math.sin(t * [.65, .83, 1.03, .76][region] + phase);
  const speed = [11 + mission * 1.3, 25, 45, 35][region] + [7, 55, 70, 110][region] * gust;
  const direction = region === 0 ? .15 + .32 * Math.sin(t * .18 + phase)
    : region === 1 ? 3.5 + 1.45 * Math.sin(t * .22 + phase)
      : region === 2 ? .35 + 1.6 * Math.sin(t * .29 + phase)
        : t * .34 + phase;
  const x = Math.cos(direction) * speed;
  const y = Math.sin(direction) * speed;
  const angle = ((direction * 180 / Math.PI) % 360 + 360) % 360;
  return { x, y, speed, angle, label: speed < 12 ? 'Calma' : speed < 65 ? 'Brisa' : 'Ráfaga' };
}

/** No target cell is accepted. Pull and the current wind fully determine flight. */
export function makeThrow(pull = {}, wind = {}) {
  const displacement = Object.freeze({ x: clamp(finite(pull.x), -110, 0), y: clamp(finite(pull.y), -70, 70) });
  const strength = Math.hypot(displacement.x, displacement.y);
  const duration = 1.05 + strength * .003;
  const gravity = 700;
  return Object.freeze({
    duration,
    pull: displacement,
    origin: Object.freeze({ x: 164 + displacement.x, y: 451 + displacement.y, z: 0 }),
    velocity: Object.freeze({ x: -displacement.x * 10.8, y: -displacement.y * 4.4, z: gravity * duration / 2 }),
    wind: Object.freeze({ x: finite(wind.x), y: finite(wind.y) }),
    gravity,
  });
}

/** Planar flight plus a true parabolic height; impact is exactly z=0. */
export function sampleThrow(shot, elapsedSeconds = 0) {
  const t = clamp(finite(elapsedSeconds), 0, shot.duration);
  return {
    x: shot.origin.x + shot.velocity.x * t + .5 * shot.wind.x * t * t,
    y: shot.origin.y + shot.velocity.y * t + .5 * shot.wind.y * t * t,
    z: t >= shot.duration ? 0 : Math.max(0, shot.velocity.z * t - .5 * shot.gravity * t * t),
  };
}

/** The same trapezoid used by field.js: 5 rows, 8 columns, no snapping in flight. */
export function landingCell(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const row = Math.floor((y - 208) / 77);
  if (row < 0 || row >= 5) return null;
  const depth = (y - 208) / (77 * 5);
  const left = 363 - depth * 72;
  const right = 1390 + depth * 65;
  const col = Math.floor((x - left) / (right - left) * 8);
  return col >= 0 && col < 8 ? { row, col } : null;
}
