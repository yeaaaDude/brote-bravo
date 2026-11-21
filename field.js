import * as THREE from './vendor/three.module.min.js';
import { portrait } from './actors.js';
import * as ActorAnimation from './actors.js';
import { sampleThrow } from './ballistics.js';

const W = 1600, H = 700, ROWS = 5, COLS = 8;
const SLING = { x: 164, y: 451 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const colorOf = { pea: '#b5f165', ice: '#b8f5ff', bomb: '#ffbd60', sun: '#ffe482', thorn:'#b5d65c', spore:'#d78cf0' };
const THEMES = [
  {top:['#a6c761','#8cb451'],mid:['#a0c15b','#86ad4a'],low:['#9abd57','#81a846'],soil:'#88603a',rim:'#c0d482',ink:'#604b2f',grass:'#a1be50',petal:'#fff6d3'},
  {top:['#c1b966','#a3a451'],mid:['#bdb35d','#9e9f49'],low:['#b6ae57','#989a45'],soil:'#9a603a',rim:'#e3cb7a',ink:'#6f4b2b',grass:'#c99048',petal:'#ffdb90'},
  {top:['#dfece1','#c1dbcd'],mid:['#d6e8dc','#bad7c9'],low:['#cee2d6','#b3d1c2'],soil:'#8d9b92',rim:'#f1fbec',ink:'#627e7c',grass:'#a5c4b8',petal:'#f8fcf3'},
  {top:['#72a089','#58896f'],mid:['#6c9981','#538268'],low:['#66937b','#4e7d63'],soil:'#645f79',rim:'#a8c9a5',ink:'#454457',grass:'#8ab89c',petal:'#d2e7ad'}
];

// UI targets use integer cells; simulation positions already include the half-cell offset.
function point(col, row) {
  const t = (row + .5) / ROWS;
  return { x: mix(363 - t * 72, 1390 + t * 65, (col + .5) / COLS), y: 208 + (row + .5) * 77 };
}
function entityPoint(entity) {
  return point((entity.x ?? (entity.col + .5)) - .5, (entity.y ?? (entity.row + .5)) - .5);
}
function edge(col, row) {
  const t = row / ROWS;
  return { x: mix(363 - t * 72, 1390 + t * 65, col / COLS), y: 208 + row * 77 };
}
function path(ctx, points, close = true) {
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  if (close) ctx.closePath();
}
function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function leaf(ctx, x, y, size, angle, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-size, -size, 0, -size * 1.6);
  ctx.quadraticCurveTo(size, -size, 0, 0); ctx.fill(); ctx.restore();
}
function flower(ctx, x, y, size = 5, color = '#fff6d3') {
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    ellipse(ctx, x + Math.cos(a) * size * .8, y + Math.sin(a) * size * .7, size * .57, size * .54, color);
  }
  ellipse(ctx, x, y, size * .42, size * .4, '#f8b945');
}
function texture(draw, width, height, density = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = width * density; canvas.height = height * density;
  const ctx = canvas.getContext('2d'); ctx.scale(density, density);
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}
function boardTexture(region=0) {
  const theme=THEMES[region];
  return texture(ctx => {
    // One soft, broad shadow grounds the raised garden without hiding the landscape.
    ctx.save(); ctx.filter = 'blur(17px)';
    path(ctx, [{ x: 344, y: 226 }, { x: 1410, y: 226 }, { x: 1474, y: 615 }, { x: 275, y: 615 }]);
    ctx.fillStyle = '#30491a49'; ctx.fill(); ctx.restore();
    // A single sod slab, with a visible cut of earth across its front edge.
    const frontLeft=edge(0,5),frontRight=edge(8,5);
    path(ctx,[frontLeft,frontRight,{x:frontRight.x+1,y:frontRight.y+20},{x:frontLeft.x+1,y:frontLeft.y+20}]);
    const soil=ctx.createLinearGradient(0,frontLeft.y,0,frontLeft.y+20);soil.addColorStop(0,theme.soil);soil.addColorStop(1,theme.ink);ctx.fillStyle=soil;ctx.fill();
    ctx.strokeStyle='#d4b87865';ctx.lineWidth=1.4;ctx.lineCap='round';
    for(let i=0;i<44;i++){
      const x=frontLeft.x+10+i*26.2,y=frontLeft.y+5+(i%3);
      if(i%3===0){ctx.beginPath();ctx.moveTo(x,y-3);ctx.quadraticCurveTo(x-4,y+2,x+1,y+9);ctx.moveTo(x,y+2);ctx.lineTo(x+6,y+5);ctx.stroke();}
      if(i%4===1)ellipse(ctx,x,y+7,3+i%3,2, i%2?'#bcaa86':'#a39c7e');
    }
    path(ctx,[edge(0,0),edge(8,0),frontRight,frontLeft]);ctx.fillStyle=theme.low[1];ctx.fill();
    // Alternating greens read as plots while fine furrows leave the turf continuous.
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const a = edge(c, r), b = edge(c + 1, r), d = edge(c, r + 1), e = edge(c + 1, r + 1);
      const pts = [{x:a.x+.7,y:a.y+.7},{x:b.x-.7,y:b.y+.7},{x:e.x-.7,y:e.y-.7},{x:d.x+.7,y:d.y-.7}];
      const grad = ctx.createLinearGradient(0, a.y, 0, e.y);
      grad.addColorStop(0, theme.top[(c+r)%2]);
      grad.addColorStop(.4, theme.mid[(c+r)%2]);
      grad.addColorStop(1, theme.low[(c+r)%2]);
      path(ctx, pts); ctx.fillStyle = grad; ctx.fill();
      // Broad dry-brush flecks and occasional fine blades avoid a stamped tile pattern.
      for (let j = 0; j < 19; j++) {
        const u = .07 + ((c*17+r*11+j*23)%86)/100;
        const v = .12 + ((c*13+r*7+j*19)%76)/100;
        const x = mix(mix(a.x,d.x,v),mix(b.x,e.x,v),u), y = mix(a.y,e.y,v);
        ellipse(ctx,x,y,2+(j*7+c)%9,.6+(j%3)*.35,j%2?'#f0edc21b':'#315b2c12');
        if(j%5===0){ctx.strokeStyle=j%2?theme.rim+'65':theme.low[1]+'80';ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(x-2,y+2);ctx.quadraticCurveTo(x-2,y-2,x-4,y-4);ctx.moveTo(x+1,y+2);ctx.lineTo(x+3,y-3);ctx.stroke();}
      }
      if ((c*3+r)%9 === 0) {
        const x=(a.x+b.x)/2+25, y=a.y+48;
        ellipse(ctx,x,y+2,7,3,'#6d8e3755');
        leaf(ctx,x,y,7,-.6,'#d2df81'); leaf(ctx,x,y,6,.8,'#5b983e');
      }
      if(region===1 && (r+c)%3===0) {
        leaf(ctx,a.x+23,a.y+43,9,-1.1,'#e4b255');leaf(ctx,b.x-25,b.y+53,7,.8,'#c2713d');
      } else if(region===2) {
        if((r+c)%2===0){ctx.strokeStyle='#f8fff485';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(a.x+15,a.y+24);ctx.quadraticCurveTo(a.x+26,a.y+20,a.x+40,a.y+24);ctx.stroke();}
        if((r+c)%3===0){const x=a.x+28,y=a.y+43;ctx.strokeStyle='#f5fff6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.moveTo(x,y-6);ctx.lineTo(x,y+6);ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);ctx.stroke();}
      } else if(region===3 && (r+c)%3===1) {
        const x=a.x+25,y=a.y+51;
        ctx.fillStyle='#bdc7c1';roundRect(ctx,x-1,y-9,4,12,2);ctx.fill();ellipse(ctx,x+1,y-10,9,5,'#d8bdde');ellipse(ctx,x-2,y-12,2,1.5,'#f5e8e3');
      }
    }
    // Uneven blades overlap the exposed soil so the slab has a living front lip.
    for (let i=0;i<62;i++) {
      const x=296+i*18.8, y=595+Math.sin(i*2.3)*2;
      leaf(ctx,x,y,4+i%3,-.8,theme.low[i%2]);leaf(ctx,x+4,y+1,4+(i%4),.7,theme.grass);
      if(i%15===1)flower(ctx,x+8,y-7,4.4,theme.petal);
    }
    for (let r=0;r<5;r++) {
      const p=edge(0,r+.5);
      ellipse(ctx,p.x-11,p.y+8,10,5,'#5b71332d');
      leaf(ctx,p.x-10,p.y+5,10,-.65,theme.low[1]); leaf(ctx,p.x-7,p.y+4,8,.65,theme.rim);
    }
    // Footprints and warm stepping stones leave a visible route beside the enemy gate.
    for(let i=0;i<7;i++) {
      const x=1490+Math.sin(i*1.9)*17, y=239+i*55;
      ellipse(ctx,x+2,y+4,20+i*.8,9,'#524c3230');
      ctx.fillStyle=i%2?'#d0c8a3':'#ddd3ad'; ctx.strokeStyle='#a69f7b'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x-19,y-3); ctx.quadraticCurveTo(x-12,y-14,x+9,y-11);
      ctx.quadraticCurveTo(x+25,y-5,x+19,y+5); ctx.quadraticCurveTo(x-3,y+13,x-20,y+4); ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#f3e8c8';ctx.beginPath();ctx.moveTo(x-11,y-6);ctx.lineTo(x+7,y-8);ctx.stroke();
    }
    [[304,190,6],[1421,196,5],[1493,614,7],[258,629,6]].forEach(([x,y,s])=>flower(ctx,x,y,s,'#fff8d8'));
  }, W, H);
}
function slingTexture(front = false) {
  return texture(ctx => {
    ctx.translate(130,150);
    if(front) {
      ctx.strokeStyle='#61402b';ctx.lineWidth=9;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-48,-84);ctx.quadraticCurveTo(-15,-18,0,-17);ctx.quadraticCurveTo(18,-24,47,-91);ctx.stroke();
      ctx.strokeStyle='#bc8b54';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-48,-86);ctx.lineTo(-3,-21);ctx.lineTo(47,-93);ctx.stroke();
      ctx.fillStyle='#775032';roundRect(ctx,-16,-27,31,17,7);ctx.fill();
      return;
    }
    ellipse(ctx,4,124,69,15,'#394a2f32');
    const stroke = (color,width) => {
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      ctx.moveTo(0,112);ctx.bezierCurveTo(8,66,-9,27,-5,-1);ctx.moveTo(-5,11);ctx.bezierCurveTo(-37,-15,-50,-52,-48,-91);
      ctx.moveTo(-5,8);ctx.bezierCurveTo(27,-17,45,-51,47,-98);ctx.stroke();
    };
    stroke('#5b3f27',36);stroke('#a86b38',27);stroke('#c48a4c',18);
    ctx.strokeStyle='#e1aa66';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-2,99);ctx.bezierCurveTo(3,49,-16,4,-13,-4);
    ctx.moveTo(-22,-11);ctx.quadraticCurveTo(-46,-43,-43,-76);ctx.moveTo(10,-7);ctx.quadraticCurveTo(33,-44,39,-78);ctx.stroke();
    ctx.strokeStyle='#86532f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,82);ctx.lineTo(2,33);ctx.moveTo(-51,-64);ctx.lineTo(-53,-42);ctx.stroke();
    for (const [x,y,angle] of [[-47,-86,-.1],[46,-92,.15]]) {
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#e3c18a':'#b89563';roundRect(ctx,-18,i*4-8,36,5,2);ctx.fill();}ctx.restore();
    }
    ctx.strokeStyle='#a8b65c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-36,113);ctx.lineTo(-41,100);ctx.moveTo(-38,113);ctx.lineTo(-30,99);ctx.stroke();
    flower(ctx,44,116,5);
  },260,300);
}

export class Field {
  constructor(container) {
    this.container=container; this.disposed=false;
    this.scene=new THREE.Scene();
    this.camera=new THREE.OrthographicCamera(0,W,H,0,.1,2000);this.camera.position.z=1000;
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.domElement.setAttribute('aria-hidden','true');
    Object.assign(this.renderer.domElement.style,{width:'100%',height:'100%',display:'block',position:'absolute',inset:'0',pointerEvents:'none'});
    container.appendChild(this.renderer.domElement);
    this.geometry=new THREE.PlaneGeometry(1,1);this.textures=new Map();this.nodes=new Map();this.statics=[];
    this.atlases=new Map();this.atlasQueue=new Map();this.frameGeometries=new Map();this.lastAtlasLoad=-Infinity;
    this.actorStates=new Map();this.previousActors=new Map();
    this.region=0;this.board=this.addStatic(boardTexture(),800,350,W,H,0);
    this.addStatic(slingTexture(),SLING.x,480,260,300,24);
    this.bandTex=texture(ctx=>{const g=ctx.createLinearGradient(0,0,0,12);g.addColorStop(0,'#d8b875');g.addColorStop(.35,'#b98c55');g.addColorStop(1,'#63412c');ctx.fillStyle=g;roundRect(ctx,0,1,128,10,5);ctx.fill();},128,12);
    this.pouchTex=texture(ctx=>{ctx.fillStyle='#553c2b';roundRect(ctx,2,2,38,20,8);ctx.fill();ctx.fillStyle='#92643e';roundRect(ctx,5,3,32,13,6);ctx.fill();},42,24);
    this.shadowTex=texture(ctx=>{const g=ctx.createRadialGradient(64,22,3,64,22,55);g.addColorStop(0,'#263d2385');g.addColorStop(1,'#263d2300');ctx.fillStyle=g;ctx.fillRect(0,0,128,44);},128,44);
    this.dotTex=texture(ctx=>{
      ctx.shadowColor='#3e442c80';ctx.shadowBlur=3;ctx.shadowOffsetY=1;
      ellipse(ctx,16,16,10.5,10.5,'#fff2cd');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle='#6c603d99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(16,16,10.5,0,Math.PI*2);ctx.stroke();ellipse(ctx,13,12,2.5,2.5,'#fffdf0');
    },32,32);
    this.effectTex=texture(ctx=>{const g=ctx.createRadialGradient(64,64,3,64,64,60);g.addColorStop(0,'#fffef0');g.addColorStop(.25,'#ffe078cc');g.addColorStop(.6,'#ffbd5b4d');g.addColorStop(1,'#ffcc5500');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);},128,128);
    this.ringTex=texture(ctx=>{ctx.strokeStyle='#fff6bd';ctx.lineWidth=6;ctx.beginPath();ctx.arc(64,64,48,0,Math.PI*2);ctx.stroke();},128,128);
    this.whiteTex=texture(ctx=>{ctx.fillStyle='white';ctx.fillRect(0,0,4,4);},4,4,1);
    this.boostTex=texture(ctx=>{
      ctx.fillStyle='#fff0a21c';ctx.strokeStyle='#f8e8a075';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(64,36,48,23,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#fff1a9aa';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(59,37);ctx.lineTo(64,29);ctx.lineTo(69,37);ctx.moveTo(64,30);ctx.lineTo(64,44);ctx.stroke();
    },128,72);
    this.snowTex=texture(ctx=>{const g=ctx.createLinearGradient(0,0,128,0);g.addColorStop(0,'#ddf8f000');g.addColorStop(.2,'#f0fff52c');g.addColorStop(.8,'#e9fff535');g.addColorStop(1,'#ddf8f000');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);},128,128);
    this.thornTex=texture(ctx=>{ctx.fillStyle='#4f762c';ctx.beginPath();ctx.moveTo(5,22);ctx.lineTo(26,8);ctx.lineTo(54,22);ctx.lineTo(26,36);ctx.closePath();ctx.fill();ctx.fillStyle='#bedc6a';ctx.beginPath();ctx.moveTo(12,21);ctx.lineTo(26,13);ctx.lineTo(54,22);ctx.closePath();ctx.fill();},64,44);
    this.sporeTex=texture(ctx=>{ellipse(ctx,30,34,16,13,'#bc76c9');ellipse(ctx,26,28,9,8,'#edb9f0');ellipse(ctx,37,25,7,6,'#e29de5');ellipse(ctx,35,36,9,8,'#ce8cd8');ellipse(ctx,23,26,3,3,'#fff1f1');},64,64);
    this.windTextures=THEMES.map((theme,region)=>texture(ctx=>{
      if(region<2){ctx.fillStyle=region?'#dbad61':'#d4dd92';ctx.beginPath();ctx.moveTo(7,16);ctx.quadraticCurveTo(18,3,28,15);ctx.quadraticCurveTo(20,27,7,16);ctx.fill();ctx.strokeStyle=region?'#956331':'#7a9651';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(9,16);ctx.lineTo(27,15);ctx.stroke();}
      else if(region===2){ctx.strokeStyle='#f4fff2';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<3;i++){const a=i*Math.PI/3;ctx.moveTo(16-Math.cos(a)*9,16-Math.sin(a)*9);ctx.lineTo(16+Math.cos(a)*9,16+Math.sin(a)*9);}ctx.stroke();}
      else{const g=ctx.createRadialGradient(16,16,0,16,16,13);g.addColorStop(0,'#f9e4ff');g.addColorStop(.25,'#e5c0facc');g.addColorStop(1,'#cc98ff00');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);}
    },32,32));
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
  }
  addStatic(tex,x,y,w,h,z) {
    const node=this.makeMesh(tex);node.position.set(x,H-y,z);node.scale.set(w,h,1);node.renderOrder=z;this.scene.add(node);this.statics.push(node);return node;
  }
  makeMesh(tex) {
    return new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
  }
  actorTexture(type) {
    if(this.textures.has(type))return this.textures.get(type);
    const source=portrait(type);const tex=new THREE.CanvasTexture(source);tex.colorSpace=THREE.SRGBColorSpace;
    tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;
    this.textures.set(type,tex);return tex;
  }
  sprite(key,tex,x,y,w,h,z,opacity=1,tint='#ffffff',angle=0) {
    this.used.add(key);let node=this.nodes.get(key);
    if(!node){node=this.makeMesh(tex);this.scene.add(node);this.nodes.set(key,node);}
    if(node.material.map!==tex){node.material.map=tex;node.material.needsUpdate=true;}
    node.geometry=this.geometry;node.visible=true;node.position.set(x,H-y,z);node.scale.set(w,h,1);node.rotation.z=angle;
    node.renderOrder=z;node.material.opacity=opacity;node.material.color.set(tint);return node;
  }
  triggerActor(key,action,start) {
    const duration=action==='hurt'?.5:2/3,current=this.actorStates.get(key);
    if(current?.action==='hurt'&&current.until>start&&action!=='hurt')return;
    this.actorStates.set(key,{action,start,until:start+duration});
  }
  readActorEvents(events,time) {
    for(const event of events||[]) {
      const start=time-Math.max(0,event.age||0),plantId=event.plantId??(event.type==='plant'?event.id:null);
      if(['plant','shot','energy','arm'].includes(event.type)&&plantId!=null)this.triggerActor('p'+plantId,'act',start);
      if(event.type==='bite') {
        if(event.enemyId!=null)this.triggerActor('e'+event.enemyId,'attack',start);
        if(plantId!=null&&event.damage!==0)this.triggerActor('p'+plantId,'hurt',start);
      }
      if(event.type==='hit'&&event.enemyId!=null&&event.damage!==0)this.triggerActor('e'+event.enemyId,'hurt',start);
    }
  }
  actorMotion(key,entity,time,enemy=false,preview=false) {
    this.liveActors.add(key);
    const previous=this.previousActors.get(key);
    if(previous&&Number.isFinite(entity.hp)&&entity.hp<previous.hp)this.triggerActor(key,'hurt',time);
    const stopped=enemy&&previous&&Math.abs(entity.x-previous.x)<1e-7;
    this.previousActors.set(key,{hp:entity.hp,x:entity.x});
    let state=this.actorStates.get(key);
    if(state&&state.until<=time){this.actorStates.delete(key);state=null;}
    if(state) return{action:state.action,frame:clamp(Math.floor((time-state.start)*(state.action==='hurt'?16:12)),0,7)};
    const fps=enemy?({runner:14,tank:6.5,shield:7.5,boss:6,mender:8.5}[entity.type]||9.5)*(entity.slow>0?.46:1):8;
    const seed=String(entity.id??key).split('').reduce((n,c)=>n+c.charCodeAt(0),0)%17;
    return{action:enemy?'walk':'idle',frame:preview||stopped?0:Math.floor(time*fps+seed)%8};
  }
  actorSprite(key,type,motion,...args) {
    const atlasKey=type+':'+motion.action;
    let atlas=this.atlases.get(atlasKey);
    if(!atlas&&typeof ActorAnimation.animatedAtlas==='function')this.atlasQueue.set(atlasKey,{type,action:motion.action});
    if(!atlas)atlas=this.atlases.get(type+':'+(motion.action==='walk'||motion.action==='attack'?'walk':'idle'));
    const node=this.sprite(key,atlas?.texture||this.actorTexture(type),...args);
    if(atlas) {
      const frame=clamp(motion.frame,0,atlas.frames-1),key=[atlas.cols,atlas.rows,atlas.canvas.width,atlas.canvas.height,frame].join(':');
      let geometry=this.frameGeometries.get(key);
      if(!geometry){
        geometry=new THREE.PlaneGeometry(1,1);const uv=geometry.attributes.uv,col=frame%atlas.cols,row=Math.floor(frame/atlas.cols);
        const tileW=atlas.canvas.width/atlas.cols,tileH=atlas.canvas.height/atlas.rows;
        for(let i=0;i<uv.count;i++)uv.setXY(i,(col*tileW+.5+uv.getX(i)*(tileW-1))/atlas.canvas.width,((atlas.rows-row-1)*tileH+.5+uv.getY(i)*(tileH-1))/atlas.canvas.height);
        uv.needsUpdate=true;this.frameGeometries.set(key,geometry);
      }
      node.geometry=geometry;
    }
    return node;
  }
  prepareOneAtlas() {
    if(!this.atlasQueue.size||performance.now()-this.lastAtlasLoad<150)return;
    // Ability/damage atlases take priority; warm only one small shared atlas per interval.
    const entries=[...this.atlasQueue],entry=entries.find(([,v])=>v.action==='hurt'||v.action==='act'||v.action==='attack')||entries[0];
    const [key,{type,action}]=entry;this.atlasQueue.delete(key);
    const atlas=ActorAnimation.animatedAtlas(type,action),tex=new THREE.CanvasTexture(atlas.canvas);
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;
    this.atlases.set(key,{...atlas,texture:tex});this.lastAtlasLoad=performance.now();
  }
  resize() {
    const rect=this.container.getBoundingClientRect();this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);
    this.scale=Math.min(this.width/W,this.height/H);this.ox=(this.width-W*this.scale)/2;this.oy=(this.height-H*this.scale)/2;
    this.camera.left=-this.ox/this.scale;this.camera.right=(this.width-this.ox)/this.scale;
    this.camera.top=H+this.oy/this.scale;this.camera.bottom=H-(this.height-this.oy)/this.scale;
    this.camera.updateProjectionMatrix();this.renderer.setSize(this.width,this.height,false);
  }
  toWorld(clientX,clientY) {
    const rect=this.renderer.domElement.getBoundingClientRect();
    return {x:(clientX-rect.left-this.ox)/this.scale,y:(clientY-rect.top-this.oy)/this.scale};
  }
  toScreen(p) {
    const rect=this.renderer.domElement.getBoundingClientRect();return{x:rect.left+this.ox+p.x*this.scale,y:rect.top+this.oy+p.y*this.scale};
  }
  cellAt(clientX,clientY) {
    const p=this.toWorld(clientX,clientY),row=Math.floor((p.y-208)/77);
    if(row<0||row>=ROWS)return null;
    const t=(p.y-208)/(77*ROWS),left=363-t*72,right=1390+t*65;
    const col=Math.floor((p.x-left)/(right-left)*COLS);return col>=0&&col<COLS?{row,col}:null;
  }
  atSling(clientX,clientY) {
    const p=this.toWorld(clientX,clientY);return ((p.x-SLING.x)/105)**2+((p.y-SLING.y)/125)**2<=1;
  }
  cellScreen(row,col) {return this.toScreen(point(col,row));}
  slingScreen() {return this.toScreen(SLING);}
  render(game={},options={}) {
    if(this.disposed)return;
    this.used=new Set();this.liveActors=new Set();
    const level=Number.isFinite(game.level)?game.level:1;
    const region=clamp(Math.floor((level-1)/5),0,3);
    if(region!==this.region){this.board.material.map.dispose();this.board.material.map=boardTexture(region);this.board.material.needsUpdate=true;this.region=region;}
    const time=options.time??performance.now()/1000;
    this.readActorEvents(options.events,time);
    const selected=typeof options.selected==='string'?options.selected:options.selected?.type||options.selected?.id||'pea';
    const preview=options.preview,flight=options.flight;
    const pull=options.pull||{x:0,y:0},pullX=clamp(pull.x||0,-110,0),pullY=clamp(pull.y||0,-70,70);
    const wind=options.wind;
    if(wind&&(wind.speed??Math.hypot(wind.x||0,wind.y||0))>=12) {
      const mod=(v,n)=>((v%n)+n)%n;
      for(let i=0;i<6;i++) {
        const x=330+mod(i*211+time*(wind.x||0)*.8,1100),y=(i<3?184:635)+mod(i*7+time*(wind.y||0)*.45,26)-13;
        this.sprite('wind'+i,this.windTextures[region],x,y,region===3?10:22,region===3?10:region===2?22:16,19,.55,'#ffffff',-Math.atan2(wind.y||0,wind.x||0)+Math.sin(time*2+i)*.24);
      }
    }
    for(const [i,cell] of (game.boostCells||[]).entries()) {
      const p=point(cell.col,cell.row);this.sprite('boost'+i,this.boostTex,p.x,p.y+2,120,68,2,.8+.12*Math.sin(time*2+i));
    }
    for(const [i,zone] of (game.snowZones||[]).entries()) {
      const start=edge(zone.x,0),end=edge(zone.x+zone.width,5);
      this.sprite('snowzone'+i,this.snowTex,(start.x+end.x)/2,400,end.x-start.x,375,1,.75);
    }
    if(game.terrainPulse>0)this.sprite('terrainpulse',this.effectTex,870,402,1170,550,2,game.terrainPulse*.2,'#c8d6f5');
    if(preview&&!flight) {
      // A short launch suggestion, never a landing marker or the full trajectory.
      for(let i=0;i<11;i++) {
        const fraction=mix(.03,.38,i/10),pos=sampleThrow(preview,preview.duration*fraction);
        this.sprite('preview'+i,this.dotTex,pos.x,pos.y-pos.z-24,11,11,20,.94*(1-i/11)**1.15);
      }
    }
    if(options.hint&&!options.pull&&!preview&&!flight)this.sprite('sling-hint',this.ringTex,SLING.x,SLING.y-10,155+Math.sin(time*2.2)*9,163+Math.sin(time*2.2)*9,23,.17+.07*Math.sin(time*2.2),'#fff1ba');
    for(const [i,plant] of (game.plants||[]).entries()) {
      const p=entityPoint(plant),key='p'+(plant.id??i);
      const bounce=Math.sin(time*2.7+i*1.7)*.65,motion=this.actorMotion(key,plant,time);
      this.sprite(key+'s',this.shadowTex,p.x,p.y+21,92,27,4,.65);
      this.actorSprite(key,plant.type,motion,p.x,p.y-22+bounce,100,113,10+(p.y/700)*7,1,'#ffffff',0);
      this.health(key,plant,p.x,p.y-80,62);
    }
    let enemies=game.enemies||[];
    const enemyPreview=(game.phase==='ready'&&enemies.length===0);
    if(enemyPreview)enemies=[{id:'preview-a',type:'bug',x:8.33,y:.75},{id:'preview-b',type:level>=4?'runner':'bug',x:8.52,y:2.65},{id:'preview-c',type:level>=13?'mender':level>=10?'boss':level>=9?'shield':level>=7?'tank':'bug',x:8.36,y:4.4}];
    for(const [i,enemy] of enemies.entries()) {
      const p=entityPoint(enemy),key='e'+(enemy.id??i);
      const large=enemy.type==='boss'?1.37:enemy.type==='tank'?1.13:1;
      const frozen=enemy.slow>0,poisoned=enemy.poison>0;
      const bob=Math.sin(time*(enemy.type==='runner'?8:5)*(frozen?.46:1)+i*2);
      const tint=frozen&&poisoned?'#c4d5f0':frozen?'#b7e6f2':poisoned?'#d7b9eb':'#ffffff';
      const motion=this.actorMotion(key,enemy,time,true,enemyPreview);
      const bodyY=p.y-26*large+Math.abs(bob)*.5,depth=11+(p.y/700)*7,angle=bob*(frozen?.004:.006);
      this.sprite(key+'s',this.shadowTex,p.x,p.y+21,97*large,26*large,5,enemyPreview?.47:.65);
      if(frozen||poisoned)this.sprite(key+'status',this.ringTex,p.x,p.y+19,83*large,29*large,7,.55,frozen?'#c0f4ff':'#e1b5eb');
      const body=this.actorSprite(key,enemy.type,motion,p.x,bodyY,105*large,124*large,depth,enemyPreview?.92:1,tint,angle);
      if(enemy.hitFlash>0){const flash=this.sprite(key+'flash',body.material.map,p.x,bodyY,105*large,124*large,depth+.01,clamp(enemy.hitFlash/.12,0,1)*.4,'#fff1b4',angle);flash.geometry=body.geometry;flash.material.blending=THREE.AdditiveBlending;}
      if(!enemyPreview)this.health(key,enemy,p.x,p.y-92*large,65*large);
    }
    for(const [i,shot] of (game.shots||[]).entries()) {
      const p=entityPoint(shot),icy=shot.type==='ice',thorn=shot.type==='thorn',spore=shot.type==='spore';
      this.sprite('shotglow'+(shot.id??i),this.effectTex,p.x,p.y-25,spore?49:38,spore?49:38,20,.6,spore?'#e6a0f2':icy?'#9ceafb':'#c0ef70');
      this.sprite('shot'+(shot.id??i),thorn?this.thornTex:spore?this.sporeTex:this.dotTex,p.x,p.y-25,thorn?34:spore?31:19,thorn?23:spore?31:19,21,1,thorn||spore?'#ffffff':icy?'#9feaff':'#8cd354',spore?time*2:0);
    }
    for(const [i,fx] of (game.effects||[]).entries()) {
      const p=entityPoint(fx),ratio=clamp((fx.life??.5)/(fx.maxLife??1),0,1),age=1-ratio;
      const size=(fx.radius?fx.radius*130:95)*(1+age*.7),tint=fx.type==='poison'||fx.variant==='spore'?'#dda1e9':fx.type==='heal'?'#a0f3b2':fx.type==='pulse'?'#d2cdf5':fx.type==='breach'?'#ffa878':fx.type==='sun'?'#fff19c':'#e3f8a5';
      this.sprite('fx'+i,this.effectTex,p.x,p.y-28,size,size,30,ratio*.8,tint);
      this.sprite('fxr'+i,this.ringTex,p.x,p.y-23,size*.8,size*.5,29,ratio*.65,tint);
      for(let j=0;j<6;j++) {
        const a=j*Math.PI/3+i;
        this.sprite('fxp'+i+'-'+j,this.dotTex,p.x+Math.cos(a)*age*size*.6,p.y-25+Math.sin(a)*age*size*.38-age*30,8*ratio+2,8*ratio+2,31,ratio,tint);
      }
    }
    const loadedType=colorOf[selected]?selected:'pea';
    const breathe=Math.sin(time*2.8)*1.8;
    const pouch={x:SLING.x+pullX,y:SLING.y+12+pullY};
    for(const [i,fork] of [{x:SLING.x-48,y:396},{x:SLING.x+47,y:389}].entries()) {
      const dx=pouch.x-fork.x,dy=pouch.y-fork.y;
      this.sprite('band'+i,this.bandTex,(fork.x+pouch.x)/2,(fork.y+pouch.y)/2,Math.hypot(dx,dy),9,27,1,'#ffffff',-Math.atan2(dy,dx));
    }
    this.sprite('loaded-shadow',this.shadowTex,SLING.x,SLING.y+16,100,22,23,.65);
    this.actorSprite('loaded',loadedType,{action:'idle',frame:Math.floor(time*8)%8},SLING.x+pullX,SLING.y-24+pullY+(options.pull?0:breathe),127,138,26,flight?.38:1,'#ffffff',-.055+Math.sin(time*2)*.008);
    this.sprite('pouch',this.pouchTex,pouch.x,pouch.y,35,21,28,1);
    if(flight) {
      const elapsed=Math.max(0,flight.elapsed||0),t=clamp(elapsed/flight.shot.duration,0,1),pos=sampleThrow(flight.shot,elapsed);
      const shadowScale=clamp(1-pos.z/520,.32,1);
      this.sprite('flying-shadow',this.shadowTex,pos.x,pos.y,82*shadowScale,24*shadowScale,8,.24+.3*shadowScale);
      this.sprite('flying',this.actorTexture(flight.type||loadedType),pos.x,pos.y-pos.z-24,105,116,35,1,'#ffffff',-t*Math.PI*1.7);
      for(let j=1;j<5;j++){const past=Math.max(0,elapsed-j*.022),trail=sampleThrow(flight.shot,past);this.sprite('flighttrail'+j,this.dotTex,trail.x,trail.y-trail.z-24,7-j,7-j,32,.45-j*.07,colorOf[flight.type||loadedType]);}
    }
    for(const [key,node] of this.nodes)if(!this.used.has(key)){this.scene.remove(node);node.material.dispose();this.nodes.delete(key);}
    for(const key of this.previousActors.keys())if(!this.liveActors.has(key)){this.previousActors.delete(key);this.actorStates.delete(key);}
    this.renderer.render(this.scene,this.camera);
    this.prepareOneAtlas();
  }
  health(key,entity,x,y,width) {
    if(!Number.isFinite(entity.hp)||!entity.maxHp||entity.hp>=entity.maxHp)return;
    const f=clamp(entity.hp/entity.maxHp,0,1);
    this.sprite(key+'hb',this.whiteTex,x,y,width,7,22,.85,'#4b5134');
    this.sprite(key+'hf',this.whiteTex,x-width*(1-f)/2,y,width*f,4,23,1,f<.33?'#ed9674':'#e6f09b');
  }
  dispose() {
    if(this.disposed)return;this.disposed=true;this.resizeObserver.disconnect();
    const allTextures=new Set([this.shadowTex,this.dotTex,this.effectTex,this.ringTex,this.whiteTex,this.bandTex,this.pouchTex,this.boostTex,this.snowTex,this.thornTex,this.sporeTex,...this.windTextures,...this.textures.values(),...[...this.atlases.values()].map(a=>a.texture)]);
    this.scene.traverse(node=>{if(node.material){if(node.material.map)allTextures.add(node.material.map);node.material.dispose();}});
    for(const tex of allTextures)tex.dispose();this.geometry.dispose();for(const geometry of this.frameGeometries.values())geometry.dispose();this.renderer.dispose();this.renderer.domElement.remove();
    this.nodes.clear();this.textures.clear();this.atlases.clear();this.atlasQueue.clear();this.frameGeometries.clear();this.actorStates.clear();this.previousActors.clear();
  }
}
