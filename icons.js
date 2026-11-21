const shapes = {
  chat:'<path d="M4 4h16v13H11l-6 5v-5H3V5a1 1 0 0 1 1-1Z"/><path d="M7 10h.01m5 0h.01m5 0h.01" stroke-width="2.6"/>',
  wind:'<path d="M3 8h11m-8 4h15m-10 4h3m2-9 5 5-5 5"/>',
  gamepad:'<path d="M7 7h10c2 0 3 2 4 5l1 5c.5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2l1-5c1-3 2-5 4-5Z"/><path d="M7 10v4m-2-2h4m7 0h.01m3-2h.01"/>',
  map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2Zm6-2v15m6-12v15"/>',
  book:'<path d="M12 6c-4-3-7-3-10-2v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2Zm0 0v15"/>',
  sound:'<path d="m4 9 4 0 5-4v14l-5-4H4zM16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  mute:'<path d="m3 9 4 0 5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',
  expand:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
  flag:'<path d="M5 21V4m1 1c4-5 7 3 14-1l-2 5 2 4c-7 4-10-4-14 0"/>',
  play:'<path fill="currentColor" stroke="none" d="M6 3.7c0-.9 1-1.5 1.8-.9l13 8.3c.8.5.8 1.4 0 1.9l-13 8.3c-.8.5-1.8 0-1.8-.9z"/>',
  pause:'<path stroke-width="4.5" d="M8 5v14m8-14v14"/>',
  sun:'<g fill="currentColor" stroke="none"><path d="m12 0 2.1 3.6 3.9-1.1.6 4 3.9 1.4-2 3.6 2 3.6-3.9 1.4-.6 4-4-1-2 3.5-2.2-3.5-3.8 1-.7-4L1.4 15l2-3.5-2-3.6 3.9-1.4.7-4 3.8 1.1Z"/><circle cx="12" cy="11.6" r="5" fill="#ffb837" stroke="#ffe8a1" stroke-width="1.4"/></g>',
  heart:'<path fill="currentColor" stroke="none" d="M12 21 3.8 13C-3 6 6-1 11 5l1 1 1-1c5-6 14 1 7.2 8Z"/><path d="M5.5 8.5C5.5 7.2 6.2 6.8 7 6.7" stroke="#ffc4b6" stroke-width="2.1"/>',
  horde:'<path d="M2 18h20M4 18v-8l3-5 3 5v8m4 0V9l3-6 3 6v9M4 12h6m4-1h6"/>',
  gesture:'<path d="M6 13c-1.3-1.6-3-.4-2 1.2l3.3 5C8 20.5 9 21 11 21h4.2c2 0 3.8-1.8 4-4l.5-5.5c.1-1.5-1.5-2-2.4-1.2 0-1.7-2.4-2-3-.5 0-1.8-2.4-2-3-.3v-5c0-2-3-2-3 0v10z"/><path d="M4 6a6 6 0 0 1 3-5"/>',
  layers:'<path d="m3 9 9-5 9 5-9 5Zm0 4 9 5 9-5m-18 4 9 5 9-5"/>',
  close:'<path d="m5 5 14 14m0-14L5 19"/>', check:'<path d="m5 12 4.5 4.5L19 7"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  leaf:'<path d="M3 20C4 10 10 4 21 3c-1 11-5 18-15 15m0 0 10-10"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  trophy:'<path d="M7 3h10v6c0 4-2 6-5 6S7 13 7 9Zm10 2h4v3c0 3-2 5-5 5M7 5H3v3c0 3 2 5 5 5m4 3v4m-4 1h8"/>',
  restart:'<path d="M4 11a8 8 0 1 1 1.5 6M3 5v6h6"/>'
};
export function icon(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name] || '')+'</svg>';
}
export function drawIcons(root=document) {
  for(const node of root.querySelectorAll('[data-icon]')) node.innerHTML=icon(node.dataset.icon);
}
