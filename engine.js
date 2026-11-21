/** Brote Bravo: deterministic, DOM-free lane defence simulation. Distances are cells. */
export const PLANTS = Object.freeze([
  Object.freeze({ id: 'pea', name: 'Guisante', unlockLevel: 1, cost: 90, ability: 'Dispara guisantes a su fila.', description: 'Daño constante a distancia.', icon: '●', color: '#72d35c', hp: 150, maxHp: 150, damage: 25, interval: 1.05 }),
  Object.freeze({ id: 'ice', name: 'Escarcha', unlockLevel: 3, cost: 120, ability: 'Ralentiza a los espantajos de su fila.', description: 'Sus disparos ralentizan durante 3 segundos y atraviesan escudos.', icon: '❄', color: '#74d6f2', hp: 160, maxHp: 160, damage: 15, interval: 1.45 }),
  Object.freeze({ id: 'bomb', name: 'Petabrote', unlockLevel: 6, cost: 150, ability: 'Espera a un espantajo y explota en un área grande.', description: 'Una trampa de un solo uso que alcanza filas vecinas e ignora escudos.', icon: '✹', color: '#ff9361', hp: 220, maxHp: 220, damage: 380, radius: 1.85 }),
  Object.freeze({ id: 'sun', name: 'Girasol', unlockLevel: 1, cost: 65, ability: 'Produce 28 de energía cada 7 segundos.', description: 'Más energía para hacer crecer tu defensa.', icon: '☀', color: '#ffd35b', hp: 120, maxHp: 120, interval: 7, production: 28 }),
  Object.freeze({ id: 'thorn', name: 'Cactus', unlockLevel: 11, cost: 175, ability: 'Sus espinas atraviesan hasta tres enemigos.', description: 'Ideal para filas con grupos compactos.', icon: '✦', color: '#b5d65c', hp: 190, maxHp: 190, damage: 43, interval: 1.45, piercing: 3 }),
  Object.freeze({ id: 'spore', name: 'Micelio', unlockLevel: 16, cost: 165, ability: 'Esporas en área con veneno persistente.', description: 'Ignora escudos y envenena grupos durante 5 segundos.', icon: '✿', color: '#d78cf0', hp: 140, maxHp: 140, damage: 19, interval: 2.1, radius: 1.15, poisonDamage: 7, poisonDuration: 5 }),
]);

export const ENEMIES = Object.freeze([
  { id: 'bug', name: 'Espantajo', unlockLevel: 1, ability: 'Avanza y muerde las plantas de su fila.' },
  { id: 'runner', name: 'Corredor de paja', unlockLevel: 4, ability: 'Corre rápido, pero tiene poca resistencia.' },
  { id: 'tank', name: 'Coraza de paja', unlockLevel: 7, ability: 'Lento y resistente: necesita daño sostenido.' },
  { id: 'shield', name: 'Escudero', unlockLevel: 9, ability: 'Su escudo reduce los guisantes y espinas. Escarcha, explosiones y esporas lo atraviesan.' },
  { id: 'boss', name: 'Gran Espantajo', unlockLevel: 10, ability: 'Lidera la última oleada en las misiones 10, 15 y 20.' },
  { id: 'mender', name: 'Remendón', unlockLevel: 13, ability: 'Cura a los aliados cercanos cada 3 segundos.' },
].map(Object.freeze));

const REGIONS = [
  { name: 'Pradera del molino', terrainName: 'Tierra abonada', terrainDescription: 'Las tres casillas doradas mejoran un 20% el ataque y la producción.' },
  { name: 'Bosque de ámbar', terrainName: 'Savias de ámbar', terrainDescription: 'La columna de ámbar mejora un 35% el ataque y la producción. Elegí cómo aprovecharla.' },
  { name: 'Valle de escarcha', terrainName: 'Sendero nevado', terrainDescription: 'La franja de nieve frena un 28% a los enemigos; se combina con Escarcha.' },
  { name: 'Huerto lunar', terrainName: 'Marea lunar', terrainDescription: 'La luna entrega 35 de energía cada 12 segundos mientras defendés el huerto.' },
];

const NAMES = ['El primer brote', 'Pasos en el huerto', 'Rocío de mañana', 'La senda de la paja', 'Raíces firmes', 'Viento de carrera', 'Bajo las hojas', 'El jardín despierta', 'Corazas al sol', 'El puente verde', 'La tarde inquieta', 'Carrera entre flores', 'Noche de escarcha', 'El huerto cercado', 'La gran coraza', 'Tormenta de paja', 'Raíces valientes', 'Asedio al invernadero', 'El último sendero', 'El corazón del jardín'];
export const LEVELS = Object.freeze(NAMES.map((name, index) => Object.freeze({
  id: index + 1,
  name,
  waves: 2 + Math.floor(index / 5),
  region: Math.floor(index / 5),
  regionName: REGIONS[Math.floor(index / 5)].name,
  terrainName: REGIONS[Math.floor(index / 5)].terrainName,
  terrainDescription: REGIONS[Math.floor(index / 5)].terrainDescription,
  description: index < 3 ? 'Aprendé a defender las cinco filas.' : index < 8 ? 'Los corredores ponen a prueba tus reflejos.' : index < 14 ? 'Combiná escarcha y explosiones contra escudos y corazas.' : 'Espinas, veneno y energía lunar para defender el corazón del jardín.',
})));

const DEFINITIONS = Object.fromEntries(PLANTS.map(plant => [plant.id, plant]));
const ROWS = 5;
const COLS = 8;
const ENEMY_STATS = {
  bug: { hp: 68, speed: .22, damage: 18, attackInterval: .95, reward: 13 },
  runner: { hp: 48, speed: .35, damage: 13, attackInterval: .78, reward: 12 },
  tank: { hp: 180, speed: .14, damage: 25, attackInterval: 1.05, reward: 22 },
  shield: { hp: 135, speed: .18, damage: 22, attackInterval: .95, reward: 24 },
  mender: { hp: 112, speed: .18, damage: 16, attackInterval: 1, reward: 28 },
  boss: { hp: 400, speed: .12, damage: 34, attackInterval: 1.1, reward: 55 },
};

export class Game {
  constructor(level = 1, unlockedLevel = level) {
    this.level = Math.max(1, Math.min(20, Math.floor(Number(level) || 1)));
    this.unlockedLevel = Math.max(this.level, Math.min(20, Math.floor(Number(unlockedLevel) || this.level)));
    this.region = LEVELS[this.level - 1].region;
    this.boostCells = this.region === 0 ? [{ row: 1, col: 1, multiplier: 1.2 }, { row: 3, col: 1, multiplier: 1.2 }, { row: 2, col: 0, multiplier: 1.2 }] : this.region === 1 ? Array.from({ length: 5 }, (_, row) => ({ row, col: 3, multiplier: 1.35 })) : [];
    this.snowZones = this.region === 2 ? [{ x: 3, width: 2, multiplier: .72 }] : [];
    this.nightPulseIn = this.region === 3 ? 12 : 0;
    this.terrainPulse = 0;
    this.energy = 240 + Math.floor((this.level - 1) / 5) * 20;
    this.lives = 5;
    this.wave = 1;
    this.phase = 'ready';
    this.plants = [];
    this.enemies = [];
    this.shots = [];
    this.effects = [];
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.totalWaves = LEVELS[this.level - 1].waves;
    this._events = [];
    this._nextId = 1;
    this._rng = (this.level * 2654435761) >>> 0;
    this._spawnQueue = [];
    this._waveTotal = 0;
    this._waveResolved = 0;
    this._waveGap = 0;
    this._energyFraction = 0;
    this._seedReceipts = new Map();
    if (this.level === 1) {
      this.plant('pea', 1, 1);
      this.plant('sun', 3, 0);
      this.energy = 240;
      this._events = [];
    }
  }

  /** Progress of the current wave, counting defeated/escaped foes and damage. */
  get waveProgress() {
    if (this.phase === 'won') return 1;
    if (!this._waveTotal) return 0;
    const damage = this.enemies.reduce((sum, enemy) => sum + Math.max(0, 1 - enemy.hp / enemy.maxHp), 0);
    return Math.max(0, Math.min(1, (this._waveResolved + damage) / this._waveTotal));
  }

  start() {
    if (this.phase !== 'ready') return false;
    this.phase = 'playing';
    this._prepareWave();
    this._emit('start', { level: this.level });
    return true;
  }

  canPlant(type, row, col) {
    return Boolean(this.canLaunchSeed(type) &&
      Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < ROWS && col >= 0 && col < COLS &&
      !this.plants.some(plant => plant.row === row && plant.col === col));
  }

  canLaunchSeed(type) {
    const definition = DEFINITIONS[type];
    return Boolean(definition && definition.unlockLevel <= this.unlockedLevel &&
      (this.phase === 'ready' || this.phase === 'playing') && this.energy >= definition.cost);
  }

  /** Reserve the cost at release. Only this exact receipt can settle the seed. */
  launchSeed(type) {
    if (!this.canLaunchSeed(type)) return null;
    const receipt = Object.freeze({ id: this._id(), type, cost: DEFINITIONS[type].cost });
    this.energy -= receipt.cost;
    this._seedReceipts.set(receipt.id, receipt);
    this._emit('launch', { receiptId: receipt.id, plantType: type, cost: receipt.cost });
    return receipt;
  }

  /** A receipt is consumed exactly once, including missed and cancelled flights. */
  landSeed(receipt, row, col) {
    if (!receipt || this._seedReceipts.get(receipt.id) !== receipt) return 'cancelled';
    this._seedReceipts.delete(receipt.id);
    if (this.phase !== 'ready' && this.phase !== 'playing') return 'cancelled';
    let result = 'planted';
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) result = 'outside';
    else if (this.plants.some(plant => plant.row === row && plant.col === col)) result = 'occupied';
    if (result !== 'planted') {
      const refund = Math.floor(receipt.cost / 2);
      this.energy = Math.min(999, this.energy + refund);
      this._emit('seedLost', { receiptId: receipt.id, plantType: receipt.type, reason: result, refund });
      return result;
    }
    this._createPlant(receipt.type, row, col);
    return 'planted';
  }

  plant(type, row, col) {
    if (!this.canPlant(type, row, col)) return false;
    const definition = DEFINITIONS[type];
    this.energy -= definition.cost;
    this._createPlant(type, row, col);
    return true;
  }

  _createPlant(type, row, col) {
    const definition = DEFINITIONS[type];
    const plant = { id: this._id(), type, row, col, x: col + .5, y: row + .5,
      hp: definition.hp, maxHp: definition.hp, cooldown: type === 'sun' ? 4 : .2,
      age: 0, armed: type === 'bomb', fuse: null,
      boost: this.boostCells.find(cell => cell.row === row && cell.col === col)?.multiplier || 1 };
    this.plants.push(plant);
    this._emit('plant', { id: plant.id, plantId: plant.id, plantType: type, row, col, x: plant.x, y: plant.y, cost: definition.cost });
    return plant;
  }

  drainEvents() {
    const events = this._events;
    this._events = [];
    return events;
  }

  /** Call only while unpaused. Large frame gaps are capped at 1 simulated second. */
  update(dtSeconds) {
    if (this.phase !== 'playing' || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    let remaining = Math.min(dtSeconds, 1);
    while (remaining > .000001 && this.phase === 'playing') {
      const step = Math.min(remaining, 1 / 30);
      this._step(step);
      remaining -= step;
    }
  }

  _id() { return this._nextId++; }
  _emit(type, details = {}) { this._events.push({ type, ...details }); }
  _random() {
    this._rng ^= this._rng << 13;
    this._rng ^= this._rng >>> 17;
    this._rng ^= this._rng << 5;
    return (this._rng >>> 0) / 4294967296;
  }

  _prepareWave() {
    const level = this.level;
    const count = 5 + Math.floor((level - 1) * .52) + (this.wave - 1) * 2;
    this._waveTotal = count;
    this._waveResolved = 0;
    this._spawnQueue = [];
    let spawnTime = this.time + (this.wave === 1 ? 3.6 : 1.5);
    const rowOffset = Math.floor(this._random() * ROWS);
    for (let index = 0; index < count; index++) {
      let type = 'bug';
      const roll = this._random();
      if (level >= 4 && roll < .22 + level * .004) type = 'runner';
      if (level >= 7 && roll > .90 - level * .018) type = 'tank';
      if (level >= 9 && roll >= .38 && roll < .50) type = 'shield';
      if (level >= 13 && roll >= .28 && roll < .38) type = 'mender';
      if (this.wave === 1 && index === 0) {
        const introduced = ENEMIES.find(enemy => enemy.unlockLevel === level && enemy.id !== 'boss');
        if (introduced) type = introduced.id;
      }
      if ((level === 10 || level === 15 || level === 20) && this.wave === this.totalWaves && index === count - 1) type = 'boss';
      // The first pass visits every row once; later lanes remain varied and reproducible.
      const row = index < ROWS ? (index + rowOffset) % ROWS : Math.floor(this._random() * ROWS);
      this._spawnQueue.push({ at: spawnTime, type, row });
      spawnTime += Math.max(.85, 2.45 - level * .055 - this.wave * .08) + this._random() * .75;
    }
    this._emit('wave', { wave: this.wave, totalWaves: this.totalWaves, count });
  }

  _spawn(item) {
    const stats = ENEMY_STATS[item.type];
    const scale = 1 + (this.level - 1) * .045;
    const hp = Math.round(stats.hp * scale);
    const enemy = { id: this._id(), type: item.type, name: ENEMIES.find(enemy => enemy.id === item.type).name, row: item.row, x: 8.3, y: item.row + .5,
      hp, maxHp: hp, speed: stats.speed * (1 + (this.level - 1) * .005), damage: stats.damage,
      attackInterval: stats.attackInterval, cooldown: .4, reward: stats.reward, slow: 0, slowFactor: 1, hitFlash: 0,
      poison: 0, poisonDamage: 0, poisonTick: 0, healCooldown: 2, shield: item.type === 'shield', terrainSlow: 1 };
    this.enemies.push(enemy);
    this._emit('spawn', { id: enemy.id, enemyType: enemy.type, row: enemy.row, x: enemy.x, y: enemy.y });
  }

  _step(dt) {
    this.time += dt;
    this.terrainPulse = Math.max(0, this.terrainPulse - dt / 1.4);
    if (this.region === 3) {
      this.nightPulseIn -= dt;
      if (this.nightPulseIn <= 0) {
        this.nightPulseIn += 12;
        this.energy = Math.min(999, this.energy + 35);
        this.terrainPulse = 1;
        this._effect('pulse', 4, 2.5, 1.4, 5);
        this._emit('energy', { amount: 35, source: 'moon', x: 4, y: 2.5 });
      }
    }
    this._energyFraction += dt * 7;
    if (this._energyFraction >= 1) {
      const earned = Math.floor(this._energyFraction);
      this.energy = Math.min(999, this.energy + earned);
      this._energyFraction -= earned;
    }
    for (const effect of this.effects) {
      effect.life -= dt;
      effect.age += dt;
    }
    this.effects = this.effects.filter(effect => effect.life > 0);
    while (this._spawnQueue.length && this._spawnQueue[0].at <= this.time) this._spawn(this._spawnQueue.shift());

    for (const plant of this.plants) {
      if (plant.hp <= 0) continue;
      plant.age += dt;
      plant.cooldown -= dt;
      const definition = DEFINITIONS[plant.type];
      if (plant.type === 'sun') {
        if (plant.cooldown <= 0) {
          plant.cooldown += definition.interval;
          const amount = Math.round(definition.production * plant.boost);
          this.energy = Math.min(999, this.energy + amount);
          this._effect('sun', plant.x, plant.y, .9, .5);
          this._emit('energy', { amount, x: plant.x, y: plant.y, plantId: plant.id });
        }
      } else if (plant.type === 'bomb') {
        if (plant.fuse === null && this.enemies.some(enemy => enemy.hp > 0 && Math.hypot(enemy.x - plant.x, enemy.y - plant.y) <= 1.35)) {
          plant.fuse = .32;
          this._emit('arm', { plantId: plant.id, x: plant.x, y: plant.y });
        }
        if (plant.fuse !== null) {
          plant.fuse -= dt;
          if (plant.fuse <= 0) {
            for (const enemy of this.enemies) {
              if (enemy.hp > 0 && Math.hypot(enemy.x - plant.x, enemy.y - plant.y) <= definition.radius) this._damage(enemy, definition.damage * plant.boost, plant.type);
            }
            plant.hp = 0;
            this._effect('burst', plant.x, plant.y, .8, definition.radius);
            this._emit('explode', { plantId: plant.id, x: plant.x, y: plant.y, radius: definition.radius });
          }
        }
      } else if (plant.cooldown <= 0 && this.enemies.some(enemy => enemy.hp > 0 && enemy.row === plant.row && enemy.x >= plant.x - .25)) {
        plant.cooldown = definition.interval;
        const shot = { id: this._id(), type: plant.type, x: plant.x + .28, y: plant.y, row: plant.row,
          damage: definition.damage * plant.boost, speed: plant.type === 'ice' ? 4.6 : plant.type === 'spore' ? 3.8 : 5.2,
          hitIds: [], pierceRemaining: definition.piercing || 1, poisonDamage: (definition.poisonDamage || 0) * plant.boost };
        this.shots.push(shot);
        this._emit('shot', { id: shot.id, plantId: plant.id, shotType: shot.type, x: shot.x, y: shot.y });
      }
    }

    for (const shot of this.shots) {
      const from = shot.x;
      shot.x += shot.speed * dt;
      const targets = this.enemies.filter(enemy => enemy.hp > 0 && !shot.hitIds.includes(enemy.id) && enemy.row === shot.row && enemy.x + .24 >= from && enemy.x - .24 <= shot.x).sort((a, b) => a.x - b.x).slice(0, shot.pierceRemaining);
      for (const target of targets) {
        if (shot.type === 'spore') {
          for (const enemy of this.enemies) {
            if (enemy.hp <= 0 || Math.hypot(enemy.x - target.x, enemy.y - target.y) > DEFINITIONS.spore.radius) continue;
            this._damage(enemy, shot.damage, 'spore');
            if (enemy.hp > 0) {
              enemy.poisonDamage = enemy.poison > 0 ? Math.max(enemy.poisonDamage, shot.poisonDamage) : shot.poisonDamage;
              enemy.poison = DEFINITIONS.spore.poisonDuration;
            }
          }
          this._effect('poison', target.x, target.y, .65, DEFINITIONS.spore.radius);
        } else this._damage(target, shot.damage, shot.type);
        if (shot.type === 'ice') { target.slow = 3; target.slowFactor = .48; }
        shot.hitIds.push(target.id);
        shot.pierceRemaining--;
        if (shot.pierceRemaining <= 0) shot.x = 10;
        this._effect('spark', target.x, target.y, .2, .22, shot.type);
      }
    }
    this.shots = this.shots.filter(shot => shot.x < 9);

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (enemy.poison > 0) {
        enemy.poison = Math.max(0, enemy.poison - dt);
        enemy.poisonTick += dt;
        if (enemy.poisonTick >= .5) {
          enemy.poisonTick -= .5;
          this._damage(enemy, enemy.poisonDamage * .5, 'poison');
          if (enemy.hp <= 0) continue;
        }
      }
      if (enemy.type === 'mender') {
        enemy.healCooldown -= dt;
        if (enemy.healCooldown <= 0) {
          enemy.healCooldown += 3;
          let healed = false;
          for (const ally of this.enemies) {
            if (ally.id === enemy.id || ally.hp <= 0 || ally.hp >= ally.maxHp || Math.hypot(ally.x - enemy.x, ally.y - enemy.y) > 1.8) continue;
            const amount = Math.min(30, ally.maxHp - ally.hp);
            ally.hp += amount;
            healed = true;
            this._effect('heal', ally.x, ally.y, .65, .45);
            this._emit('heal', { enemyId: enemy.id, targetId: ally.id, amount, x: ally.x, y: ally.y });
          }
          if (healed) this._effect('heal', enemy.x, enemy.y, .6, 1.8);
        }
      }
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.cooldown -= dt;
      enemy.slow = Math.max(0, enemy.slow - dt);
      if (enemy.slow === 0) enemy.slowFactor = 1;
      let blocker = null;
      for (const plant of this.plants) {
        if (plant.hp > 0 && plant.row === enemy.row && plant.x <= enemy.x + .20 && enemy.x - plant.x <= .54 && (!blocker || plant.x > blocker.x)) blocker = plant;
      }
      if (blocker) {
        if (enemy.cooldown <= 0) {
          enemy.cooldown = enemy.attackInterval;
          blocker.hp = Math.max(0, blocker.hp - enemy.damage);
          this._emit('bite', { enemyId: enemy.id, plantId: blocker.id, damage: enemy.damage, x: blocker.x, y: blocker.y });
          this._effect('spark', blocker.x, blocker.y, .15, .18, 'bite');
        }
      } else {
        enemy.terrainSlow = this.snowZones.find(zone => enemy.x >= zone.x && enemy.x <= zone.x + zone.width)?.multiplier || 1;
        enemy.x -= enemy.speed * enemy.slowFactor * enemy.terrainSlow * dt;
      }
      if (enemy.x < -.25) {
        enemy.hp = 0;
        enemy.escaped = true;
        this.lives = Math.max(0, this.lives - 1);
        this._waveResolved++;
        this._effect('breach', .05, enemy.y, .8, .65);
        this._emit('breach', { enemyId: enemy.id, row: enemy.row, lives: this.lives, x: 0, y: enemy.y });
      }
    }
    this.plants = this.plants.filter(plant => {
      if (plant.hp > 0) return true;
      this._emit('plantLost', { plantId: plant.id, plantType: plant.type, row: plant.row, col: plant.col });
      return false;
    });
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
    if (this.lives <= 0) {
      this.phase = 'lost';
      this._emit('lose', { level: this.level, wave: this.wave, score: this.score });
      return;
    }
    if (!this._spawnQueue.length && !this.enemies.length) {
      if (this.wave >= this.totalWaves) {
        this.phase = 'won';
        this._emit('win', { level: this.level, score: this.score, lives: this.lives, time: this.time });
      } else if (this._waveGap === 0) {
        this._waveGap = 4.5;
        this.energy = Math.min(999, this.energy + 45);
        this._emit('waveClear', { wave: this.wave, bonus: 45 });
      } else {
        this._waveGap -= dt;
        if (this._waveGap <= 0) {
          this._waveGap = 0;
          this.wave++;
          this._prepareWave();
        }
      }
    }
  }

  _damage(enemy, amount, source) {
    if (enemy.hp <= 0) return;
    if (enemy.shield && (source === 'pea' || source === 'thorn')) amount *= .35;
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hitFlash = .12;
    this._emit('hit', { enemyId: enemy.id, damage: amount, source, x: enemy.x, y: enemy.y });
    if (enemy.hp === 0) {
      this.kills++;
      this.score += enemy.type === 'boss' ? 500 : enemy.type === 'tank' ? 150 : 100;
      this.energy = Math.min(999, this.energy + enemy.reward);
      this._waveResolved++;
      this._effect('spark', enemy.x, enemy.y, .45, .4, 'kill');
      this._emit('kill', { enemyId: enemy.id, enemyType: enemy.type, reward: enemy.reward, x: enemy.x, y: enemy.y });
    }
  }

  _effect(type, x, y, life, radius, variant = type) {
    this.effects.push({ id: this._id(), type, variant, x, y, life, maxLife: life, age: 0, radius });
  }
}
