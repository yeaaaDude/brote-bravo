import { icon } from './icons.js';
import { portrait } from './actors.js';
import { PLANTS, LEVELS, ENEMIES } from './engine.js';

const REGION_IMAGES = ['pradera', 'bosque', 'valle', 'lunar'];
const REGION_NAMES = ['Pradera del Alba', 'Bosque Susurrante', 'Valle de Escarcha', 'Jardín Lunar'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const padded = value => String(value).padStart(2, '0');
const plantLevel = plant => plant.unlockLevel ?? ({ pea:1, sun:1, ice:3, bomb:6, thorn:11, spore:16 }[plant.id] || 1);
const enemyLevel = enemy => enemy.unlockLevel ?? ({ bug:1, runner:4, tank:7, shield:9, boss:10, mender:13 }[enemy.id] || 1);
const regionOf = level => level?.region ?? Math.floor(((level?.id || 1) - 1) / 5);
const regionName = level => level?.regionName || REGION_NAMES[regionOf(level)];
const title = (eyebrow, heading, copy) => `<header class="panel-heading"><span class="panel-eyebrow">${eyebrow}</span><h2 id="dialog-title">${heading}</h2>${copy ? `<p>${copy}</p>` : ''}</header>`;
const button = (action, text, symbol = '', style = 'solid') => `<button class="panel-button panel-button--${style}" data-panel-action="${action}">${symbol ? icon(symbol) : ''}<span>${text}</span></button>`;

/** Modal views. The host owns simulation state and persistence. */
export class Panels {
  constructor(dialog, callbacks = {}) {
    this.dialog = dialog;
    this.content = dialog.querySelector('#dialog-content');
    this.callbacks = callbacks;
    this.context = {};
    dialog.querySelector('#close')?.addEventListener('click', () => this.dismiss());
    dialog.addEventListener('cancel', event => { event.preventDefault(); this.dismiss(); });
    this.content.addEventListener('click', event => {
      const control = event.target.closest('[data-panel-action]');
      if (!control || control.disabled) return;
      const action = control.dataset.panelAction;
      if (action === 'close') this.dismiss();
      else if (action === 'restart') this.show('restart', this.context);
      else if (action === 'back-pause') this.show('pause', this.context);
      else if (action === 'level') callbacks.onLevel?.(Number(control.dataset.level));
      else if (action === 'retry') callbacks.onRetry?.();
      else if (action === 'next') callbacks.onNext?.();
      else if (action === 'campaign') callbacks.onCampaign?.();
    });
  }

  get isOpen() { return this.dialog.open; }
  close() { if (this.dialog.open) this.dialog.close(); }
  dismiss() { this.close(); this.callbacks.onClose?.(); }

  show(kind, context = {}) {
    this.context = context;
    this.kind = kind;
    this.dialog.dataset.panel = kind;
    const render = { campaign: this.campaign, guide: this.guide, pause: this.pause, won: this.won, lost: this.lost, restart: this.restart }[kind];
    this.content.innerHTML = render ? render.call(this, context) : '';
    this.content.querySelectorAll('[data-portrait]').forEach(node => {
      const art = portrait(node.dataset.portrait);
      // portrait() caches its source canvas; each view gets its own image.
      const canvas = document.createElement('canvas');
      canvas.width = art.width; canvas.height = art.height;
      canvas.getContext('2d').drawImage(art, 0, 0);
      canvas.setAttribute('aria-hidden', 'true');
      node.append(canvas);
    });
    if (!this.dialog.open) this.dialog.showModal();
    this.content.querySelector('[data-autofocus]')?.focus({ preventScroll:true });
  }

  milestones(levelNumber) {
    const level = LEVELS[levelNumber - 1];
    const previous = LEVELS[levelNumber - 2];
    const items = [];
    for (const plant of PLANTS.filter(item => plantLevel(item) === levelNumber)) items.push({ type:'planta', name:plant.name, description:plant.ability, id:plant.id, symbol:'leaf' });
    for (const enemy of ENEMIES.filter(item => enemyLevel(item) === levelNumber)) items.push({ type:enemy.id === 'boss' ? 'jefe' : 'enemigo', name:enemy.name, description:enemy.ability, id:enemy.id, symbol:enemy.id === 'boss' ? 'trophy' : 'horde' });
    if (levelNumber === 15 || levelNumber === 20) {
      const boss = ENEMIES.find(enemy => enemy.id === 'boss');
      if (boss) items.push({ type:'jefe', name:boss.name, description:'Vuelve para liderar la última horda.', id:boss.id, symbol:'trophy', encounter:true });
    }
    if (level && (!previous || regionOf(level) !== regionOf(previous))) {
      items.push({ type:'región', name:regionName(level), description:'Un nuevo paisaje para tu huerta.', symbol:'map' });
      if (level.terrainName) items.push({ type:'regla', name:level.terrainName, description:level.terrainDescription || '', symbol:'layers' });
    }
    return items;
  }

  campaign({ game, progress = {} }) {
    const unlocked = Math.max(1, Math.min(20, progress.unlocked || 1));
    const best = progress.best || {};
    const completed = LEVELS.filter(level => best[level.id] > 0).length;
    return `${title('TU AVENTURA · 20 MISIONES', 'De brote a leyenda.', 'Cuatro regiones, una huerta que defender. Elegí una misión y prepará tu estrategia.')}
      <div class="campaign-summary"><span>${icon('trophy')}<b>${completed}<small> / 20</small></b> superadas</span><span>${icon('flag')}<b>${padded(unlocked)}</b> última desbloqueada</span><div class="campaign-progress" role="progressbar" aria-label="Misiones superadas" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="20"><i style="width:${completed * 5}%"></i></div></div>
      <div class="campaign-regions">${REGION_IMAGES.map((image, region) => {
        const missions = LEVELS.filter(level => regionOf(level) === region);
        const first = missions[0];
        return `<section class="region-card ${unlocked < (first?.id || 1) ? 'region-card--locked' : ''}"><div class="region-banner" style="--region-image:url('./assets/${image}.webp')"><span class="region-index">REGIÓN ${padded(region + 1)}</span><h3>${esc(regionName(first))}</h3><span class="region-terrain">${icon('layers')}${esc(first?.terrainName || ['Suelo fértil', 'Raíces fuertes', 'Tramo de nieve', 'Pulso lunar'][region])}</span></div><div class="region-missions">${missions.map(level => {
          const locked = level.id > unlocked;
          const lives = Math.max(0, Math.min(5, Number(best[level.id]) || 0));
          const current = game?.level === level.id;
          const milestones = this.milestones(level.id);
          return `<button class="mission-tile ${locked ? 'mission-tile--locked' : ''} ${current ? 'mission-tile--current' : ''} ${lives ? 'mission-tile--done' : ''}" data-panel-action="level" data-level="${level.id}" ${locked ? 'disabled' : ''} ${current ? 'aria-current="step"' : ''} aria-label="Nivel ${level.id}: ${esc(level.name)}. ${locked ? `Bloqueado. Superá el nivel ${level.id - 1}.` : lives ? `Superado con ${lives} vidas. Repetir misión.` : 'Disponible. Preparar misión.'}"><span class="mission-number">${locked ? icon('lock') : padded(level.id)}</span><span class="mission-detail"><strong>${esc(level.name)}</strong><span class="mission-tags">${milestones.length ? milestones.map(item => `<span class="milestone-tag milestone-tag--${item.type === 'jefe' ? 'boss' : item.type === 'planta' ? 'plant' : 'other'}">${icon(item.symbol)}${esc(item.type)}: ${esc(item.name)}</span>`).join('') : `<span>${esc(level.description || 'Defendé las cinco filas.')}</span>`}</span><span class="mission-state">${locked ? `Superá la misión ${padded(level.id - 1)}` : lives ? `${this.hearts(lives)}<span>Repetir misión</span>` : `${icon('play')}<span>${current ? 'Misión actual · Preparar' : 'Preparar misión'}</span>`}</span></span>${!locked ? `<span class="mission-arrow" aria-hidden="true">↗</span>` : ''}</button>`;
        }).join('')}</div></section>`;
      }).join('')}</div><div class="panel-footer"><p>${icon('heart')}Tu mejor resultado se guarda con las vidas que conservaste.</p>${button('close', 'Volver a la huerta', 'leaf', 'ghost')}</div>`;
  }

  hearts(lives) {
    return `<span class="result-hearts" aria-label="${lives} de 5 vidas">${Array.from({length:5}, (_, i) => `<i class="${i < lives ? 'is-filled' : ''}">${icon('heart')}</i>`).join('')}</span>`;
  }

  guide({ progress = {} }) {
    const unlocked = progress.unlocked || 1;
    return `${title('MANUAL DE CAMPO', 'La huerta se defiende en equipo.', 'Cargá la honda, medí cada lanzamiento y frená a los espantajos antes de que crucen el borde izquierdo.')}
      <div class="guide-steps"><article><span class="step-index">01</span><div class="guide-step-icon">${icon('layers')}</div><h3>Cargá tu planta</h3><p>Tocá una carta del arsenal para cargar la honda. Cada planta tiene un costo de energía y un trabajo distinto.</p></article><article><span class="step-index">02</span><div class="guide-step-icon">${icon('gesture')}</div><h3>Tensá, apuntá y soltá</h3><p>Apoyá el dedo sobre la honda y tirá <strong>hacia atrás</strong>. Más distancia da más potencia. Mové el dedo arriba o abajo para cambiar el carril; soltá para lanzar.</p></article><article><span class="step-index">03</span><div class="guide-step-icon">${icon('target')}</div><h3>Leé el viento</h3><p>La flecha indica hacia dónde sopla y su intensidad: <strong>calma, brisa o ráfaga</strong>. El viento desvía la planta: compensalo al apuntar. Los puntos muestran sólo el inicio del vuelo.</p></article></div>
      <div class="guide-note">${icon('gesture')}<p><strong>Aprendé en calma:</strong> la primera misión no tiene viento. La planta viaja desde la honda y se planta al aterrizar. Tensá y soltá cada tiro para practicar antes de pulsar «Iniciar horda».</p></div>
      <div class="guide-note guide-note--strategy">${icon('book')}<p><strong>Con teclado:</strong> enfocá el campo con Tab, ajustá fuerza y dirección con las flechas y soltá Espacio para lanzar. Tab recorre los controles; Escape cierra esta ventana.</p></div>
      <div class="guide-note guide-note--strategy">${icon('sun')}<p><strong>Si el tiro falla:</strong> cuando la planta cae fuera del campo o en una casilla ocupada, recuperás la mitad de la energía del lanzamiento. Medí la tensión y el viento antes de soltar.</p></div>
      <section class="guide-section"><h3>${icon('leaf')} Tu equipo vegetal</h3><div class="guide-actors">${PLANTS.map(plant => this.actorCard(plant, plantLevel(plant), unlocked, 'planta')).join('')}</div></section>
      <section class="guide-section"><h3>${icon('horde')} Conocé a los espantajos</h3><div class="guide-actors guide-actors--enemies">${ENEMIES.map(enemy => this.actorCard(enemy, enemyLevel(enemy), unlocked, 'enemigo')).join('')}</div></section>
      <section class="guide-section"><h3>${icon('map')} Cada región cambia las reglas</h3><div class="guide-rules">${REGION_IMAGES.map((_, region) => { const level = LEVELS.find(item => regionOf(item) === region); return `<article><b>${padded(region + 1)} · ${esc(regionName(level))}</b><p>${esc(level?.terrainDescription || ['Las casillas potenciadas mejoran tu defensa: mirá sus marcas.', 'Buscá las casillas potenciadas para aprovechar cada planta.', 'El tramo de nieve ralentiza a los espantajos que lo cruzan.', 'Un pulso periódico te da energía extra para seguir plantando.'][region])}</p></article>`; }).join('')}</div></section>
      <div class="guide-note guide-note--strategy">${icon('sun')}<p><strong>Un buen comienzo:</strong> plantá Girasoles para producir energía, cubrí cada fila con Guisantes y reservá energía para reaccionar. Si un espantajo escapa, perdés una vida. Con cero vidas termina la misión.</p></div><div class="panel-actions">${button('close', '¡A plantar!', 'leaf')}</div>`;
  }

  actorCard(actor, unlock, unlocked, type) {
    return `<article class="guide-actor ${unlock > unlocked ? 'guide-actor--locked' : ''}"><div class="actor-portrait" data-portrait="${esc(actor.id)}"></div><div><span class="actor-unlock">${unlock > unlocked ? icon('lock') : icon('check')}${unlock > unlocked ? `Misión ${padded(unlock)}` : unlock === 1 ? 'Desde el inicio' : `Desde misión ${padded(unlock)}`}</span><h4>${esc(actor.name)}</h4><p>${esc(actor.ability || actor.description)}</p>${type === 'planta' ? `<span class="actor-cost">${icon('sun')}${actor.cost} energía</span>` : ''}</div></article>`;
  }

  pause({ game }) {
    const level = LEVELS[(game?.level || 1) - 1];
    return `<div class="compact-panel"><div class="panel-emblem">${icon('pause')}</div>${title('TOMATE UN RESPIRO', 'La huerta te espera.', `Misión ${padded(game?.level || 1)} · ${esc(level?.name)}. La partida está en pausa. Al volver, tensá la honda hacia atrás y compensá el viento antes de soltar.`)}<div class="pause-stats"><span>${icon('heart')}<b>${game?.lives ?? 5}</b> vidas</span><span>${icon('horde')}<b>${game?.wave || 1} / ${game?.totalWaves || level?.waves || 1}</b> hordas</span></div><div class="panel-actions panel-actions--stack">${button('close', game?.phase === 'ready' ? 'Volver a preparar' : 'Seguir jugando', 'play')}${button('campaign', 'Elegir otra misión', 'map', 'ghost')}${button('restart', 'Reiniciar esta misión', 'restart', 'quiet')}</div></div>`;
  }

  restart({ game, targetLevel }) {
    const destination = targetLevel ? LEVELS[targetLevel - 1] : null;
    const changing = destination && targetLevel !== game?.level;
    return `<div class="compact-panel"><div class="panel-emblem panel-emblem--warm">${icon('restart')}</div>${title(changing ? 'CAMBIAR DE MISIÓN' : 'EMPEZAR OTRA PREPARACIÓN', changing ? '¿Vamos a otra huerta?' : '¿Otra estrategia?', `${changing ? `Vas a preparar la misión ${padded(targetLevel)}: ${esc(destination.name)}.` : 'Vas a empezar una preparación desde cero.'} Perdés el avance de esta partida; tu progreso de campaña y tus mejores resultados se conservan.`)}<div class="panel-actions panel-actions--stack">${button('retry', 'Confirmar y preparar misión', 'restart')}${button('close', 'Cancelar y volver al juego', '', 'ghost')}</div></div>`;
  }

  won({ game, progress = {} }) {
    const levelNumber = game?.level || 1;
    const final = levelNumber >= LEVELS.length;
    const next = LEVELS[levelNumber];
    const lives = Math.max(0, Math.min(5, game?.lives || 0));
    const nextMilestones = final ? [] : this.milestones(levelNumber + 1);
    const unlocks = nextMilestones.filter(item => !item.encounter);
    const bossEncounter = nextMilestones.find(item => item.encounter);
    let future = null;
    for (let level = levelNumber + 2; level <= LEVELS.length; level++) {
      const milestone = this.milestones(level).find(item => item.type === 'planta' || item.type === 'región' || item.type === 'jefe' || item.type === 'enemigo');
      if (milestone) { future = { level, ...milestone }; break; }
    }
    return `<div class="result-panel"><div class="panel-emblem">${icon('trophy')}</div>${title(final ? 'CAMPAÑA COMPLETADA' : `MISIÓN ${padded(levelNumber)} SUPERADA`, final ? 'La huerta es leyenda.' : '¡Bien plantado!', final ? 'De la pradera a la luna: defendiste las veinte misiones. Volvé a tus favoritas y buscá las cinco vidas.' : 'La huerta resistió. Podés seguir a la próxima misión o repetir para mejorar tu marca.')}<div class="victory-lives">${this.hearts(lives)}<strong>${lives} ${lives === 1 ? 'vida conservada' : 'vidas conservadas'}</strong>${Number(progress.best?.[levelNumber]) > lives ? `<small>Tu mejor marca: ${progress.best[levelNumber]} vidas</small>` : ''}</div>
      ${!final ? `<section class="next-mission"><span class="panel-eyebrow">SIGUIENTE · MISIÓN ${padded(levelNumber + 1)}</span><h3>${esc(next?.name)}</h3><p>${esc(regionName(next))} · ${esc(next?.terrainName || '')}</p>${unlocks.length ? `<div class="unlock-heading">${icon('check')}Disponible desde esta misión</div><div class="unlock-list">${unlocks.map(item => `<article>${item.id ? `<span class="unlock-portrait" data-portrait="${esc(item.id)}"></span>` : `<span class="unlock-icon">${icon(item.symbol)}</span>`}<div><small>${esc(item.type)}</small><b>${esc(item.name)}</b><p>${esc(item.description)}</p></div></article>`).join('')}</div>` : `<div class="no-unlock">${icon('target')}Sin plantas ni enemigos nuevos en la próxima misión. Poné a prueba lo que ya tenés.</div>`}</section>${bossEncounter ? `<p class="next-goal">${icon('trophy')}Desafío de la próxima misión: <strong>${esc(bossEncounter.name)}</strong> en la última horda.</p>` : ''}${future ? `<p class="next-goal">${icon('flag')}Próxima meta: <strong>${esc(future.name)}</strong> en la misión ${padded(future.level)}.</p>` : `<p class="next-goal">${icon('flag')}Próxima meta: completar las veinte misiones con cinco vidas.</p>`}` : `<div class="campaign-finish">${icon('leaf')}20 misiones · 4 regiones · una huerta imparable</div>`}
      <div class="panel-actions">${final ? button('campaign', 'Ver mi campaña', 'map') : button('next', 'Preparar siguiente misión', 'play')}${button('retry', 'Repetir misión', 'restart', 'ghost')}${!final ? button('campaign', 'Ver campaña', 'map', 'quiet') : ''}</div></div>`;
  }

  lost({ game }) {
    return `<div class="compact-panel"><div class="panel-emblem panel-emblem--warm">${icon('leaf')}</div>${title(`MISIÓN ${padded(game?.level || 1)} · FIN DE PARTIDA`, 'Siempre hay otro brote.', 'Los espantajos cruzaron la huerta. Lanzá Girasoles temprano para producir energía y cubrí las cinco filas. Ajustá potencia y dirección según el viento.')}<div class="defeat-tip">${icon('target')}Reintentá desde la preparación: practicá la tensión de la honda antes de iniciar la horda. Si caés fuera del campo o sobre una planta, recuperás la mitad de la energía.</div><div class="panel-actions panel-actions--stack">${button('retry', 'Volver a intentarlo', 'restart')}${button('campaign', 'Elegir otra misión', 'map', 'ghost')}</div></div>`;
  }
}
