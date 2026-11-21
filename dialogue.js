import { portrait } from './actors.js';
import { storyFor } from './story.js';
import { PLANTS } from './engine.js';

const BIOMES = ['pradera', 'bosque', 'valle', 'lunar'];
const PLANT_TYPES = new Set(['pea', 'sun', 'ice', 'bomb', 'thorn', 'spore']);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A short, self-paced story. Closing programmatically never starts a mission. */
export class Dialogue {
  constructor(dialog, { onFinish = () => {}, onEnabledChange = () => {} } = {}) {
    this.dialog = dialog;
    this.onFinish = onFinish;
    this.onEnabledChange = onEnabledChange;
    this.active = false;
    this.index = 0;
    this.story = null;
    this.speech = null;
    this.voice = null;

    const shell = element('div', 'story-shell');
    const heading = element('header', 'story-heading');
    const titleWrap = element('div', 'story-title-wrap');
    this.chapter = element('p', 'story-chapter');
    this.title = element('h2', '', 'Una aventura en la huerta');
    this.title.id = 'story-title';
    titleWrap.append(this.chapter, this.title);
    this.skip = element('button', 'story-skip', 'Saltar historia');
    this.skip.type = 'button';
    this.skip.addEventListener('click', () => this.finish());
    heading.append(titleWrap, this.skip);

    this.scene = element('div', 'story-scene');
    this.scene.setAttribute('aria-hidden', 'true');
    const scenery = element('div', 'story-scenery');
    this.figure = element('canvas', 'story-portrait');
    this.figure.width = 360;
    this.figure.height = 360;
    this.scene.append(scenery, this.figure);

    const dialogue = element('section', 'story-dialogue');
    this.speaker = element('h3', 'story-speaker');
    this.speaker.id = 'story-speaker';
    dialogue.setAttribute('aria-labelledby', 'story-speaker');
    this.words = element('p', 'story-words');
    this.words.setAttribute('role', 'status');
    this.words.setAttribute('aria-live', 'polite');
    this.words.setAttribute('aria-atomic', 'true');
    const controls = element('div', 'story-controls');
    this.progress = element('span', 'story-progress');
    this.listen = element('button', 'story-listen', 'Escuchar');
    this.listen.type = 'button';
    this.listen.hidden = true;
    this.listen.addEventListener('click', () => this.readAloud());
    this.next = element('button', 'story-next', 'Siguiente');
    this.next.type = 'button';
    this.next.addEventListener('click', () => this.advance());
    controls.append(this.progress, this.listen, this.next);
    dialogue.append(this.speaker, this.words, controls);

    const preference = element('label', 'story-preference');
    this.enabled = element('input');
    this.enabled.type = 'checkbox';
    this.enabled.checked = true;
    this.enabled.addEventListener('change', () => this.onEnabledChange(this.enabled.checked));
    preference.append(this.enabled, element('span', '', 'Ver la historia antes de cada misión'));
    shell.append(heading, this.scene, dialogue, preference);
    dialog.replaceChildren(shell);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.finish();
    });
    // Voice discovery stays on this device. No remote voice or automatic reading.
    this.refreshVoices = () => {
      this.voice = window.speechSynthesis?.getVoices().find((voice) => voice.localService === true && /^es(?:-|$)/i.test(voice.lang)) || null;
      this.listen.hidden = !this.voice;
    };
    window.speechSynthesis?.addEventListener('voiceschanged', this.refreshVoices);
    this.refreshVoices();
  }

  get isOpen() { return this.dialog.open; }

  show(level, family, { enabled = true } = {}) {
    this.close();
    this.story = storyFor(level, family);
    this.index = 0;
    this.epilogue = Number(typeof level === 'object' ? level.id ?? level.number : level) === 21;
    const number = Number(typeof level === 'object' ? level.id ?? level.number : level) || 1;
    const region = typeof level === 'object' && Number.isInteger(level.region) ? level.region : Math.floor((Math.min(number, 20) - 1) / 5);
    this.scene.dataset.biome = BIOMES[Math.max(0, Math.min(3, region))];
    this.chapter.textContent = this.epilogue ? 'El final de nuestra aventura' : `Misión ${number} · Nuestra aventura`;
    this.title.textContent = this.story.title;
    this.enabled.checked = enabled;
    this.active = true;
    this.renderLine();
    if (!this.active) return;
    this.dialog.showModal();
    this.next.focus({ preventScroll: true });
  }

  renderLine() {
    const line = this.story.lines[this.index];
    if (!line) { this.finish(); return; }
    const speaker = line.speaker;
    const name = typeof speaker === 'object' ? speaker.name : PLANTS.find((plant) => plant.id === speaker)?.name;
    const candidate = typeof speaker === 'object' ? speaker.type : speaker;
    const type = PLANT_TYPES.has(candidate) ? candidate : 'sun';
    this.figure.getContext('2d').clearRect(0, 0, 360, 360);
    this.figure.getContext('2d').drawImage(portrait(type), 0, 0, 360, 360);
    this.speaker.textContent = name || 'La huerta';
    this.words.textContent = line.text;
    this.progress.textContent = `${this.index + 1} de ${this.story.lines.length}`;
    this.next.textContent = this.index === this.story.lines.length - 1 ? (this.epilogue ? 'Terminar' : '¡A la huerta!') : 'Siguiente →';
  }

  advance() {
    if (!this.active) return;
    this.stopReading();
    if (this.index >= this.story.lines.length - 1) this.finish();
    else { this.index++; this.renderLine(); }
  }

  readAloud() {
    if (!this.active || !this.voice) return;
    this.stopReading();
    const speech = new SpeechSynthesisUtterance(`${this.speaker.textContent}. ${this.words.textContent}`);
    speech.voice = this.voice;
    speech.lang = this.voice.lang;
    speech.rate = 0.9;
    this.speech = speech;
    this.listen.textContent = 'Volver a escuchar';
    window.speechSynthesis.speak(speech);
  }

  stopReading() {
    // Only cancel synthesis after this dialogue has requested speech.
    if (this.speech) window.speechSynthesis?.cancel();
    this.speech = null;
    this.listen.textContent = 'Escuchar';
  }

  finish() {
    if (!this.active) return;
    this.close();
    this.onFinish();
  }

  close() {
    this.active = false;
    this.stopReading();
    if (this.dialog.open) this.dialog.close();
  }
}
