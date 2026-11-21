import { Game, LEVELS, PLANTS } from './engine.js';
import { Field } from './field.js';
import { portrait } from './actors.js';
import { GameAudio } from './audio.js';
import { icon, drawIcons } from './icons.js';
import { Panels } from './panels.js';
import { windAt, makeThrow, sampleThrow, landingCell } from './ballistics.js';
import { readFamily } from './family.js';
import { Dialogue } from './dialogue.js';

const el = id => document.getElementById(id);
const world = el('world');
const action = el('action');
const arena = el('arena');
const storageKey = 'brote-bravo.campaign.v1';
const regions = ['pradera','bosque','valle','lunar'];
const roles = {pea:'Ataque a distancia', sun:'Genera energía', ice:'Ralentiza enemigos', bomb:'Daño en área', thorn:'Tiro perforante', spore:'Esporas venenosas'};
const deckOrder = ['pea','ice','bomb','sun','thorn','spore'];
const defs = new Map(PLANTS.map(p => [p.id,p]));
const clamp = (value, low, high) => Math.max(low,Math.min(high,value));
drawIcons();
for (const id of ['nav-game','nav-campaign','nav-story','nav-guide']) el(id).setAttribute('aria-label', el(id).textContent.trim());

function readProgress() {
  let input;
  try { input = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  const best = {};
  for (const [level,lives] of Object.entries(input?.best || {})) {
    if (Number.isInteger(+level) && +level>=1 && +level<=20 && Number.isInteger(lives) && lives>=1 && lives<=5) best[level]=lives;
  }
  const unlocked = Math.min(20, Math.max(0,...Object.keys(best).map(Number)) + 1);
  return {best,unlocked};
}
let progress=readProgress();
let game = new Game(progress.unlocked,progress.unlocked);
let selected='pea', pull=null, flight=null, pointer=null;
let lastWindPaint=-1;
let field, visualTime=0, previous=0, tipSeen=false, toastUntil=0, hudKey='', frameId=0;
let pendingLevel=null, endShown=false, muted=false;
const {family,personalized}=readFamily();
let storyEnabled=true, storyRead=false, afterStory='prepare';
try{storyEnabled=localStorage.getItem('brote-bravo.story')!=='off';}catch{}
try { muted=localStorage.getItem('brote-bravo.muted')==='true'; } catch {}
const audio = new GameAudio();
audio.setMuted(muted);
function wakeAudio(){
  if (!audio.context || audio.context.state!=='running') void audio.unlock();
}
document.addEventListener('pointerdown',wakeAudio,{capture:true,passive:true});
document.addEventListener('keydown',wakeAudio,{capture:true});

function announce(message,seconds=2.4){
  el('toast').textContent=message;
  el('toast').hidden=false;
  el('field-tip').hidden=true;
  toastUntil=performance.now()+seconds*1000;
}
function navState(active){
  for (const [id,kind] of [['nav-game','game'],['nav-campaign','campaign'],['nav-story','story'],['nav-guide','guide']]){
    const button=el(id);
    button.classList.toggle('current',kind===active);
    if(kind===active) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
}
function forgetPointer(){
  if(pointer && world.hasPointerCapture(pointer.id)) world.releasePointerCapture(pointer.id);
  pointer=null;pull=null;
}
function closePanel(){
  panels.close();
  navState('game');
  previous=0;
}
function chooseLevel(level) {
  if(!Number.isInteger(level) || level<1 || level>progress.unlocked) return;
  if(game.phase==='playing' || (game.phase==='ready' && tipSeen)){
    pendingLevel=level;
    openPanel('restart');
  } else loadLevel(level);
}
const panels = new Panels(el('dialog'),{
  onClose:()=>{navState('game');previous=0;pendingLevel=null;},
  onLevel:chooseLevel,
  onRetry:()=>loadLevel(pendingLevel ?? game.level),
  onNext:()=>loadLevel(Math.min(20,game.level+1)),
  onCampaign:()=>openPanel('campaign'),
});
const dialogue=new Dialogue(el('story-dialog'),{
  onEnabledChange:value=>{
    storyEnabled=Boolean(value);
    try{localStorage.setItem('brote-bravo.story',storyEnabled?'on':'off');}catch{}
  },
  onFinish:()=>{
    storyRead=true;navState('game');previous=0;
    const next=afterStory;afterStory='prepare';
    if(next==='battle')beginHorde();
    else if(next==='epilogue')openPanel('won');
  }
});
function showStory(then='prepare'){
  forgetPointer();afterStory=then;navState('story');
  dialogue.show(then==='epilogue'?21:game.level,family,{enabled:storyEnabled});
}
function openPanel(kind){
  forgetPointer();
  navState(kind==='guide'||kind==='campaign'?kind:'game');
  panels.show(kind,{game,progress,targetLevel:pendingLevel??game.level});
}
function saveVictory(){
  const latest=readProgress();
  for(const [level,lives] of Object.entries(latest.best)) progress.best[level]=Math.max(lives,progress.best[level]||0);
  progress.best[game.level]=Math.max(progress.best[game.level]||0,game.lives);
  progress.unlocked=Math.min(20,Math.max(progress.unlocked,latest.unlocked,game.level+1));
  try{localStorage.setItem(storageKey,JSON.stringify(progress));}catch{announce('Este navegador no pudo guardar el progreso.',5);}
}
function loadLevel(level){
  if(level<1 || level>progress.unlocked) return;
  closePanel();
  pendingLevel=null;
  forgetPointer();flight=null;endShown=false;tipSeen=false;storyRead=false;
  game=new Game(level,progress.unlocked);
  selected='pea';
  el('toast').hidden=true;toastUntil=0;
  setupLevel();
  if(storyEnabled)showStory();
}
function setupLevel(){
  const level=LEVELS[game.level-1];
  el('level-label').textContent='NIVEL '+String(game.level).padStart(2,'0')+' DE 20';
  el('level-name').textContent=level.name;
  arena.style.backgroundImage="url('./assets/"+regions[level.region]+".webp')";
  el('field-tip').hidden=false;
  el('field-tip').querySelector('span').textContent=game.level===1?'Tirá de la honda hacia atrás y soltá':level.terrainName+' · '+level.regionName;
  lastWindPaint=-1;
  renderDeck();hudKey='';renderHud();
}
function renderDeck(){
  const cards=el('cards');
  cards.replaceChildren();
  const visible=deckOrder.filter((id,i)=>i<4 || progress.unlocked>=defs.get(id).unlockLevel);
  cards.classList.toggle('more',visible.length>4);
  for(const id of visible){
    const def=defs.get(id),locked=def.unlockLevel>progress.unlocked;
    const card=document.createElement('button');
    card.type='button';card.dataset.plant=id;
    card.className='card'+(locked?' locked':'');
    card.style.setProperty('--accent',def.color);
    card.setAttribute('aria-label', def.name+', '+roles[id]+', '+(locked?'se desbloquea en el nivel '+def.unlockLevel:def.cost+' de energía'));
    const art=document.createElement('span');art.className='specimen';
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
    canvas.getContext('2d').drawImage(portrait(id),0,0,240,240);art.append(canvas);
    const copy=document.createElement('span');copy.className='card-copy';
    const name=document.createElement('span');name.className='card-name';name.textContent=def.name;
    const role=document.createElement('span');role.className='card-role';role.textContent=roles[id];
    const cost=document.createElement('span');cost.className='card-cost';
    cost.innerHTML=icon(locked?'lock':'sun');cost.append(locked?'Nivel '+def.unlockLevel:String(def.cost));
    copy.append(name,role,cost);card.append(art,copy);
    const tick=document.createElement('span');tick.className='card-state';tick.innerHTML=icon('check');card.append(tick);
    card.addEventListener('click',()=>{
      if(locked){announce(def.name+' se desbloquea en el nivel '+def.unlockLevel+'.');audio.play('tap');return;}
      selected=id;audio.play('select');updateCards();
      if(game.energy<def.cost) announce('Te faltan '+(def.cost-game.energy)+' de energía para lanzar '+def.name+'.');
    });
    cards.append(card);
  }
  updateCards();
}
function updateCards(){
  for(const card of el('cards').children){
    const isSelected=card.dataset.plant===selected;
    card.classList.toggle('selected',isSelected);
    card.classList.toggle('empty-energy',game.energy<defs.get(card.dataset.plant).cost);
    card.setAttribute('aria-pressed',String(isSelected));
    card.querySelector('.card-state').hidden=!isSelected;
  }
}
function renderHud(){
  const phase=game.phase;
  const progressPercent=Math.round(game.waveProgress*100);
  const key=[phase,game.wave,game.energy,game.lives,progressPercent].join(',');
  if(key===hudKey) return;
  hudKey=key;
  el('energy').textContent=game.energy;el('lives').textContent=game.lives;
  el('wave').textContent=game.wave+' / '+game.totalWaves;
  el('wave-fill').style.width=progressPercent+'%';
  el('wave-fill').parentNode.setAttribute('aria-valuenow',String(progressPercent));
  const label=phase==='ready'?'Iniciar horda':phase==='playing'?'Pausar':'Ver resultado';
  if(action.dataset.phase!==phase){
    action.dataset.phase=phase;
    action.innerHTML=icon(phase==='ready'?'play':phase==='playing'?'pause':'flag')+'<span>'+label+'</span>';
  }
  updateCards();
}
function setSoundUI(){
  const button=el('sound');
  button.innerHTML=icon(muted?'mute':'sound');
  const text=muted?'Activar sonido':'Silenciar sonido';button.setAttribute('aria-label',text);button.title=text;
}
el('sound').onclick=()=>{
  muted=!muted;audio.setMuted(muted);setSoundUI();audio.play('tap');
  try{localStorage.setItem('brote-bravo.muted',String(muted));}catch{}
};
el('fullscreen').onclick=async()=>{
  const root=document.documentElement;
  try{
    if(document.fullscreenElement||document.webkitFullscreenElement) await (document.exitFullscreen??document.webkitExitFullscreen).call(document);
    else if(root.requestFullscreen||root.webkitRequestFullscreen) await (root.requestFullscreen??root.webkitRequestFullscreen).call(root);
    else announce('Para ver el campo más grande, girá la tablet en horizontal.');
  }catch{announce('Podés ampliar el campo girando la tablet en horizontal.');}
};
el('nav-guide').onclick=()=>{audio.play('tap');openPanel('guide');};
el('nav-campaign').onclick=()=>{audio.play('tap');openPanel('campaign');};
el('nav-story').onclick=()=>{audio.play('tap');showStory();};
el('nav-game').onclick=()=>{closePanel();world.focus({preventScroll:true});};
function beginHorde(){
  if(!game.start())return;
  tipSeen=true;el('field-tip').hidden=true;renderHud();
}
action.onclick=()=>{
  if(game.phase==='ready'){
    if(storyEnabled&&!storyRead)showStory('battle');else beginHorde();
  }else openPanel(game.phase==='playing'?'pause':game.phase);
};
function canLaunch(){return field && !flight && !panels.isOpen && !dialogue.isOpen && (game.phase==='ready'||game.phase==='playing');}
function launch(tension){
  if(!tension || tension.x > -6 || !canLaunch()) return;
  const receipt=game.launchSeed(selected);
  if(!receipt){
    const missing=defs.get(selected).cost-game.energy;
    announce(missing>0?'Te faltan '+missing+' de energía.':'Elegí una planta disponible.');
    audio.play('error');return;
  }
  const wind=windAt(game.level,visualTime);
  flight={shot:makeThrow(tension,wind),wind,type:selected,elapsed:0,receipt};
  tipSeen=true;el('field-tip').hidden=true;el('toast').hidden=true;
  renderHud();
}
function stretch(e){
  if(!pointer) return;
  const p=field.toWorld(e.clientX,e.clientY);
  pull={x:clamp((p.x-pointer.origin.x)*.74,-110,0),y:clamp((p.y-pointer.origin.y)*.8,-70,70)};
}
world.addEventListener('pointerdown',e=>{
  if(!canLaunch() || pointer || e.button!==0 || !field.atSling(e.clientX,e.clientY)) return;
  e.preventDefault();
  world.setPointerCapture(e.pointerId);
  pointer={id:e.pointerId,origin:field.toWorld(e.clientX,e.clientY)};
  audio.play('stretch');stretch(e);
});
world.addEventListener('pointermove',e=>{
  if(pointer?.id===e.pointerId)stretch(e);
  else if(!pointer && e.pointerType==='mouse') world.style.cursor=field?.atSling(e.clientX,e.clientY)?'grab':'default';
});
world.addEventListener('pointerup',e=>{
  if(pointer?.id!==e.pointerId) return;
  stretch(e);const tension=pull;forgetPointer();launch(tension);
});
world.addEventListener('pointercancel',forgetPointer);
world.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId)forgetPointer();});
world.addEventListener('keydown',e=>{
  if(!canLaunch()||pointer)return;
  if(e.key===' '){e.preventDefault();return;}
  if(e.key==='Escape'){pull=null;return;}
  const move={ArrowUp:[0,3],ArrowDown:[0,-3],ArrowLeft:[-3,0],ArrowRight:[3,0]}[e.key];
  if(move){e.preventDefault();const old=pull??{x:-24,y:0};pull={x:clamp(old.x+move[0],-110,0),y:clamp(old.y+move[1],-70,70)};}
});
world.addEventListener('keyup',e=>{
  if(e.key===' ' && !pointer && canLaunch()){e.preventDefault();const tension=pull;pull=null;launch(tension);}
});
world.addEventListener('blur',()=>{if(!pointer)pull=null;});
function processEvents(){
  const events=game.drainEvents();
  for(const event of events){
    if(event.type==='wave' && event.wave>1)announce('¡Horda '+event.wave+' de '+game.totalWaves+'!',1.8);
    if(event.type==='breach')announce('¡Un espantajo cruzó la huerta!',1.6);
    if(event.type==='energy' && event.source==='moon')announce('Pulso lunar · +35 de energía',1.5);
    audio.play(event.type);
  }
  return events;
}
function paintWind(wind){
  if(lastWindPaint>=0 && visualTime-lastWindPaint<.12)return;
  lastWindPaint=visualTime;
  el('wind').textContent=wind.label;
  el('wind-chip').classList.toggle('calm',wind.label==='Calma');
  el('wind-arrow').style.transform='rotate('+wind.angle+'deg)';
}
function advanceSeed(dt){
  if(!flight) return;
  flight.elapsed=Math.min(flight.shot.duration,flight.elapsed+dt);
  if(flight.elapsed<flight.shot.duration)return;
  const impact=sampleThrow(flight.shot,flight.elapsed);
  const cell=landingCell(impact.x,impact.y);
  const status=game.landSeed(flight.receipt,cell?.row,cell?.col);
  if(status==='outside'||status==='occupied'){
    const reason=status==='occupied'?'Parcela ocupada':impact.x<320?'Tiro corto':'Cayó fuera del campo';
    announce(reason+' · recuperaste '+Math.floor(flight.receipt.cost/2)+' de energía.');
    audio.play('error');
  }
  flight=null;
}
function frame(now){
  const dt=previous?Math.min((now-previous)/1000,.1):0;
  previous=now;
  if(!document.hidden && !panels.isOpen && !dialogue.isOpen){
    visualTime+=dt;
    game.update(dt);
    advanceSeed(dt);
    const events=processEvents();renderHud();
    const wind=flight?.wind??windAt(game.level,visualTime);
    paintWind(wind);
    const preview=!flight && pull?.x < -5 ? makeThrow(pull,wind) : null;
    field.render(game,{selected,preview,flight,pull,wind,time:visualTime,events,hint:!tipSeen&&!pull&&!flight});
    if(!endShown && (game.phase==='won'||game.phase==='lost')){
      endShown=true;
      if(game.phase==='won')saveVictory();
      if(game.phase==='won'&&game.level===20&&storyEnabled)showStory('epilogue');
      else openPanel(game.phase);
    }
  }
  if(!el('toast').hidden && now>=toastUntil){el('toast').hidden=true;el('field-tip').hidden=tipSeen||game.phase!=='ready';}
  frameId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
  previous=0;
  if(document.hidden){
    forgetPointer();
    if(game.phase==='playing'&&!panels.isOpen&&!dialogue.isOpen)openPanel('pause');
  }
});
window.addEventListener('pagehide',()=>{
  cancelAnimationFrame(frameId);previous=0;
});
window.addEventListener('pageshow',e=>{if(e.persisted&&field){previous=0;frameId=requestAnimationFrame(frame);}});
try{
  field=new Field(world);
  setupLevel();setSoundUI();action.disabled=false;
  frameId=requestAnimationFrame(frame);
  if(personalized&&storyEnabled)requestAnimationFrame(()=>showStory());
}catch(error){
  console.error(error);
  const warning=document.createElement('p');warning.className='error';
  warning.textContent='No se pudo abrir el campo 3D. Probá en un navegador actualizado con WebGL 2 activado.';
  arena.append(warning);
}
