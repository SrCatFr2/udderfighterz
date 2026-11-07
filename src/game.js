
export default class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FightScene' });

    this.WIDTH = 960;
    this.HEIGHT = 540;
    this.GROUND_Y = 465;

    // Spritesheet real: 256x256 por frame
    this.SPRITE_SCALE = 0.82;

    this.PLAYER_SPEED = 250;

    this.playerHealth = 100;
    this.enemyHealth = 100;

    this.playerWins = 0;
    this.enemyWins = 0;
    this.round = 1;

    this.playerState = 'idle';
    this.enemyState = 'idle';

    this.playerAttack = null;
    this.enemyAttack = null;

    this.playerAttackCooldown = 0;
    this.enemyAttackCooldown = 0;

    this.playerBlocking = false;
    this.enemyBlocking = false;

    this.touchInput = {};
    this.keys = {};

    this.roundOver = false;
    this.matchOver = false;
  }

  preload() {
    this.load.spritesheet(
      'player',
      '/assets/fighters/player.png',
      {
        frameWidth: 256,
        frameHeight: 256
      }
    );
  }

  create() {
    this.physics.world.setBounds(0, 0, this.WIDTH, this.HEIGHT);
    this.physics.world.gravity.y = 1200;

    this.createArena();
    this.createAnimations();
    this.createFighters();
    this.createHUD();
    this.createKeyboard();
    this.createControls();

    this.startRound();
  }

  createArena() {
    const bg = this.add.graphics();

    bg.fillGradientStyle(
      0x080910,
      0x080910,
      0x171326,
      0x171326,
      1
    );

    bg.fillRect(0, 0, 960, 540);

    const glow = this.add.graphics();

    glow.fillStyle(0x6633aa, 0.12);
    glow.fillEllipse(480, 400, 850, 300);

    glow.fillStyle(0x263c8c, 0.12);
    glow.fillEllipse(200, 350, 350, 200);

    const floor = this.add.graphics();

    floor.fillStyle(0x08090d, 1);
    floor.fillRect(0, this.GROUND_Y, 960, 75);

    floor.lineStyle(2, 0x7d54bd, 0.8);
    floor.lineBetween(0, this.GROUND_Y, 960, this.GROUND_Y);

    floor.lineStyle(1, 0x554078, 0.25);

    for (let x = 0; x < 960; x += 80) {
      floor.lineBetween(
        x,
        this.GROUND_Y,
        x + 30,
        540
      );
    }
  }

  createAnimations() {
    // Frames organizados según las poses del spritesheet recibido.
    const animations = [
      { key: 'idle', frames: [0, 2, 3], rate: 5, repeat: -1 },
      { key: 'walk', frames: [4, 5, 6, 7], rate: 8, repeat: -1 },

      { key: 'jump', frames: [9, 10], rate: 7, repeat: 0 },

      { key: 'light', frames: [12, 13, 14], rate: 12, repeat: 0 },
      { key: 'heavy', frames: [12, 14, 15], rate: 9, repeat: 0 },

      { key: 'hurt', frames: [16], rate: 8, repeat: 0 },

      { key: 'block', frames: [18], rate: 1, repeat: 0 },

      { key: 'crouch', frames: [8, 11], rate: 3, repeat: 0 },

      { key: 'special', frames: [20, 21, 22, 23], rate: 10, repeat: 0 }
    ];

    animations.forEach(anim => {
      this.anims.create({
        key: `player-${anim.key}`,
        frames: anim.frames.map(frame => ({
          key: 'player',
          frame
        })),
        frameRate: anim.rate,
        repeat: anim.repeat
      });
    });
  }

  createFighters() {
    this.player = this.physics.add.sprite(
      260,
      this.GROUND_Y,
      'player',
      0
    );

    this.enemy = this.physics.add.sprite(
      700,
      this.GROUND_Y,
      'player',
      0
    );

    this.configureFighter(this.player);
    this.configureFighter(this.enemy);

    this.player.setFlipX(false);
    this.enemy.setFlipX(true);

    // Rival provisional
    this.enemy.setTint(0xff7777);

    this.player.setDepth(10);
    this.enemy.setDepth(10);

    this.physics.add.collider(
      this.player,
      this.enemy,
      this.preventOverlap,
      null,
      this
    );

    this.player.play('player-idle');
    this.enemy.play('player-idle');
  }

  configureFighter(fighter) {
    fighter.setScale(this.SPRITE_SCALE);
    fighter.setOrigin(0.5, 1);

    fighter.body.setBounce(0);
    fighter.body.setDragX(1000);
    fighter.body.setMaxVelocity(400, 1000);

    // Hitbox independiente del tamaño visual.
    fighter.body.setSize(95, 205);
    fighter.body.setOffset(80, 48);

    fighter.body.setCollideWorldBounds(true);
    fighter.body.setAllowGravity(true);
  }

  preventOverlap(player, enemy) {
    if (!player.body.blocked.down ||
        !enemy.body.blocked.down) {
      return;
    }

    const distance = Math.abs(player.x - enemy.x);

    if (distance < 85) {
      const push = (85 - distance) / 2;

      if (player.x < enemy.x) {
        player.x -= push;
        enemy.x += push;
      } else {
        player.x += push;
        enemy.x -= push;
      }
    }
  }

  createHUD() {
    this.hud = {};

    this.hud.playerBar = this.add.graphics().setDepth(100);
    this.hud.enemyBar = this.add.graphics().setDepth(100);

    this.hud.playerName = this.add.text(
      40, 28, 'PLAYER 01',
      {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setDepth(100);

    this.hud.enemyName = this.add.text(
      920, 28, 'CPU',
      {
        fontFamily: 'Arial',
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0).setDepth(100);

    this.hud.round = this.add.text(
      480, 27, 'ROUND 1',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#d8bdff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(100);

    this.hud.message = this.add.text(
      480, 220, '',
      {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
      }
    ).setOrigin(0.5).setDepth(200);

    this.drawHealth();
  }

  drawHealth() {
    const g1 = this.hud.playerBar;
    const g2 = this.hud.enemyBar;

    g1.clear();
    g2.clear();

    g1.fillStyle(0x292633);
    g1.fillRoundedRect(40, 55, 380, 18, 5);

    g2.fillStyle(0x292633);
    g2.fillRoundedRect(540, 55, 380, 18, 5);

    g1.fillStyle(0x50d9a0);
    g1.fillRoundedRect(
      40, 55,
      380 * this.playerHealth / 100,
      18, 5
    );

    const enemyWidth = 380 * this.enemyHealth / 100;

    g2.fillStyle(0xed5474);
    g2.fillRoundedRect(
      920 - enemyWidth,
      55,
      enemyWidth,
      18,
      5
    );
  }

  createKeyboard() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      crouch: Phaser.Input.Keyboard.KeyCodes.S,
      light: Phaser.Input.Keyboard.KeyCodes.J,
      heavy: Phaser.Input.Keyboard.KeyCodes.K,
      special: Phaser.Input.Keyboard.KeyCodes.L,
      block: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
  }

  createControls() {
    const bindButton = (id, action) => {
      const button = document.getElementById(id);

      if (!button) return;

      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        this.touchInput[action] = true;
      });

      const release = event => {
        event.preventDefault();
        this.touchInput[action] = false;
      };

      button.addEventListener('pointerup', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('pointercancel', release);
    };

    [
      'left',
      'right',
      'jump',
      'crouch',
      'light',
      'heavy',
      'special',
      'block'
    ].forEach(action => bindButton(action, action));
  }

  isDown(action) {
    return Boolean(
      this.keys[action]?.isDown ||
      this.touchInput[action]
    );
  }

  startRound() {
    this.roundOver = false;

    this.playerHealth = 100;
    this.enemyHealth = 100;

    this.playerState = 'idle';
    this.enemyState = 'idle';

    this.playerAttack = null;
    this.enemyAttack = null;

    this.playerBlocking = false;
    this.enemyBlocking = false;

    this.playerAttackCooldown = 0;
    this.enemyAttackCooldown = 0;

    this.player.setPosition(260, this.GROUND_Y);
    this.enemy.setPosition(700, this.GROUND_Y);

    this.player.setVelocity(0, 0);
    this.enemy.setVelocity(0, 0);

    this.player.setFlipX(false);
    this.enemy.setFlipX(true);

    this.player.play('player-idle', true);
    this.enemy.play('player-idle', true);

    this.hud.round.setText(`ROUND ${this.round}`);
    this.hud.message.setText('FIGHT!');

    this.drawHealth();

    this.time.delayedCall(1000, () => {
      this.hud.message.setText('');
    });
  }

  update(time, delta) {
    if (this.matchOver || this.roundOver) return;

    const dt = delta / 1000;

    this.playerAttackCooldown = Math.max(
      0,
      this.playerAttackCooldown - dt
    );

    this.enemyAttackCooldown = Math.max(
      0,
      this.enemyAttackCooldown - dt
    );

    this.updateFacing();
    this.updatePlayer();
    this.updateEnemy();
    this.updateAttacks(dt);
    this.drawHealth();
  }

  updateFacing() {
    if (this.player.x < this.enemy.x) {
      this.player.setFlipX(false);
      this.enemy.setFlipX(true);
    } else {
      this.player.setFlipX(true);
      this.enemy.setFlipX(false);
    }
  }

  updatePlayer() {
    const p = this.player;

    if (
      this.playerState === 'attacking' ||
      this.playerState === 'hurt'
    ) return;

    if (this.isDown('block')) {
      this.playerBlocking = true;
      p.setVelocityX(0);
      this.playerState = 'blocking';
      this.playAnimation(p, 'block');
      return;
    }

    this.playerBlocking = false;

    if (this.isDown('light')) {
      this.attack('player', 'light');
      return;
    }

    if (this.isDown('heavy')) {
      this.attack('player', 'heavy');
      return;
    }

    if (this.isDown('special')) {
      this.attack('player', 'special');
      return;
    }

    if (this.isDown('jump') && p.body.blocked.down) {
      p.setVelocityY(-570);
      this.playerState = 'jumping';
      this.playAnimation(p, 'jump');
      return;
    }

    if (this.isDown('crouch') && p.body.blocked.down) {
      p.setVelocityX(0);
      this.playerState = 'crouching';
      this.playAnimation(p, 'crouch');
      return;
    }

    if (this.isDown('left')) {
      p.setVelocityX(-this.PLAYER_SPEED);
      this.playerState = 'walking';
      this.playAnimation(p, 'walk');
      return;
    }

    if (this.isDown('right')) {
      p.setVelocityX(this.PLAYER_SPEED);
      this.playerState = 'walking';
      this.playAnimation(p, 'walk');
      return;
    }

    p.setVelocityX(0);

    if (!p.body.blocked.down) {
      this.playerState = 'jumping';
      this.playAnimation(p, 'jump');
    } else {
      this.playerState = 'idle';
      this.playAnimation(p, 'idle');
    }
  }

  updateEnemy() {
    const e = this.enemy;

    if (
      this.enemyState === 'attacking' ||
      this.enemyState === 'hurt'
    ) return;

    const distance = Math.abs(e.x - this.player.x);
    const direction = e.x > this.player.x ? -1 : 1;

    if (distance > 145) {
      e.setVelocityX(direction * 155);
      this.enemyState = 'walking';
      this.playAnimation(e, 'walk');
      return;
    }

    e.setVelocityX(0);

    if (Math.random() < 0.012) {
      this.enemyBlocking = true;
      this.enemyState = 'blocking';
      this.playAnimation(e, 'block');
      return;
    }

    this.enemyBlocking = false;

    if (this.enemyAttackCooldown <= 0) {
      this.attack(
        'enemy',
        Math.random() < 0.7 ? 'light' : 'heavy'
      );
      return;
    }

    this.enemyState = 'idle';
    this.playAnimation(e, 'idle');
  }

  playAnimation(fighter, animation) {
    const key = `player-${animation}`;

    if (fighter.anims.currentAnim?.key !== key) {
      fighter.play(key, true);
    }
  }

  attack(side, type) {
    const isPlayer = side === 'player';

    const fighter = isPlayer ? this.player : this.enemy;

    const state = isPlayer
      ? this.playerState
      : this.enemyState;

    const cooldown = isPlayer
      ? this.playerAttackCooldown
      : this.enemyAttackCooldown;

    if (state === 'attacking' || state === 'hurt' || cooldown > 0) {
      return;
    }

    const settings = {
      light: {
        damage: 7,
        duration: 0.36,
        active: 0.12,
        range: 145,
        cooldown: 0.4
      },
      heavy: {
        damage: 15,
        duration: 0.58,
        active: 0.2,
        range: 165,
        cooldown: 0.7
      },
      special: {
        damage: 23,
        duration: 0.8,
        active: 0.28,
        range: 205,
        cooldown: 1.2
      }
    };

    const config = settings[type];

    if (isPlayer) {
      this.playerAttackCooldown = config.cooldown;
      this.playerState = 'attacking';
      this.playerAttack = {
        time: 0,
        hit: false,
        ...config
      };
    } else {
      this.enemyAttackCooldown = config.cooldown;
      this.enemyState = 'attacking';
      this.enemyAttack = {
        time: 0,
        hit: false,
        ...config
      };
    }

    fighter.setVelocityX(0);
    this.playAnimation(fighter, type);
  }

  updateAttacks(dt) {
    this.processAttack('player', dt);
    this.processAttack('enemy', dt);
  }

  processAttack(side, dt) {
    const isPlayer = side === 'player';

    const attack = isPlayer
      ? this.playerAttack
      : this.enemyAttack;

    if (!attack) return;

    attack.time += dt;

    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;

    const targetBlocking = isPlayer
      ? this.enemyBlocking
      : this.playerBlocking;

    const activeStart = attack.duration * 0.25;
    const activeEnd = activeStart + attack.active;

    if (
      attack.time >= activeStart &&
      attack.time <= activeEnd &&
      !attack.hit
    ) {
      const distance = Math.abs(attacker.x - target.x);

      if (distance <= attack.range) {
        attack.hit = true;

        const damage = targetBlocking
          ? Math.max(1, attack.damage * 0.2)
          : attack.damage;

        if (isPlayer) {
          this.enemyHealth = Math.max(0, this.enemyHealth - damage);
        } else {
          this.playerHealth = Math.max(0, this.playerHealth - damage);
        }

        this.hitEffect(target, targetBlocking);

        if (!targetBlocking) {
          this.knockback(attacker, target);
          this.setHurt(isPlayer ? 'enemy' : 'player');
        }

        this.drawHealth();

        if (this.playerHealth <= 0) {
          this.endRound('enemy');
        } else if (this.enemyHealth <= 0) {
          this.endRound('player');
        }
      }
    }

    if (attack.time >= attack.duration) {
      if (isPlayer) {
        this.playerAttack = null;
        this.playerState = 'idle';
      } else {
        this.enemyAttack = null;
        this.enemyState = 'idle';
      }

      if (!this.roundOver) {
        this.playAnimation(attacker, 'idle');
      }
    }
  }

  hitEffect(target, blocked) {
    this.cameras.main.shake(
      70,
      blocked ? 0.002 : 0.005
    );

    const particle = this.add.circle(
      target.x,
      target.y - 120,
      15,
      blocked ? 0x77bbff : 0xffd36a
    ).setDepth(50);

    this.tweens.add({
      targets: particle,
      scale: 2.5,
      alpha: 0,
      duration: 220,
      onComplete: () => particle.destroy()
    });
  }

  knockback(attacker, target) {
    const direction = target.x > attacker.x ? 1 : -1;

    target.setVelocityX(direction * 260);
    target.setVelocityY(-110);
  }

  setHurt(side) {
    const fighter = side === 'player'
      ? this.player
      : this.enemy;

    if (side === 'player') {
      this.playerState = 'hurt';
    } else {
      this.enemyState = 'hurt';
    }

    this.playAnimation(fighter, 'hurt');

    this.time.delayedCall(250, () => {
      if (this.roundOver) return;

      if (side === 'player') {
        this.playerState = 'idle';
      } else {
        this.enemyState = 'idle';
      }

      this.playAnimation(fighter, 'idle');
    });
  }

  endRound(winner) {
    if (this.roundOver) return;

    this.roundOver = true;

    this.player.setVelocity(0, 0);
    this.enemy.setVelocity(0, 0);

    if (winner === 'player') {
      this.playerWins++;
      this.hud.message.setText('YOU WIN!');
    } else {
      this.enemyWins++;
      this.hud.message.setText('YOU LOSE!');
    }

    this.time.delayedCall(2200, () => {
      if (this.playerWins >= 2 || this.enemyWins >= 2) {
        this.finishMatch();
        return;
      }

      this.round++;
      this.startRound();
    });
  }

  finishMatch() {
    this.matchOver = true;

    this.hud.message.setText(
      this.playerWins > this.enemyWins
        ? 'VICTORY!'
        : 'DEFEAT'
    );

    const restart = this.add.text(
      480,
      290,
      'PLAY AGAIN',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#44276d',
        padding: { x: 20, y: 12 }
      }
    ).setOrigin(0.5).setDepth(300).setInteractive();

    restart.on('pointerdown', () => {
      this.playerWins = 0;
      this.enemyWins = 0;
      this.round = 1;
      this.matchOver = false;

      restart.destroy();
      this.startRound();
    });
  }
}
