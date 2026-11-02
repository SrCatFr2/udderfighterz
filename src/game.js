
import Phaser from 'phaser';

export class FightScene extends Phaser.Scene {
  constructor() {
    super('FightScene');

    this.maxHealth = 100;

    this.playerHealth = 100;
    this.cpuHealth = 100;

    this.playerWins = 0;
    this.cpuWins = 0;

    this.round = 1;
    this.roundTime = 99;

    this.finished = false;

    this.playerCooldown = 0;
    this.cpuCooldown = 0;

    this.playerStun = 0;
    this.cpuStun = 0;

    this.playerActionUntil = 0;

    this.touch = {};
    this.cpuBlocking = false;
    this.playerBlocking = false;
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
    this.createArena();
    this.createFighterTextures();
    this.createAnimations();

    this.createPlayer();
    this.createCPU();

    this.physics.add.collider(
      this.player,
      this.ground
    );

    this.physics.add.collider(
      this.cpu,
      this.ground
    );

    this.physics.world.setBounds(
      35,
      0,
      890,
      480
    );

    this.keys = this.input.keyboard.addKeys({
      left: 'A',
      right: 'D',
      jump: 'W',
      crouch: 'S',
      light: 'J',
      heavy: 'K',
      block: 'I',
      special: 'L'
    });

    this.createHUD();
    this.createTouchControls();

    this.clockEvent = this.time.addEvent({
      delay: 1000,
      loop: true,

      callback: () => {
        if (this.finished) return;

        this.roundTime--;

        if (this.roundTime <= 0) {
          const winner =
            this.playerHealth >= this.cpuHealth
              ? 'player'
              : 'cpu';

          this.finishRound(winner);
        }

        this.updateHUD();
      }
    });

    this.showMessage('ROUND 1');
  }

  // ---------------------------------
  // ARENA
  // ---------------------------------

  createArena() {
    const g = this.add.graphics();

    // Background
    g.fillGradientStyle(
      0x171b2b,
      0x171b2b,
      0x29233a,
      0x29233a,
      1
    );

    g.fillRect(0, 0, 960, 540);

    // Background lights
    g.fillStyle(0x7771a0, 0.08);

    g.fillCircle(180, 220, 180);
    g.fillCircle(770, 180, 200);

    // Buildings
    g.fillStyle(0x25283a);

    for (let i = 0; i < 10; i++) {
      const x = i * 105;

      g.fillRect(x, 300, 45, 160);

      g.fillStyle(0x37344d, 0.5);
      g.fillRect(x + 8, 315, 5, 120);

      g.fillStyle(0x25283a);
    }

    // Arena lights
    g.fillStyle(0xb6f36b, 0.5);

    g.fillRect(100, 290, 30, 3);
    g.fillRect(830, 290, 30, 3);

    // Floor
    g.fillStyle(0x11131d);

    g.fillRect(0, 460, 960, 80);

    g.fillStyle(0xb6f36b, 0.65);

    g.fillRect(0, 460, 960, 3);

    // Floor details
    g.lineStyle(1, 0x38364d, 0.7);

    for (let x = 0; x < 960; x += 60) {
      g.lineBetween(
        x,
        465,
        x - 35,
        540
      );
    }

    // Physics floor
    this.ground = this.add.rectangle(
      480,
      480,
      960,
      40,
      0x000000,
      0
    );

    this.physics.add.existing(
      this.ground,
      true
    );
  }

  // ---------------------------------
  // FIGHTER TEXTURES
  // ---------------------------------

  createFighterTextures() {
    const createTexture = (
      key,
      main,
      dark,
      skin
    ) => {
      if (this.textures.exists(key)) return;

      const g = this.make.graphics({
        x: 0,
        y: 0,
        add: false
      });

      // Legs
      g.fillStyle(dark);

      g.fillRect(12, 57, 10, 19);
      g.fillRect(27, 57, 10, 19);

      // Boots
      g.fillStyle(0x17151e);

      g.fillRect(8, 72, 15, 7);
      g.fillRect(27, 72, 15, 7);

      // Arms
      g.fillStyle(main);

      g.fillRect(5, 25, 10, 29);
      g.fillRect(34, 25, 10, 29);

      // Gloves
      g.fillStyle(skin);

      g.fillRect(3, 48, 13, 11);
      g.fillRect(32, 48, 13, 11);

      // Torso
      g.fillStyle(main);

      g.fillRect(12, 21, 25, 39);

      // Torso shadow
      g.fillStyle(dark);

      g.fillRect(30, 24, 7, 32);

      // Head
      g.fillStyle(skin);

      g.fillRect(15, 2, 20, 19);

      // Hair
      g.fillStyle(dark);

      g.fillRect(13, 0, 24, 7);
      g.fillRect(13, 5, 4, 8);

      // Eye
      g.fillStyle(0xffffff);

      g.fillRect(29, 11, 4, 4);

      g.generateTexture(key, 48, 82);

      g.destroy();
    };

    createTexture(
      'fighter_red',
      0xe66a6a,
      0x853333,
      0xeab18d
    );
  }

  // ---------------------------------
  // ANIMATIONS
  // ---------------------------------

  createAnimations() {
    const animations = [
      {
        key: 'idle',
        frames: [0, 1, 2, 3],
        frameRate: 5,
        repeat: -1
      },

      {
        key: 'walk',
        frames: [4, 5, 6, 7],
        frameRate: 9,
        repeat: -1
      },

      {
        key: 'jump',
        frames: [8, 9],
        frameRate: 7,
        repeat: 0
      },

      {
        key: 'hurt',
        frames: [10],
        frameRate: 1,
        repeat: 0
      },

      {
        key: 'block',
        frames: [11],
        frameRate: 1,
        repeat: 0
      },

      {
        key: 'light',
        frames: [12, 13, 14],
        frameRate: 12,
        repeat: 0
      },

      {
        key: 'crouch',
        frames: [15],
        frameRate: 1,
        repeat: 0
      },

      {
        key: 'heavy',
        frames: [17, 18],
        frameRate: 8,
        repeat: 0
      },

      {
        key: 'special',
        frames: [19],
        frameRate: 1,
        repeat: 0
      }
    ];

    for (const animation of animations) {
      this.anims.create({
        key: animation.key,

        frames: this.anims.generateFrameNumbers(
          'player',
          {
            frames: animation.frames
          }
        ),

        frameRate: animation.frameRate,
        repeat: animation.repeat
      });
    }
  }

  // ---------------------------------
  // PLAYER
  // ---------------------------------

  createPlayer() {
    this.player = this.physics.add.sprite(
      260,
      460,
      'player',
      0
    );

    this.player.setOrigin(0.5, 1);

    this.player.setScale(0.7);

    this.player.setBodySize(
      55,
      145
    );

    this.player.setOffset(
      100,
      85
    );

    this.player.setCollideWorldBounds(true);

    this.player.setDepth(5);

    this.player.play('idle');
  }

  // ---------------------------------
  // CPU
  // ---------------------------------

  createCPU() {
    this.cpu = this.physics.add.sprite(
      700,
      460,
      'fighter_red'
    );

    this.cpu.setOrigin(0.5, 1);

    this.cpu.setBodySize(
      30,
      72
    );

    this.cpu.setOffset(
      9,
      10
    );

    this.cpu.setCollideWorldBounds(true);

    this.cpu.setDepth(5);

    this.cpu.setFlipX(true);
  }

  // ---------------------------------
  // HUD
  // ---------------------------------

  createHUD() {
    this.hud = this.add.graphics()
      .setDepth(20);

    this.add.text(
      30,
      18,
      'PLAYER 01',
      {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff'
      }
    ).setDepth(21);

    this.add.text(
      795,
      18,
      'CPU',
      {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff'
      }
    ).setDepth(21);

    this.timerText = this.add.text(
      480,
      18,
      '99',
      {
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#b6f36b'
      }
    )
      .setOrigin(0.5, 0)
      .setDepth(21);

    this.roundText = this.add.text(
      480,
      57,
      'ROUND 1',
      {
        fontSize: '12px',
        color: '#d5d3e5',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(21);

    this.scoreText = this.add.text(
      480,
      80,
      '0 - 0',
      {
        fontSize: '11px',
        color: '#9999aa'
      }
    )
      .setOrigin(0.5)
      .setDepth(21);

    this.message = this.add.text(
      480,
      205,
      '',
      {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#11111a',
        strokeThickness: 7
      }
    )
      .setOrigin(0.5)
      .setDepth(30);

    this.updateHUD();
  }

  updateHUD() {
    if (!this.hud) return;

    this.hud.clear();

    // Backgrounds
    this.hud.fillStyle(0x292a38);

    this.hud.fillRect(
      30,
      43,
      390,
      17
    );

    this.hud.fillRect(
      540,
      43,
      390,
      17
    );

    // Player health
    this.hud.fillStyle(0xb6f36b);

    this.hud.fillRect(
      30,
      43,
      390 * Math.max(0, this.playerHealth) / 100,
      17
    );

    // CPU health
    this.hud.fillStyle(0xef6969);

    this.hud.fillRect(
      540,
      43,
      390 * Math.max(0, this.cpuHealth) / 100,
      17
    );

    // Borders
    this.hud.lineStyle(
      2,
      0xffffff,
      0.3
    );

    this.hud.strokeRect(
      30,
      43,
      390,
      17
    );

    this.hud.strokeRect(
      540,
      43,
      390,
      17
    );

    this.timerText.setText(
      String(
        Math.max(0, this.roundTime)
      ).padStart(2, '0')
    );

    this.scoreText.setText(
      `${this.playerWins} - ${this.cpuWins}`
    );
  }

  // ---------------------------------
  // TOUCH CONTROLS
  // ---------------------------------

  createTouchControls() {
    const buttons = document.querySelectorAll(
      '[data-control]'
    );

    buttons.forEach(button => {
      const action = button.dataset.control;

      button.onpointerdown = event => {
        event.preventDefault();

        this.touch[action] = true;
      };

      const release = event => {
        event.preventDefault();

        this.touch[action] = false;
      };

      button.onpointerup = release;

      button.onpointercancel = release;

      button.onlostpointercapture = release;
    });
  }

  // ---------------------------------
  // EFFECTS
  // ---------------------------------

  showMessage(text) {
    this.message.setText(text);

    this.message.setAlpha(1);

    this.tweens.add({
      targets: this.message,

      alpha: 0,

      delay: 900,

      duration: 500
    });
  }

  showAttackEffect(fighter, color) {
    const direction = fighter.flipX
      ? -1
      : 1;

    const effect = this.add.rectangle(
      fighter.x + direction * 38,
      fighter.y - 45,
      27,
      5,
      color
    ).setDepth(10);

    this.tweens.add({
      targets: effect,

      alpha: 0,

      scaleX: 2,

      duration: 130,

      onComplete: () => {
        effect.destroy();
      }
    });
  }

  // ---------------------------------
  // COMBAT
  // ---------------------------------

  attack(
    attacker,
    target,
    damage,
    range,
    isPlayer
  ) {
    if (this.finished) return;

    const distance = Math.abs(
      target.x - attacker.x
    );

    if (distance > range) return;

    const blocking = isPlayer
      ? this.cpuBlocking
      : this.playerBlocking;

    const finalDamage = blocking
      ? Math.ceil(damage * 0.25)
      : damage;

    if (isPlayer) {
      this.cpuHealth = Math.max(
        0,
        this.cpuHealth - finalDamage
      );

      this.cpuStun = blocking ? 70 : 150;

    } else {
      this.playerHealth = Math.max(
        0,
        this.playerHealth - finalDamage
      );

      this.playerStun = blocking ? 70 : 150;
    }

    const direction = target.x > attacker.x
      ? 1
      : -1;

    target.setVelocityX(
      direction * (blocking ? 70 : 190)
    );

    target.setVelocityY(
      blocking ? -35 : -100
    );

    this.cameras.main.shake(
      75,
      0.003
    );

    this.updateHUD();

    const effect = this.add.rectangle(
      (attacker.x + target.x) / 2,
      target.y - 48,
      20,
      20,
      blocking ? 0x79a9ff : 0xffe68a
    ).setDepth(15);

    this.tweens.add({
      targets: effect,

      scale: 2.5,

      alpha: 0,

      duration: 180,

      onComplete: () => {
        effect.destroy();
      }
    });

    if (this.playerHealth <= 0) {
      this.finishRound('cpu');

    } else if (this.cpuHealth <= 0) {
      this.finishRound('player');
    }
  }

  playerAttack(
    damage,
    range,
    cooldown
  ) {
    if (
      this.playerCooldown > 0 ||
      this.playerStun > 0
    ) {
      return;
    }

    this.playerCooldown = cooldown;

    const animation =
      damage >= 20
        ? 'special'
        : damage >= 13
          ? 'heavy'
          : 'light';

    this.playerActionUntil =
      this.time.now + cooldown * 0.65;

    this.player.play(
      animation,
      true
    );

    this.attack(
      this.player,
      this.cpu,
      damage,
      range,
      true
    );

    this.showAttackEffect(
      this.player,
      0xb6f36b
    );
  }

  // ---------------------------------
  // ROUND SYSTEM
  // ---------------------------------

  finishRound(winner) {
    if (this.finished) return;

    this.finished = true;

    this.player.setVelocity(0, 0);

    this.cpu.setVelocity(0, 0);

    if (winner === 'player') {
      this.playerWins++;

      this.showMessage('ROUND WON');

    } else {
      this.cpuWins++;

      this.showMessage('ROUND LOST');
    }

    this.roundText.setText(
      `ROUND ${this.round}`
    );

    this.updateHUD();

    this.time.delayedCall(
      2200,
      () => {
        if (
          this.playerWins >= 2 ||
          this.cpuWins >= 2
        ) {
          this.showMessage(
            this.playerWins >= 2
              ? 'YOU WIN!'
              : 'CPU WINS!'
          );

          this.time.delayedCall(
            2500,
            () => {
              this.scene.restart();
            }
          );

          return;
        }

        this.round++;

        this.playerHealth = 100;

        this.cpuHealth = 100;

        this.roundTime = 99;

        this.player.setPosition(
          260,
          460
        );

        this.cpu.setPosition(
          700,
          460
        );

        this.player.setVelocity(0, 0);

        this.cpu.setVelocity(0, 0);

        this.player.setFlipX(false);

        this.cpu.setFlipX(true);

        this.playerStun = 0;

        this.cpuStun = 0;

        this.playerCooldown = 0;

        this.cpuCooldown = 0;

        this.playerActionUntil = 0;

        this.finished = false;

        this.player.play('idle');

        this.roundText.setText(
          `ROUND ${this.round}`
        );

        this.updateHUD();

        this.showMessage(
          `ROUND ${this.round}`
        );
      }
    );
  }

  // ---------------------------------
  // PLAYER ANIMATION
  // ---------------------------------

  updatePlayerAnimation() {
    const player = this.player;

    if (!player || this.playerStun > 0) {
      return;
    }

    if (
      this.time.now <
      this.playerActionUntil
    ) {
      return;
    }

    if (this.playerBlocking) {
      player.play(
        'block',
        true
      );

      return;
    }

    if (
      this.keys.crouch.isDown ||
      this.touch.crouch
    ) {
      player.play(
        'crouch',
        true
      );

      return;
    }

    if (
      !player.body.blocked.down &&
      !player.body.touching.down
    ) {
      player.play(
        'jump',
        true
      );

      return;
    }

    if (
      Math.abs(
        player.body.velocity.x
      ) > 10
    ) {
      player.play(
        'walk',
        true
      );

      return;
    }

    player.play(
      'idle',
      true
    );
  }

  // ---------------------------------
  // MAIN UPDATE
  // ---------------------------------

  update(time, delta) {
    if (
      !this.player ||
      !this.cpu ||
      this.finished
    ) {
      return;
    }

    // Cooldowns
    this.playerCooldown = Math.max(
      0,
      this.playerCooldown - delta
    );

    this.cpuCooldown = Math.max(
      0,
      this.cpuCooldown - delta
    );

    this.playerStun = Math.max(
      0,
      this.playerStun - delta
    );

    this.cpuStun = Math.max(
      0,
      this.cpuStun - delta
    );

    // Blocking
    this.playerBlocking =
      this.keys.block.isDown ||
      !!this.touch.block;

    // Facing
    this.player.setFlipX(
      this.cpu.x < this.player.x
    );

    this.cpu.setFlipX(
      this.player.x < this.cpu.x
    );

    // ---------------------------------
    // PLAYER MOVEMENT
    // ---------------------------------

    if (this.playerStun <= 0) {
      let direction = 0;

      if (
        this.keys.left.isDown ||
        this.touch.left
      ) {
        direction--;
      }

      if (
        this.keys.right.isDown ||
        this.touch.right
      ) {
        direction++;
      }

      if (
        this.playerBlocking ||
        this.keys.crouch.isDown ||
        this.touch.crouch
      ) {
        direction = 0;
      }

      this.player.setVelocityX(
        direction * 250
      );

      // Jump
      if (
        (
          Phaser.Input.Keyboard.JustDown(
            this.keys.jump
          ) ||
          this.touch.jump
        ) &&
        (
          this.player.body.blocked.down ||
          this.player.body.touching.down
        )
      ) {
        this.player.setVelocityY(-510);

        this.touch.jump = false;
      }

      // Light attack
      if (
        Phaser.Input.Keyboard.JustDown(
          this.keys.light
        ) ||
        this.touch.light
      ) {
        this.playerAttack(
          7,
          100,
          330
        );

        this.touch.light = false;
      }

      // Heavy attack
      if (
        Phaser.Input.Keyboard.JustDown(
          this.keys.heavy
        ) ||
        this.touch.heavy
      ) {
        this.playerAttack(
          13,
          115,
          650
        );

        this.touch.heavy = false;
      }

      // Special attack
      if (
        Phaser.Input.Keyboard.JustDown(
          this.keys.special
        ) ||
        this.touch.special
      ) {
        this.playerAttack(
          20,
          145,
          1200
        );

        this.touch.special = false;
      }

    } else {
      this.player.setVelocityX(0);
    }

    // ---------------------------------
    // CPU AI
    // ---------------------------------

    if (this.cpuStun <= 0) {
      const distance = Math.abs(
        this.player.x - this.cpu.x
      );

      if (distance > 95) {
        this.cpu.setVelocityX(
          this.player.x > this.cpu.x
            ? 125
            : -125
        );

      } else {
        this.cpu.setVelocityX(0);

        if (this.cpuCooldown <= 0) {
          this.cpuCooldown = 1150;

          this.cpuBlocking =
            Math.random() < 0.2;

          if (!this.cpuBlocking) {
            this.attack(
              this.cpu,
              this.player,
              8,
              105,
              false
            );
          }

          this.time.delayedCall(
            350,
            () => {
              this.cpuBlocking = false;
            }
          );
        }
      }

    } else {
      this.cpu.setVelocityX(0);
    }

    // ---------------------------------
    // FIGHTER SEPARATION
    // ---------------------------------

    if (
      Math.abs(
        this.player.x - this.cpu.x
      ) < 32 &&
      Math.abs(
        this.player.y - this.cpu.y
      ) < 65
    ) {
      const push =
        this.player.x < this.cpu.x
          ? -1
          : 1;

      this.player.x += push * 0.5;

      this.cpu.x -= push * 0.5;
    }

    this.updatePlayerAnimation();

    this.updateHUD();
  }
}
