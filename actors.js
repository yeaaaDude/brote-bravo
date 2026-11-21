// Original, resolution-independent botanical characters, painted with Canvas 2D.
const portraits = new Map();
const INK = '#193f2c';
const TAU = Math.PI * 2;

function path(c, points, fill, stroke = INK, width = 6) {
  c.beginPath();
  for (const [cmd, ...p] of points) c[cmd](...p);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function ellipse(c, x, y, rx, ry, fill, stroke = INK, width = 6, rotation = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function linear(c, x1, y1, x2, y2, colors) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
  return g;
}
function radial(c, x, y, r, colors) {
  const g = c.createRadialGradient(x, y, r * .06, x + r * .2, y + r * .25, r);
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
  return g;
}
function line(c, points, color = INK, width = 5) { path(c, points, null, color, width); }
function leaf(c, x, y, angle, length, width, light = '#b3ed59', dark = '#2f9b4e') {
  if (c.actorPose) {
    const p=c.actorPose, lower=y>200;
    angle+=Math.sin(p.phase+(x<177?0:1.7))*(lower?.105:.085)+(x<177?-1:1)*(p.charge*.12+p.hit*.11);
    length*=1+Math.sin(p.phase+x*.021)*.025;
  }
  c.save(); c.translate(x, y); c.rotate(angle);
  path(c, [['moveTo', 0, 0], ['bezierCurveTo', -width, -length * .22, -width * .65, -length * .78, 0, -length], ['bezierCurveTo', width * .87, -length * .65, width, -length * .17, 0, 0]], linear(c, -width / 2, -length, width / 2, 0, [light, dark]));
  line(c, [['moveTo', 0, -7], ['quadraticCurveTo', -2, -length * .55, 0, -length * .81]], '#287044', 3);
  line(c, [['moveTo', -2, -length * .4], ['lineTo', -width * .37, -length * .57]], '#68be57', 2.5);
  c.restore();
}
function sparkle(c, x, y, size, color = '#fff4b8') {
  path(c, [['moveTo', x, y - size], ['quadraticCurveTo', x + size * .18, y - size * .15, x + size, y], ['quadraticCurveTo', x + size * .18, y + size * .15, x, y + size], ['quadraticCurveTo', x - size * .18, y + size * .15, x - size, y], ['quadraticCurveTo', x - size * .18, y - size * .15, x, y - size]], color, null);
}
function eye(c, x, y, scale = 1, glance = 0, color = '#173b2b') {
  if(c.actorPose && c.actorPose.plant) glance=2;
  if(c.actorPose && c.actorPose.blink) {
    line(c,[['moveTo',x-10*scale,y],['quadraticCurveTo',x,y+4*scale,x+10*scale,y]],color,4);
    return;
  }
  ellipse(c, x, y, 12 * scale, 17 * scale, '#fffbe3', color, 3.5);
  ellipse(c, x + glance, y + 1, 6.2 * scale, 10 * scale, color, null);
  ellipse(c, x + glance - 2 * scale, y - 4 * scale, 2.5 * scale, 3.5 * scale, '#fff', null);
}
function freckles(c, x, y, color) {
  for (const [dx, dy, r] of [[-5, 0, 2.1], [3, -3, 1.6], [6, 5, 1.8]]) ellipse(c, x + dx, y + dy, r, r, color, null);
}
function ground(c, x = 180, y = 322, width = 94) {
  const g = c.createRadialGradient(x, y, 5, x, y, width);
  g.addColorStop(0, '#123d2b25'); g.addColorStop(1, '#123d2b00');
  ellipse(c, x, y, width, 14, g, null);
}
function pea(c) {
  ground(c);
  // Leaves fan out behind a sturdy little stem.
  leaf(c, 165, 290, -.94, 91, 32, '#a2e452', '#238644');
  leaf(c, 185, 291, 1.02, 86, 32, '#b5ec65', '#2b9946');
  path(c, [['moveTo', 155, 207], ['bezierCurveTo', 146, 246, 133, 276, 153, 299], ['quadraticCurveTo', 175, 311, 194, 293], ['bezierCurveTo', 208, 263, 194, 230, 193, 207], ['closePath']], linear(c, 143, 214, 198, 301, ['#b2ed61', '#53b640', '#267e3e']));
  ellipse(c, 145, 308, 31, 13, '#308947', INK, 5, -.2);
  ellipse(c, 201, 309, 32, 13, '#439a43', INK, 5, .15);
  plantHead(c,174,218);
  leaf(c, 154, 91, -.65, 77, 28, '#d2f878', '#53ae42');
  leaf(c, 167, 84, .65, 77, 28, '#b2ed63', '#3aa249');
  // Single broad head and fluted seed nozzle make the silhouette clear at 48px.
  path(c, [['moveTo', 217, 100], ['bezierCurveTo', 190, 72, 129, 74, 99, 110], ['bezierCurveTo', 71, 144, 79, 192, 112, 217], ['bezierCurveTo', 142, 240, 197, 238, 224, 207], ['bezierCurveTo', 244, 184, 249, 127, 217, 100], ['closePath']], radial(c, 139, 115, 117, ['#d0f574', '#8bdc4b', '#40a54a', '#258446']), INK, 7);
  c.save();
  if(c.actorPose) { c.translate(218,156);c.scale(1-c.actorPose.recoil*.22,1+c.actorPose.recoil*.08);c.translate(-218,-156); }
  path(c, [['moveTo', 218, 135], ['bezierCurveTo', 235, 133, 254, 127, 275, 116], ['bezierCurveTo', 291, 131, 297, 174, 281, 197], ['bezierCurveTo', 253, 186, 236, 183, 216, 181], ['closePath']], linear(c, 234, 122, 260, 200, ['#b5ed5f', '#6eca46', '#309347']), INK, 6);
  ellipse(c, 278, 156, 25, 43, linear(c, 258, 125, 297, 186, ['#c7f778', '#8bd748', '#4aa548']), INK, 6, -.05);
  ellipse(c, 282, 157, 13, 29, '#286337', INK, 4, -.05);
  ellipse(c, 280, 153, 7, 20, '#173f2c', null);
  line(c, [['moveTo', 267, 128], ['quadraticCurveTo', 277, 120, 283, 132]], '#e4ff9c', 4);
  c.restore();
  eye(c, 142, 150, 1.08, 3); eye(c, 182, 144, .95, 3);
  line(c, [['moveTo', 125, 127], ['quadraticCurveTo', 140, 123, 153, 130]], INK, 6);
  line(c, [['moveTo', 168, 123], ['quadraticCurveTo', 184, 114, 196, 119]], INK, 6);
  line(c, [['moveTo', 145, 188], ['quadraticCurveTo', 165, 204, 183, 184]], INK, 4);
  ellipse(c, 119, 178, 14, 7, '#69bc52', null, .0);
  freckles(c, 116, 177, '#327e40');
  line(c, [['moveTo', 107, 125], ['quadraticCurveTo', 117, 104, 139, 101]], '#e5ffa1', 5);
  c.restore();
  line(c, [['moveTo', 158, 246], ['quadraticCurveTo', 153, 269, 158, 280]], '#ccf779', 5);
  sparkle(c, 72, 108, 7, '#c1ef70');
}
function ice(c) {
  ground(c);
  leaf(c, 174, 298, -1.04, 90, 30, '#b5fbef', '#349eb8');
  leaf(c, 183, 302, .98, 85, 31, '#d0ffff', '#3cabc4');
  path(c, [['moveTo', 163, 208], ['quadraticCurveTo', 161, 254, 156, 299], ['quadraticCurveTo', 176, 316, 194, 299], ['quadraticCurveTo', 181, 244, 193, 207], ['closePath']], linear(c, 159, 225, 193, 289, ['#b3f8ec', '#41b6bf', '#278c9e']));
  ellipse(c, 157, 311, 29, 12, '#56bfc0', INK, 5, -.12);
  ellipse(c, 196, 311, 28, 12, '#65cdd0', INK, 5, .1);
  plantHead(c,179,215);
  // Angular petals have softer painted interiors and bright crystal edges.
  const petals = [[-2,-83,0], [66,-53,.83], [86,20,1.6], [44,76,2.6], [-41,76,3.55], [-86,18,4.6], [-64,-53,5.4]];
  for (const [dx,dy,a] of petals) {
    const flutter=c.actorPose?Math.sin(c.actorPose.phase+a*2)*.055+c.actorPose.charge*.08:0;
    c.save(); c.translate(179+dx*.67, 145+dy*.67); c.rotate(a+flutter);
    path(c,[['moveTo',-28,26],['lineTo',-38,-7],['lineTo',-16,-47],['lineTo',7,-60],['lineTo',33,-18],['lineTo',28,21],['lineTo',0,46],['closePath']],linear(c,-25,-44,25,40,['#e2ffff','#8ae7ef','#4ab6dc']), '#225264', 5);
    path(c,[['moveTo',7,-52],['lineTo',2,-5],['lineTo',-29,-3]],null,'#d7ffff',3);
    path(c,[['moveTo',2,-5],['lineTo',25,15],['lineTo',0,38]],null,'#78d9ee',2.5);
    c.restore();
  }
  ellipse(c,178,148,65,65,radial(c,156,122,88,['#dcffff','#98edec','#44b6cf']),'#225264',6);
  eye(c,157,146,1,-2,'#244e63'); eye(c,197,145,1,-2,'#244e63');
  line(c,[['moveTo',146,123],['quadraticCurveTo',155,116,166,122]],'#24546a',4);
  line(c,[['moveTo',187,122],['quadraticCurveTo',197,116,207,123]],'#24546a',4);
  path(c,[['moveTo',162,176],['quadraticCurveTo',178,188,193,173],['quadraticCurveTo',180,200,162,176]],'#26657a', '#24546a',3);
  ellipse(c,137,167,11,5,'#81cfe4',null); ellipse(c,215,166,11,5,'#81cfe4',null);
  line(c,[['moveTo',137,116],['quadraticCurveTo',149,105,166,103]],'#f2ffff',4);
  c.restore();
  snowflake(c,278,87,14); snowflake(c,75,210,11); snowflake(c,213,260,9);
  sparkle(c,105,69,10,'#b5efff'); sparkle(c,270,192,9,'#d7ffff');
}
function snowflake(c,x,y,r) {
  c.save(); c.translate(x,y);
  for(let i=0;i<6;i++) {
    c.rotate(Math.PI/3);
    line(c,[['moveTo',0,0],['lineTo',0,-r]],'#5ac1db',2.5);
    line(c,[['moveTo',-r*.25,-r*.63],['lineTo',0,-r*.4],['lineTo',r*.25,-r*.63]],'#5ac1db',2);
  }
  c.restore();
}
function bomb(c) {
  ground(c);
  leaf(c,157,302,-1.05,73,28,'#9bce67','#407245');
  leaf(c,193,303,1.05,75,29,'#a5d76a','#3c8142');
  ellipse(c,148,310,30,12,'#376b39',INK,5,-.1); ellipse(c,207,310,31,12,'#4b823d',INK,5,.1);
  plantHead(c,178,296,'bomb');
  // The botanical wick is a curled leaf stalk, with an ember blossom.
  path(c,[['moveTo',173,105],['bezierCurveTo',164,78,190,72,194,53],['quadraticCurveTo',206,70,195,87],['quadraticCurveTo',187,97,190,111],['closePath']],linear(c,175,60,193,109,['#a6cf53','#447d3c']),INK,5);
  leaf(c,175,111,-1.07,57,18,'#b4dc67','#477e3c');
  leaf(c,187,111,.86,54,18,'#b4dc67','#477e3c');
  c.save();
  if(c.actorPose) { c.translate(213,63);c.rotate(Math.sin(c.actorPose.phase*2)*.12);c.scale(1+Math.sin(c.actorPose.phase)*.07,1+c.actorPose.charge*.18);c.translate(-213,-63); }
  path(c,[['moveTo',202,58],['bezierCurveTo',182,43,203,22,201,12],['bezierCurveTo',225,28,238,47,226,63],['quadraticCurveTo',213,74,202,58]],linear(c,211,12,213,67,['#ffe68b','#ffae42','#ed6935']), '#7c472a',4);
  path(c,[['moveTo',209,57],['quadraticCurveTo',203,46,213,34],['quadraticCurveTo',215,47,222,53],['quadraticCurveTo',218,64,209,57]],'#fff5b4',null);
  c.restore();
  path(c,[['moveTo',177,105],['bezierCurveTo',139,91,89,122,82,173],['bezierCurveTo',73,226,105,288,155,299],['bezierCurveTo',194,309,245,283,267,234],['bezierCurveTo',294,173,263,111,215,106],['quadraticCurveTo',194,103,177,105],['closePath']],radial(c,142,142,150,['#ff8b79','#e74357','#ae2545','#682c3f']),INK,7);
  path(c,[['moveTo',171,102],['lineTo',163,124],['lineTo',183,116],['lineTo',198,131],['lineTo',207,113],['lineTo',227,117],['lineTo',215,102]],linear(c,173,104,208,128,['#a6d75b','#508c3e']),INK,4);
  eye(c,145,187,1.05,2,'#3d3034'); eye(c,209,184,1.05,-2,'#3d3034');
  line(c,[['moveTo',126,161],['quadraticCurveTo',145,161,160,174]],'#3d3034',9);
  line(c,[['moveTo',193,171],['quadraticCurveTo',207,157,226,157]],'#3d3034',9);
  path(c,[['moveTo',148,230],['quadraticCurveTo',179,215,213,231],['quadraticCurveTo',197,260,169,253],['quadraticCurveTo',152,249,148,230]],'#4c2a34',INK,4);
  path(c,[['moveTo',153,230],['quadraticCurveTo',179,219,208,231],['lineTo',201,239],['quadraticCurveTo',179,232,159,239],['closePath']],'#ffecc2',null);
  line(c,[['moveTo',106,155],['quadraticCurveTo',119,129,141,124]],'#ffb6a2',6);
  line(c,[['moveTo',99,175],['lineTo',98,184]],'#ffb6a2',5);
  freckles(c,113,211,'#a53149'); freckles(c,238,208,'#952c43');
  c.restore();
  sparkle(c,266,94,9,'#ffcc69'); sparkle(c,243,42,5,'#ffcc69');
}
function sun(c) {
  ground(c);
  leaf(c,174,301,-1.02,100,33,'#c4e96b','#469945');
  leaf(c,186,300,1,99,35,'#a9df5a','#318441');
  path(c,[['moveTo',168,206],['quadraticCurveTo',165,252,159,300],['quadraticCurveTo',178,315,195,299],['quadraticCurveTo',181,247,191,206],['closePath']],linear(c,166,218,194,300,['#9cdb57','#4fac46','#32823d']));
  ellipse(c,153,311,30,12,'#3d8e41',INK,5,-.15); ellipse(c,201,311,30,12,'#559c42',INK,5,.15);
  plantHead(c,179,215,'sun');
  for(let i=0;i<12;i++) {
    const flutter=c.actorPose?Math.sin(c.actorPose.phase+i*.7)*.032+c.actorPose.charge*.035*(i%2?1:-1):0;
    c.save(); c.translate(179,141); c.rotate(i*TAU/12+flutter);
    if(c.actorPose) c.translate(0,-c.actorPose.charge*4*(i%2?1:.5));
    path(c,[['moveTo',-19,-46],['bezierCurveTo',-35,-68,-22,-97,0,-112],['bezierCurveTo',24,-98,34,-70,20,-47],['quadraticCurveTo',0,-28,-19,-46]],linear(c,-12,-109,16,-43,['#fff3a4','#ffd84c','#edaa24']), '#836124',4.5);
    line(c,[['moveTo',0,-95],['quadraticCurveTo',-3,-73,0,-59]],'#ffe788',3);
    c.restore();
  }
  ellipse(c,179,142,68,68,radial(c,155,118,91,['#ffdb75','#f8b94e','#dc842d']),'#6d5625',6);
  // Tiny toasted seed marks ring the warm face.
  for(let i=0;i<22;i++) {
    const a=i*TAU/22;
    ellipse(c,179+Math.cos(a)*57,142+Math.sin(a)*57,1.7,3.1,'#bf7b2e',null,0,a-Math.PI/2);
  }
  eye(c,156,140,.96,0,'#5c4626'); eye(c,202,140,.96,0,'#5c4626');
  line(c,[['moveTo',145,118],['quadraticCurveTo',154,111,164,116]],'#795124',4);
  line(c,[['moveTo',192,116],['quadraticCurveTo',202,110,212,118]],'#795124',4);
  ellipse(c,138,160,10,6,'#ed9550',null); ellipse(c,219,160,10,6,'#ed9550',null);
  path(c,[['moveTo',154,164],['quadraticCurveTo',180,181,205,163],['quadraticCurveTo',199,190,179,191],['quadraticCurveTo',161,188,154,164]],'#7f4e29','#6d5027',3.5);
  path(c,[['moveTo',165,183],['quadraticCurveTo',178,174,192,184],['quadraticCurveTo',180,192,165,183]],'#f78865',null);
  line(c,[['moveTo',139,113],['quadraticCurveTo',150,103,165,101]],'#fff0ac',4);
  c.restore();
  sparkle(c,66,90,10,'#f1bc42'); sparkle(c,288,180,9,'#f1bc42'); sparkle(c,260,51,5,'#f1bc42');
}

function thorn(c) {
  ground(c);
  ellipse(c,146,309,33,13,'#34765e',INK,5,-.18);
  ellipse(c,211,309,34,13,'#42896c',INK,5,.18);
  // The asymmetric arms and tall, ribbed trunk distinguish this cactus from a sprout.
  cactusArm(c,false);
  path(c,[['moveTo',128,217],['lineTo',101,217],['quadraticCurveTo',80,217,80,193],['lineTo',80,166],['quadraticCurveTo',81,149,94,149],['quadraticCurveTo',109,149,109,167],['lineTo',109,186],['lineTo',136,186],['closePath']],linear(c,81,164,127,220,['#8ad8a5','#459f84','#2d7768']),INK,6);
  c.restore();
  cactusArm(c,true);
  path(c,[['moveTo',220,171],['lineTo',240,171],['lineTo',240,133],['quadraticCurveTo',240,117,254,117],['quadraticCurveTo',269,117,269,133],['lineTo',269,180],['quadraticCurveTo',269,204,243,204],['lineTo',220,204],['closePath']],linear(c,231,120,268,202,['#8fdab0','#469d89','#2d7768']),INK,6);
  c.restore();
  path(c,[['moveTo',127,292],['lineTo',124,123],['bezierCurveTo',124,85,146,61,177,63],['bezierCurveTo',208,62,229,85,230,123],['lineTo',232,290],['quadraticCurveTo',182,323,127,292],['closePath']],linear(c,127,93,229,275,['#9be0af','#63bd98','#368d7b','#246b62']),INK,7);
  line(c,[['moveTo',155,84],['bezierCurveTo',138,134,151,246,147,290]],'#b3e9bb',7);
  line(c,[['moveTo',195,81],['bezierCurveTo',214,143,197,237,208,291]],'#2e816d',6);
  line(c,[['moveTo',179,80],['lineTo',180,115]],'#79c9a0',4);
  line(c,[['moveTo',178,220],['lineTo',179,294]],'#79c9a0',4);
  // Golden areoles have a rosette of soft illustrated needles.
  for(const [x,y] of [[129,115],[224,109],[125,168],[229,243],[136,268],[210,275],[165,106],[200,106],[156,241],[203,227],[94,169],[255,143],[252,181]]) {
    if(x<110 || x>240) cactusArm(c,x>240); else c.save();
    ellipse(c,x,y,4.1,4.1,'#c5b76e',null);
    const outward=x<177?-1:1;
    line(c,[['moveTo',x,y],['lineTo',x+outward*12,y-8],['moveTo',x,y],['lineTo',x+outward*14,y+5],['moveTo',x,y],['lineTo',x,y-12]],'#f3d68a',2.8);
    c.restore();
  }
  eye(c,156,159,1.04,3); eye(c,199,156,1.04,3);
  line(c,[['moveTo',141,137],['quadraticCurveTo',153,129,167,139]],INK,5);
  line(c,[['moveTo',188,137],['quadraticCurveTo',202,126,214,132]],INK,5);
  path(c,[['moveTo',159,193],['quadraticCurveTo',180,206,199,189]],null,INK,4);
  ellipse(c,139,184,11,5,'#73bda1',null); freckles(c,213,181,'#367d67');
  // A closed rose bud, held inside a star of fleshy sepals.
  c.save();
  if(c.actorPose) { c.translate(179,77);c.rotate(Math.sin(c.actorPose.phase+1)*.12-c.actorPose.recoil*.12);c.translate(-179,-77); }
  leaf(c,179,77,-.75,37,13,'#a8df9e','#48876a');
  leaf(c,181,76,.83,38,13,'#a8df9e','#48876a');
  path(c,[['moveTo',164,61],['bezierCurveTo',150,42,169,21,181,17],['bezierCurveTo',200,25,211,44,196,62],['quadraticCurveTo',182,77,164,61]],linear(c,170,21,191,69,['#ffd4df','#f38dac','#ba507e']),INK,5);
  line(c,[['moveTo',177,29],['quadraticCurveTo',168,48,182,63],['quadraticCurveTo',196,49,189,35]],'#ffd8e5',3);
  c.restore();
  sparkle(c,291,213,7,'#e8d18b');
}
function spore(c) {
  ground(c);
  // Mycelium roots curl around a short violet stalk.
  for(const [x,y,ex,ey] of [[156,291,105,311],[166,300,131,327],[190,301,231,325],[202,287,254,310]]) {
    const curl=c.actorPose?Math.sin(c.actorPose.phase+ex*.02)*6+c.actorPose.charge*5:0;
    line(c,[['moveTo',x,y],['quadraticCurveTo',x,ey-8,ex,ey+curl]],INK,10);
    line(c,[['moveTo',x,y],['quadraticCurveTo',x,ey-8,ex,ey+curl]],'#b48cdb',5);
  }
  path(c,[['moveTo',146,181],['quadraticCurveTo',155,214,139,283],['quadraticCurveTo',142,314,181,316],['quadraticCurveTo',222,313,218,284],['quadraticCurveTo',201,224,215,180],['closePath']],linear(c,144,190,219,308,['#dfc9f5','#c29be2','#9163b5']),INK,6);
  path(c,[['moveTo',145,218],['quadraticCurveTo',180,243,214,217],['lineTo',224,232],['quadraticCurveTo',178,258,134,234],['closePath']],linear(c,148,220,217,244,['#c6aff1','#8c63ba']),INK,4);
  plantHead(c,179,215,'spore');
  ellipse(c,173,190,94,39,linear(c,159,154,187,225,['#e2e5fc','#a0e6d5','#6eb4be']),'#254c43',5);
  for(let i=0;i<11;i++) {
    const x=90+i*16;
    line(c,[['moveTo',x,182],['quadraticCurveTo',172,202,180,214]],'#68a4ae',2);
  }
  // A wide, lopsided cap with pearly freckles and luminous turquoise gills.
  path(c,[['moveTo',71,176],['bezierCurveTo',78,143,101,103,130,84],['bezierCurveTo',164,60,198,64,232,89],['bezierCurveTo',262,113,281,148,285,177],['bezierCurveTo',248,202,208,178,180,183],['bezierCurveTo',136,173,106,202,71,176],['closePath']],radial(c,143,107,157,['#dfc7ff','#b38bea','#895ec4','#594579']),INK,7);
  path(c,[['moveTo',77,175],['bezierCurveTo',114,191,141,169,177,177],['bezierCurveTo',217,173,247,193,278,176]],null,'#d3f8e6',6);
  for(const [x,y,rx,ry,a] of [[133,112,16,12,-.4],[201,101,12,9,.3],[231,141,19,12,.5],[104,151,9,7,-.5],[176,144,10,7,0]]) {
    ellipse(c,x,y,rx,ry,'#e7dcff','#795c9e',2,a);
    ellipse(c,x-2,y-3,rx*.5,ry*.35,'#fff4ff',null,0,a);
  }
  line(c,[['moveTo',110,124],['quadraticCurveTo',133,87,165,84]],'#e9d5ff',4);
  c.restore();
  eye(c,160,267,.87,2,'#47365d'); eye(c,196,266,.87,2,'#47365d');
  line(c,[['moveTo',169,289],['quadraticCurveTo',180,299,192,287]],'#47365d',3.5);
  ellipse(c,144,285,9,4,'#bc8bc8',null); ellipse(c,211,282,9,4,'#bc8bc8',null);
  // A tiny spore sprite hovers like a dragonfly beside the mushroom.
  c.save(); c.translate(281,84+(c.actorPose?Math.sin(c.actorPose.phase)*8:0)); c.rotate(.25);
  c.save();
  if(c.actorPose) c.scale(1,.5+Math.abs(Math.cos(c.actorPose.phase*2))*.6);
  ellipse(c,-13,-9,16,7,'#b9f8eabf','#51958a',2,-.5);
  ellipse(c,12,-11,16,7,'#e7ddffca','#8566a7',2,.5);
  ellipse(c,-11,4,12,6,'#d2fff2bf','#51958a',2,.3);
  ellipse(c,11,4,12,6,'#ded7ffca','#8566a7',2,-.3);
  c.restore();
  ellipse(c,0,-1,5,14,'#e2edb1',INK,2);
  ellipse(c,0,-13,7,7,'#c2f7ce',INK,2);
  c.restore();
  for(const [x,y,r] of [[63,114,4],[302,140,4],[78,238,3],[260,252,4],[281,221,2.5]]) {
    ellipse(c,x,y,r+4,r+4,'#9ce7d32a',null); ellipse(c,x,y,r,r,'#a5e4cb','#538b7a',1.5);
  }
  sparkle(c,66,211,7,'#b7e7dc'); sparkle(c,254,58,5,'#d4b6ef');
}

function scarecrow(c, kind) {
  const boss=kind==='boss', tank=kind==='tank', fast=kind==='runner', mender=kind==='mender', shield=kind==='shield';
  ground(c,180,325,boss?112:93);
  c.save();
  if (boss) { c.translate(-17,-16); c.scale(1.1,1.06); }
  const cloth= tank ? ['#e8d8ac','#b5a273','#86794d'] : boss ? ['#e8c68b','#ba8b55','#89663f'] : ['#f4dda9','#c5a369','#927449'];
  const shirt=fast?['#d4835d','#9c5042']:boss?['#ae6991','#653d63']:tank?['#74928a','#455f57']:mender?['#94aac0','#556d89']:shield?['#d1a870','#856545']:['#83a581','#527652'];
  // Straw peeking out from sleeves and trouser cuffs.
  line(c,[['moveTo',101,221],['lineTo',70,230],['moveTo',99,228],['lineTo',72,240],['moveTo',104,234],['lineTo',86,249]],'#b88d47',5);
  line(c,[['moveTo',244,227],['lineTo',276,238],['moveTo',241,234],['lineTo',265,249]],'#b88d47',5);
  path(c,[['moveTo',139,254],['lineTo',128,292],['lineTo',153,309],['lineTo',177,270],['closePath']],linear(c,141,264,163,299,cloth),INK,6);
  path(c,[['moveTo',188,264],['lineTo',195,305],['lineTo',224,304],['lineTo',225,256],['closePath']],linear(c,196,264,221,300,cloth),INK,6);
  line(c,[['moveTo',136,295],['lineTo',130,309],['moveTo',145,300],['lineTo',140,313],['moveTo',205,302],['lineTo',203,316],['moveTo',215,302],['lineTo',219,315]],'#dfbe75',4);
  path(c,[['moveTo',127,300],['quadraticCurveTo',116,301,105,312],['quadraticCurveTo',100,324,120,327],['lineTo',154,323],['lineTo',156,307],['closePath']],linear(c,120,302,138,325,['#856841','#594e35']),INK,5);
  path(c,[['moveTo',194,306],['lineTo',192,323],['quadraticCurveTo',218,332,248,322],['quadraticCurveTo',250,309,223,303],['closePath']],linear(c,203,305,221,329,['#8b7049','#5f5038']),INK,5);
  // Jacket shoulders slouch toward the garden, left-facing.
  path(c,[['moveTo',136,176],['bezierCurveTo',121,176,100,190,87,219],['lineTo',112,240],['lineTo',129,224],['lineTo',124,268],['quadraticCurveTo',173,290,228,268],['lineTo',226,226],['lineTo',247,248],['lineTo',270,227],['quadraticCurveTo',246,190,216,181],['closePath']],linear(c,130,181,222,274,shirt),INK,6);
  path(c,[['moveTo',170,190],['lineTo',164,272]],null,'#365844',4);
  for(const y of [218,240,260]) ellipse(c,176,y,3.7,3.7,'#dfbc71',INK,1.7);
  path(c,[['moveTo',197,231],['lineTo',222,235],['lineTo',217,257],['lineTo',193,253],['closePath']],fast?'#eecb85':'#ce9d68',INK,2.5);
  line(c,[['moveTo',198,237],['lineTo',218,241],['moveTo',202,232],['lineTo',199,253],['moveTo',213,234],['lineTo',210,254]],'#886e47',1.7);
  glove(c,88,234,-.8); glove(c,260,246,.35);
  // A stuffed linen head, ears tied with little twine bows.
  path(c,[['moveTo',113,99],['bezierCurveTo',108,130,103,155,127,177],['quadraticCurveTo',163,207,205,179],['bezierCurveTo',230,163,227,118,209,100],['closePath']],radial(c,144,114,112,cloth),INK,6);
  path(c,[['moveTo',113,132],['lineTo',91,140],['quadraticCurveTo',88,148,111,154]],'#d4b97e',INK,4);
  // Subtle woven strokes and sewn seam keep the material readable.
  line(c,[['moveTo',198,111],['quadraticCurveTo',212,144,197,174]],'#987b4b',2.5);
  for(let y=120;y<173;y+=10) line(c,[['moveTo',199,y],['lineTo',208,y+2]],'#79653f',2);
  for(const [x,y] of [[125,117],[177,116],[185,158],[135,167],[159,183]]) {
    line(c,[['moveTo',x-3,y],['lineTo',x+4,y]],'#d8bd84',1.8);
    line(c,[['moveTo',x,y-3],['lineTo',x,y+3]],'#a58b59',1.3);
  }
  // Button eyes and crooked eyebrows, with pupils aimed left.
  ellipse(c,133,137,12,14,'#fff0bc',INK,3);
  ellipse(c,130,138,6,8,'#344333',null); ellipse(c,127,134,2,2,'#fff',null);
  ellipse(c,178,139,13,14,boss?'#d6c381':'#576c4e',INK,3);
  line(c,[['moveTo',173,134],['lineTo',183,144],['moveTo',182,134],['lineTo',173,144]],boss?'#625b36':'#c5d39a',2.4);
  line(c,[['moveTo',119,120],['quadraticCurveTo',131,113,145,122]],INK,5);
  line(c,[['moveTo',165,123],['quadraticCurveTo',179,115,192,120]],INK,5);
  path(c,[['moveTo',119,161],['quadraticCurveTo',145,180,176,158]],null,'#4d5035',3.5);
  for(const [x,y] of [[129,166],[141,169],[153,168],[166,164]]) line(c,[['moveTo',x-2,y-4],['lineTo',x+2,y+5]],'#4d5035',2.5);
  ellipse(c,117,153,8,4,'#c78e60',null);
  // Straw wisps and a broad, asymmetric woven hat.
  for(const [x,y,tx,ty] of [[107,107,85,93],[112,110,87,110],[215,104,242,91],[212,112,242,114]]) line(c,[['moveTo',x,y],['lineTo',tx,ty]],'#c5984b',4);
  path(c,[['moveTo',115,89],['lineTo',124,52],['quadraticCurveTo',159,27,200,50],['lineTo',215,87],['closePath']],linear(c,137,44,188,96,['#f2d696','#d3ad62','#ab8040']),INK,5.5);
  // Crown stitching follows the weave.
  for(let i=0;i<4;i++) line(c,[['moveTo',129+i*5,59+i*4],['quadraticCurveTo',163,48+i*7,198+i*2,62+i*5]],'#bd944d',1.5);
  path(c,[['moveTo',119,75],['quadraticCurveTo',162,60,209,77],['lineTo',215,91],['quadraticCurveTo',169,78,115,92],['closePath']],fast?'#a84436':boss?'#733e64':'#5a7c4d',INK,3);
  path(c,[['moveTo',110,85],['bezierCurveTo',80,82,61,90,69,102],['bezierCurveTo',86,123,205,119,240,99],['quadraticCurveTo',250,88,228,84],['quadraticCurveTo',174,103,110,85],['closePath']],linear(c,121,84,139,118,['#f6dca0','#d0a259']),INK,6);
  line(c,[['moveTo',81,98],['quadraticCurveTo',157,117,229,95]],'#ffe6a7',3);
  if(fast) {
    path(c,[['moveTo',134,185],['quadraticCurveTo',174,199,208,182],['lineTo',219,195],['quadraticCurveTo',174,220,129,200],['closePath']],linear(c,144,186,194,210,['#f58e55','#bd4c3c']),INK,4);
    path(c,[['moveTo',214,195],['quadraticCurveTo',246,188,278,174],['lineTo',268,197],['lineTo',286,204],['quadraticCurveTo',247,217,212,207],['closePath']],linear(c,225,187,271,212,['#ed8051','#aa4335']),INK,4);
  }
  if(tank) {
    // Garden-tool armor is made from a weathered green watering can.
    path(c,[['moveTo',131,206],['quadraticCurveTo',174,220,221,206],['lineTo',223,264],['quadraticCurveTo',175,283,127,263],['closePath']],linear(c,133,208,215,270,['#9ab6a3','#698b7a','#456858']),INK,5);
    path(c,[['moveTo',149,223],['lineTo',202,223],['lineTo',201,252],['quadraticCurveTo',177,265,150,252],['closePath']],linear(c,151,224,203,256,['#c5d2b1','#84a087']),INK,3);
    for(const [x,y] of [[139,218],[211,219],[138,257],[211,258]]) ellipse(c,x,y,3.5,3.5,'#e6dca5',INK,1.5);
    line(c,[['moveTo',156,231],['lineTo',187,231]],'#e3e6c5',3);
    path(c,[['moveTo',115,78],['lineTo',129,63],['quadraticCurveTo',164,53,205,68],['lineTo',215,83]],null,'#779b83',9);
  }
  if(boss) {
    leaf(c,205,61,.7,49,14,'#c1a5cd','#885882');
    path(c,[['moveTo',144,190],['lineTo',165,208],['lineTo',177,195],['lineTo',191,210],['lineTo',211,188]],null,'#e5bb6d',6);
    ellipse(c,176,216,11,11,'#ddb967',INK,3);
    sparkle(c,176,215,5,'#fff1ae');
  }
  if(mender) {
    // The travelling tailor carries a shining ball of yarn and a blunt darning needle.
    path(c,[['moveTo',129,209],['lineTo',155,214],['lineTo',151,245],['lineTo',125,240],['closePath']],'#d6a078',INK,2.5);
    path(c,[['moveTo',192,256],['lineTo',215,255],['lineTo',219,272],['lineTo',193,275],['closePath']],'#b6bb7e',INK,2.5);
    for(const [x,y] of [[130,213],[145,217],[129,233],[145,237],[197,259],[212,259],[199,270],[213,268]]) line(c,[['moveTo',x-2,y-3],['lineTo',x+2,y+3]],'#776248',2);
    path(c,[['moveTo',132,187],['quadraticCurveTo',143,207,157,215],['moveTo',204,187],['quadraticCurveTo',194,209,188,215]],null,'#d5d2b0',4);
    path(c,[['moveTo',89,228],['lineTo',68,175],['quadraticCurveTo',68,162,74,166],['lineTo',96,224]],'#c0d9cb',INK,3);
    ellipse(c,72,172,2,4,'#436759',null,0,-.35);
    path(c,[['moveTo',73,166],['bezierCurveTo',48,148,58,131,74,135],['bezierCurveTo',95,139,64,159,62,179]],null,'#a8cc96',2.5);
    const glow=c.createRadialGradient(266,239,5,266,239,46);
    glow.addColorStop(0,'#e3ffbd6b');glow.addColorStop(1,'#e3ffbd00');
    ellipse(c,266,239,46,46,glow,null);
    ellipse(c,263,240,29,30,radial(c,251,226,43,['#edffb8','#b9dc84','#6f9d67']),INK,4);
    for(const offset of [-12,-3,7,16]) line(c,[['moveTo',243,223+offset*.4],['quadraticCurveTo',270+offset,228,273+offset*.3,257]],'#6e9c67',2);
    for(const offset of [-9,3,13]) line(c,[['moveTo',242,234+offset],['quadraticCurveTo',260,217+offset,284,234+offset]],'#e5f7b0',2.5);
    path(c,[['moveTo',250,266],['bezierCurveTo',260,285,286,269,288,285],['quadraticCurveTo',290,297,308,292]],null,'#a4c987',3);
    sparkle(c,281,217,8,'#efffc1');
    // A pincushion and small fabric swatch on the hat.
    path(c,[['moveTo',175,64],['lineTo',195,66],['lineTo',195,80],['lineTo',176,79],['closePath']],'#c38b9c',INK,2);
    for(const [x,y] of [[180,64],[187,65],[193,67]]) {line(c,[['moveTo',x,y],['lineTo',x-2,y-12]],'#c7dacc',2);ellipse(c,x-2,y-12,2.5,2.5,'#efc67e',INK,1);}
  }
  if(shield) {
    // A wide oak-and-iron shield sits in front of the body, never across the face.
    path(c,[['moveTo',88,206],['quadraticCurveTo',143,180,205,205],['lineTo',202,262],['quadraticCurveTo',188,298,145,320],['quadraticCurveTo',103,297,91,264],['closePath']],linear(c,94,197,198,300,['#b4c8a4','#718f78','#466454']),INK,6);
    path(c,[['moveTo',102,217],['quadraticCurveTo',146,199,191,217],['lineTo',189,258],['quadraticCurveTo',177,283,145,305],['quadraticCurveTo',115,283,104,258],['closePath']],linear(c,105,211,192,292,['#d6b27a','#ae8350','#84603e']),INK,4);
    line(c,[['moveTo',132,210],['lineTo',130,292],['moveTo',160,209],['lineTo',162,292]],'#725d3b',3);
    line(c,[['moveTo',111,230],['quadraticCurveTo',125,226,130,237],['moveTo',165,264],['quadraticCurveTo',177,255,184,260]],'#c8a26c',2);
    ellipse(c,146,247,25,25,radial(c,136,236,39,['#dce5bd','#a0b88d','#648270']),INK,4);
    path(c,[['moveTo',146,229],['quadraticCurveTo',127,241,146,263],['quadraticCurveTo',166,243,146,229]],'#6b8c66',INK,2.5);
    line(c,[['moveTo',146,237],['lineTo',146,255]],'#d2e0a5',2);
    for(const [x,y] of [[98,213],[195,212],[102,257],[191,257],[145,311]]) ellipse(c,x,y,3.6,3.6,'#e4dfae',INK,1.8);
    glove(c,207,234,.45);
    path(c,[['moveTo',129,77],['quadraticCurveTo',161,66,198,78]],null,'#899c77',8);
    ellipse(c,165,75,8,8,'#dbc685',INK,2);
  }
  c.restore();
}
function glove(c,x,y,angle) {
  c.save(); c.translate(x,y); c.rotate(angle);
  path(c,[['moveTo',-15,-8],['quadraticCurveTo',-17,5,-8,15],['quadraticCurveTo',3,24,15,13],['quadraticCurveTo',24,5,17,-2],['lineTo',10,1],['quadraticCurveTo',13,-15,4,-15],['quadraticCurveTo',-2,-18,-6,-10],['closePath']],linear(c,-10,-15,10,20,['#fff0c2','#d4bc8c']),INK,4);
  line(c,[['moveTo',-6,3],['lineTo',-3,12],['moveTo',2,1],['lineTo',5,12]],'#a08a60',2);
  c.restore();
}

/** Returns a cached transparent 360px canvas, ready for drawImage(). */
export function portrait(type='pea') {
  const id=String(type).toLowerCase();
  if(portraits.has(id)) return portraits.get(id);
  const canvas=document.createElement('canvas');
  canvas.width=360; canvas.height=360;
  const c=canvas.getContext('2d');
  c.lineJoin='round'; c.lineCap='round';
  if(id==='pea') pea(c);
  else if(id==='ice') ice(c);
  else if(id==='bomb') bomb(c);
  else if(id==='sun') sun(c);
  else if(id==='thorn') thorn(c);
  else if(id==='spore') spore(c);
  else {
    const kind=/mender|tailor/.test(id)?'mender':/shield/.test(id)?'shield':/boss|giant|brute/.test(id)?'boss':/tank|armor|bucket|guard/.test(id)?'tank':/runner|fast|scout/.test(id)?'runner':'bug';
    scarecrow(c,kind);
  }
  portraits.set(id,canvas);
  return canvas;
}

// Atlas artwork is drawn as independent botanical parts and a small jointed rig.
// Portraits never receive actorPose and therefore retain their original 360px art.
const atlases=new Map();
const headLayers=new Map();
const PLANT_DRAW={pea,ice,bomb,sun,thorn,spore};
const RECOIL=[0,-.12,-.24,1,.56,-.1,.07,0];
const CHARGE=[0,.18,.46,.78,1,.56,.16,0];
const HIT=[0,.58,1,.66,.35,.16,.05,0];
const STRIKE=[0,-.18,-.38,1,.72,.28,.06,0];
function pivot(c,x,y,angle=0) { c.translate(x,y);c.rotate(angle);c.translate(-x,-y); }
function plantHead(c,x,y,kind='plant') {
  c.save();
  const p=c.actorPose;
  if(!p)return;
  const breathe=Math.sin(p.phase)*.018;
  c.translate(-p.recoil*17-p.hit*16,Math.sin(p.phase+.4)*2+p.recoil*4+p.hit*5);
  pivot(c,x,y,breathe-p.recoil*.055-p.hit*.14);
  if(kind==='bomb') {
    c.translate(x,y); c.scale(1+p.charge*.085,1+p.charge*.047); c.translate(-x,-y);
  } else if(kind==='spore') {
    c.translate(x,y);c.scale(1+p.charge*.05,1-p.charge*.05);c.translate(-x,-y);
  } else if(kind==='sun') {
    pivot(c,179,141,Math.sin(p.phase)*.018+p.charge*.025);
  }
}
function cactusArm(c,right) {
  c.save();
  const p=c.actorPose;
  if(p)pivot(c,right?224:128,right?188:209,Math.sin(p.phase+(right?1.5:0))*.095+(right?-1:1)*p.recoil*.16+p.hit*.16);
}
function enemyType(id) {
  return /mender|tailor/.test(id)?'mender':/shield/.test(id)?'shield':/boss|giant|brute/.test(id)?'boss':/tank|armor|bucket|guard/.test(id)?'tank':/runner|fast|scout/.test(id)?'runner':'bug';
}
function enemyHead(kind) {
  if(headLayers.has(kind))return headLayers.get(kind);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=360;
  const c=canvas.getContext('2d');
  // Union mask: brim and crown, stuffed linen face, then the left-facing nose.
  c.beginPath();c.rect(48,121,245,-136);
  c.moveTo(113,99);c.bezierCurveTo(108,130,103,155,127,177);c.quadraticCurveTo(163,207,205,179);c.bezierCurveTo(230,163,227,118,209,100);c.closePath();
  c.moveTo(113,132);c.lineTo(91,140);c.quadraticCurveTo(88,148,111,154);c.closePath();
  c.clip();
  if(kind==='boss') { c.translate(17/1.1,16/1.06);c.scale(1/1.1,1/1.06); }
  c.drawImage(portrait(kind),0,0);
  headLayers.set(kind,canvas);return canvas;
}
function jointBetween(start,end,l1,l2,bend=1) {
  const dx=end[0]-start[0],dy=end[1]-start[1],d=Math.max(1,Math.hypot(dx,dy));
  const along=Math.min(d,(l1*l1-l2*l2+d*d)/(2*d));
  const height=Math.sqrt(Math.max(0,l1*l1-along*along))*bend;
  return [start[0]+dx/d*along-dy/d*height,start[1]+dy/d*along+dx/d*height];
}
function rigLimb(c,a,b,d,width,colors) {
  const points=[['moveTo',...a],['lineTo',...b],['lineTo',...d]];
  line(c,points,INK,width+7);
  line(c,points,linear(c,a[0]-10,a[1],d[0]+10,d[1],colors),width);
  // A seam and lit cloth edge turn each limb into two readable segments.
  line(c,[['moveTo',b[0]-width*.25,b[1]-2],['lineTo',b[0]+width*.25,b[1]+2]],colors[1],2);
  line(c,[['moveTo',a[0]-width*.17,a[1]+5],['lineTo',b[0]-width*.17,b[1]-5]],colors[0],2.5);
}
function rigBoot(c,x,y,angle) {
  c.save();c.translate(x,y);c.rotate(angle);
  line(c,[['moveTo',-5,-8],['lineTo',-9,-17],['moveTo',3,-8],['lineTo',4,-18],['moveTo',9,-8],['lineTo',14,-15]],'#ddbd78',3);
  path(c,[['moveTo',-13,-11],['quadraticCurveTo',-26,-9,-30,0],['quadraticCurveTo',-34,9,-19,11],['lineTo',16,10],['quadraticCurveTo',22,2,14,-12],['closePath']],linear(c,-15,-12,12,12,['#9a7a4f','#64533a']),INK,4.5);
  line(c,[['moveTo',-24,5],['lineTo',13,5]],'#b89a66',2);c.restore();
}
function rigJacket(c,kind) {
  const colors=kind==='runner'?['#d4835d','#9c5042']:kind==='boss'?['#ae6991','#653d63']:kind==='tank'?['#74928a','#455f57']:kind==='mender'?['#94aac0','#556d89']:kind==='shield'?['#d1a870','#856545']:['#83a581','#527652'];
  path(c,[['moveTo',137,181],['quadraticCurveTo',174,194,214,184],['quadraticCurveTo',228,219,225,270],['quadraticCurveTo',174,288,125,268],['quadraticCurveTo',127,218,137,181],['closePath']],linear(c,132,184,221,273,colors),INK,6);
  line(c,[['moveTo',169,194],['lineTo',165,272]],'#365844',3);
  for(const y of [216,238,260])ellipse(c,177,y,3.5,3.5,'#e6c780',INK,1.5);
  path(c,[['moveTo',196,232],['lineTo',219,236],['lineTo',215,257],['lineTo',192,253],['closePath']],'#d4a276',INK,2.5);
  line(c,[['moveTo',201,233],['lineTo',198,254],['moveTo',213,236],['lineTo',209,255]],'#8e704b',1.8);
  if(kind==='tank') {
    path(c,[['moveTo',131,207],['quadraticCurveTo',176,219,221,207],['lineTo',223,264],['quadraticCurveTo',175,282,127,263],['closePath']],linear(c,133,208,215,270,['#a5bfa8','#698b7a','#456858']),INK,5);
    path(c,[['moveTo',149,224],['lineTo',202,224],['lineTo',201,251],['quadraticCurveTo',177,264,150,251],['closePath']],linear(c,151,224,203,256,['#c5d2b1','#84a087']),INK,3);
    for(const [x,y] of [[139,218],[211,219],[138,257],[211,258]])ellipse(c,x,y,3.5,3.5,'#e6dca5',INK,1.5);
    line(c,[['moveTo',156,232],['lineTo',187,232]],'#e3e6c5',3);
  }
  if(kind==='boss') {
    path(c,[['moveTo',142,189],['lineTo',162,208],['lineTo',177,195],['lineTo',192,208],['lineTo',212,190]],null,'#e5bb6d',5);
    ellipse(c,177,218,10,10,'#ddb967',INK,3);sparkle(c,177,217,5,'#fff1ae');
  }
  if(kind==='mender') {
    path(c,[['moveTo',130,210],['lineTo',154,214],['lineTo',150,243],['lineTo',126,239],['closePath']],'#d6a078',INK,2.5);
    path(c,[['moveTo',191,258],['lineTo',214,256],['lineTo',217,272],['lineTo',192,275],['closePath']],'#b6bb7e',INK,2.5);
    for(const [x,y] of [[132,215],[146,218],[132,235],[146,238],[197,260],[210,259],[199,270],[212,268]])line(c,[['moveTo',x-2,y-3],['lineTo',x+2,y+3]],'#776248',2);
    line(c,[['moveTo',136,188],['quadraticCurveTo',148,213,159,220],['moveTo',206,188],['quadraticCurveTo',196,212,189,219]],'#d5d2b0',4);
  }
}
function rigShield(c,x,y,angle=0) {
  c.save();c.translate(x,y);c.rotate(angle);
  path(c,[['moveTo',-56,-47],['quadraticCurveTo',0,-73,58,-47],['lineTo',55,10],['quadraticCurveTo',41,46,0,68],['quadraticCurveTo',-43,45,-54,12],['closePath']],linear(c,-50,-53,51,48,['#b4c8a4','#718f78','#466454']),INK,6);
  path(c,[['moveTo',-43,-36],['quadraticCurveTo',0,-55,44,-36],['lineTo',42,5],['quadraticCurveTo',31,30,0,52],['quadraticCurveTo',-30,30,-42,5],['closePath']],linear(c,-40,-42,45,40,['#d6b27a','#ae8350','#84603e']),INK,4);
  line(c,[['moveTo',-14,-43],['lineTo',-16,39],['moveTo',14,-44],['lineTo',16,38]],'#725d3b',3);
  ellipse(c,0,-6,25,25,radial(c,-10,-17,39,['#dce5bd','#a0b88d','#648270']),INK,4);
  path(c,[['moveTo',0,-24],['quadraticCurveTo',-19,-12,0,10],['quadraticCurveTo',20,-10,0,-24]],'#6b8c66',INK,2.5);
  line(c,[['moveTo',0,-17],['lineTo',0,2]],'#d2e0a5',2);
  for(const [dx,dy] of [[-48,-43],[50,-43],[-44,4],[47,4],[0,59]])ellipse(c,dx,dy,3.4,3.4,'#e4dfae',INK,1.6);
  c.restore();
}
function rigYarn(c,x,y,phase) {
  c.save();c.translate(x,y);
  ellipse(c,0,0,25,26,radial(c,-10,-12,40,['#edffb8','#b9dc84','#6f9d67']),INK,4);
  for(const n of [-10,-2,8,15])line(c,[['moveTo',-18,-15+n*.3],['quadraticCurveTo',5+n,-9,10+n*.2,15]],'#6e9c67',2);
  for(const n of [-8,3,12])line(c,[['moveTo',-20,-6+n],['quadraticCurveTo',-1,-22+n,20,-5+n]],'#e5f7b0',2.5);
  line(c,[['moveTo',-4,25],['bezierCurveTo',-1,42,27,25,31,44],['quadraticCurveTo',34,51,43+Math.sin(phase)*5,46]],'#a4c987',3);
  sparkle(c,16,-19,5+Math.sin(phase)*1.3,'#efffc1');c.restore();
}
function drawEnemyFrame(c,kind,action,frame) {
  const phase=frame/8*TAU,walk=action==='walk',strike=action==='attack'?STRIKE[frame]:0,hit=action==='hurt'?HIT[frame]:0;
  const gait=walk?Math.sin(phase):0,bob=walk?Math.cos(phase*2)*2:0;
  const tx=-strike*8+hit*13,ty=bob+hit*5,tilt=(walk?Math.sin(phase)*.016:0)-strike*.08+hit*.1;
  const project=([x,y])=>[180+tx+(x-180)*Math.cos(tilt)-(y-240)*Math.sin(tilt),240+ty+(x-180)*Math.sin(tilt)+(y-240)*Math.cos(tilt)];
  const cloth=['#edd7a4','#ae905e','#876e47'];
  const shirt=kind==='runner'?['#d4835d','#9c5042']:kind==='boss'?['#ae6991','#653d63']:kind==='tank'?['#74928a','#455f57']:kind==='mender'?['#94aac0','#556d89']:kind==='shield'?['#d1a870','#856545']:['#83a581','#527652'];
  ground(c,180,329,kind==='boss'?99:91);
  // Both feet have a stance phase, toe lift and a separately solved knee.
  for(const side of [1,0]) {
    const a=phase+(side?Math.PI:0),hip=project([side?200:151,262]);
    const foot=[(side?202:145)+(walk?Math.sin(a)*29:0)-strike*5+hit*(side?7:13),322-(walk?Math.max(0,Math.cos(a))*17:0)+hit*(side?-5:0)];
    const knee=jointBetween(hip,foot,35,35,1);
    rigLimb(c,hip,knee,foot,21,cloth);
    rigBoot(c,foot[0],foot[1],walk?Math.sin(a)*.13:hit*.12);
  }
  const arm=(side)=> {
    const a=phase+(side?0:Math.PI),shoulder=project([side?218:136,201]);
    const wrist=project([side?252-(walk?Math.sin(a)*21:0)-strike*12:100+(walk?Math.sin(a)*19:0)-strike*44,side?244-(walk?Math.cos(a)*6:0)-strike*14-hit*15:241-(walk?Math.cos(a)*7:0)-strike*39-hit*29]);
    const elbow=jointBetween(shoulder,wrist,39,39,side?-1:1);
    rigLimb(c,shoulder,elbow,wrist,23,shirt);
    const wristAngle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])-Math.PI/2;
    glove(c,wrist[0],wrist[1],wristAngle*.4);
    if(kind==='mender') {
      if(side)rigYarn(c,wrist[0]+11,wrist[1]+1,phase);
      else {
        c.save();c.translate(...wrist);c.rotate(-strike*.75+(walk?Math.sin(a)*.12:0));
        path(c,[['moveTo',-4,-4],['lineTo',-22,-47],['quadraticCurveTo',-21,-56,-16,-50],['lineTo',5,-5]],'#c0d9cb',INK,2.5);
        ellipse(c,-19,-46,1.5,3,'#436759',null,0,-.3);
        line(c,[['moveTo',-21,-51],['bezierCurveTo',-29,-61,-18,-69,-9,-59],['quadraticCurveTo',2,-51,-16,-44]],'#a8cc96',2);
        c.restore();
      }
    }
    if(kind==='shield'&&!side)rigShield(c,wrist[0]+31,wrist[1]+7,(walk?Math.sin(a)*.09:0)-strike*.12+hit*.08);
  };
  arm(1);
  c.save();c.translate(180+tx,240+ty);c.rotate(tilt);c.translate(-180,-240);
  rigJacket(c,kind);
  if(kind==='runner') {
    path(c,[['moveTo',208,191],['quadraticCurveTo',247,183+gait*6,274,174+gait*8],['lineTo',267,196+gait*4],['lineTo',285,204+gait*5],['quadraticCurveTo',249,216,208,204],['closePath']],linear(c,218,184,270,213,['#ef8755','#ac4336']),INK,4);
    path(c,[['moveTo',133,184],['quadraticCurveTo',174,199,208,184],['lineTo',216,198],['quadraticCurveTo',171,215,129,199],['closePath']],linear(c,144,187,194,208,['#f58e55','#bd4c3c']),INK,4);
  }
  c.restore();
  arm(0);
  c.save();c.translate(180+tx,240+ty);c.rotate(tilt);c.translate(-180,-240);
  pivot(c,169,189,(walk?Math.sin(phase+.5)*.026:0)-strike*.05+hit*.14);
  c.drawImage(enemyHead(kind),0,0);
  if(strike>.2) {
    ellipse(c,147,169,15*strike,7*strike,'#514c33',null,0,-.1);
    line(c,[['moveTo',135,167],['quadraticCurveTo',147,171,158,166]],'#e7cd96',2);
  }
  if(hit>.3) {
    line(c,[['moveTo',124,133],['lineTo',138,143],['moveTo',137,132],['lineTo',124,144]],INK,3);
    sparkle(c,111,101,6*hit,'#f6da85');sparkle(c,214,118,7*hit,'#f6da85');
  }
  c.restore();
}
function plantEmission(c,type,p) {
  if(p.action!=='act'||p.frame<3||p.frame>6)return;
  const flight=(p.frame-3)/3;
  c.save();c.globalAlpha=1-flight*.65;
  if(type==='sun') {
    const x=240+flight*58,y=105-flight*57;
    for(let i=0;i<8;i++) {const a=i*TAU/8;line(c,[['moveTo',x+Math.cos(a)*20,y+Math.sin(a)*20],['lineTo',x+Math.cos(a)*27,y+Math.sin(a)*27]],'#edb241',3.5);}
    ellipse(c,x,y,16,16,radial(c,x-4,y-5,23,['#fff5b4','#ffd45e','#e9a636']),'#8b6a2c',3);
    sparkle(c,x-28,y+24,5,'#ffdf79');
  } else if(type==='spore') {
    for(let i=0;i<6;i++) {const a=(i-2.5)*.27,x=250+flight*70+Math.cos(a)*i*3,y=144+Math.sin(a)*65-flight*45;ellipse(c,x,y,4+i%2,4+i%2,i%2?'#ddc4fb':'#a7e9cb','#60817b',1.8);}
  } else if(type==='thorn') {
    for(let i=0;i<3;i++) {const x=269+flight*58,y=146+i*22;path(c,[['moveTo',x-21,y+3],['lineTo',x+8,y],['lineTo',x-21,y-3],['closePath']],'#f4d994',INK,1.7);}
  } else if(type==='ice') {
    const x=263+flight*65,y=146;snowflake(c,x,y,12);sparkle(c,x+15,y-8,5,'#c8f5ff');
  } else if(type==='bomb') {
    for(let i=0;i<4;i++)sparkle(c,230+i*16+flight*9,53+i*24-flight*25,4+(i%2)*2,'#ffce6e');
  } else {
    const x=299+flight*38,y=158-flight*2;
    ellipse(c,x,y,10,9,radial(c,x-3,y-3,14,['#d9fa92','#8dca50','#458b43']),INK,2.5);
    line(c,[['moveTo',x-29,y-6],['lineTo',x-16,y-4],['moveTo',x-34,y+4],['lineTo',x-19,y+4]],'#b6db82',2);
  }
  c.restore();
}

/**
 * Lazy 8-pose RGBA sprite sheet. Cells are 176px, row-major, 4 columns × 2 rows.
 * Plants: idle (loop), act/hurt (one shot). Mobs: walk (loop), attack/hurt (one shot).
 * A fixed ground anchor is maintained while leaves, joints and accessories move.
 */
export function animatedAtlas(type='pea',action) {
  const id=String(type).toLowerCase(),plant=Boolean(PLANT_DRAW[id]);
  const requested=String(action||(plant?'idle':'walk')).toLowerCase();
  const valid=plant?['idle','act','hurt']:['walk','attack','hurt'];
  const state=valid.includes(requested)?requested:valid[0],key=id+':'+state;
  if(atlases.has(key))return atlases.get(key);
  const canvas=document.createElement('canvas');canvas.width=704;canvas.height=352;
  const c=canvas.getContext('2d');c.lineJoin='round';c.lineCap='round';
  for(let frame=0;frame<8;frame++) {
    c.save();c.beginPath();c.rect(frame%4*176,Math.floor(frame/4)*176,176,176);c.clip();
    c.translate(frame%4*176+12,Math.floor(frame/4)*176+18);c.scale(.42,.42);
    if(plant) {
      const p={plant:true,frame,action:state,phase:frame/(state==='idle'?8:7)*TAU,recoil:state==='act'?RECOIL[frame]:0,charge:state==='act'?CHARGE[frame]:0,hit:state==='hurt'?HIT[frame]:0,blink:state==='idle'?frame===5:state==='hurt'&&(frame===2||frame===3)};
      c.actorPose=p;PLANT_DRAW[id](c);plantEmission(c,id,p);delete c.actorPose;
    } else drawEnemyFrame(c,enemyType(id),state,frame);
    c.restore();
  }
  const atlas=Object.freeze({canvas,cols:4,rows:2,frames:8,tile:176,frameWidth:176,frameHeight:176});
  atlases.set(key,atlas);return atlas;
}
