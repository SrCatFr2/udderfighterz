
export default class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FightScene' });

    this.GROUND_Y = 465;
    this.PLAYER_SCALE = 0.55;
    this.PLAYER_SPEED = 260;

    this.player = null;
    this.enemy = null;

    this.playerHealth = 100;
    this.enemyHealth = 100;

    this.round = 1;
    this.maxRounds = 3;

    this.playerState = 'idle';
    this.enemyState = 'idle';

    this.playerAttackCooldown = 0;
    this.enemyAttackCooldown = 0;

    this.playerBlocking = false;
    this.enemyBlocking = false;

    this.keys = {};
    this.touchInput = {};

    this.playerAttack = null;
    this.enemyAttack = null;

    this.roundOver = false;
    this.matchOver = false;

    this.playerWins = 0;
    this.enemyWins = 0;

    this.hud = {};
  }

  preload() {
    this.load.spritesheet(
      'player',
      '/assets/fighters/player.png',
      {
        frameWidth: 384,
        frameHeight: 512
      }
    );
  }

  create() {
    this.physics.world.setBounds(0, 0, 960, 540);

    this.createArena();
    this.createAnimations();
    this.createFighters();
    this.createHUD();
    this.createControls();
    this.createKeyboard();

    this.physics.world.gravity.y = 1200;

    this.startRound();
  }

  createArena() {
    const bg = this.add.graphics();

    bg.fillGradientStyle(
      0x090a13,
      0x090a13,
      0x171326,
      0x171326,
      1
    );

    bg.fillRect(0, 0, 960, 540);

    // Luces del escenario
    const glow = this.add.graphics();

    glow.fillStyle(0x6633aa, 0.10);
    glow.fillEllipse(480, 400, 800, 300);

    glow.fillStyle(0x263c8c, 0.12);
    glow.fillEllipse(200, 350, 350, 200);

    // Suelo
    const floor = this.add.graphics();

    floor.fillStyle(0x08090d, 1);
    floor.fillRect(0, this.GROUND_Y, 960, 75);

    floor.lineStyle(2, 0x7d54bd, 0.8);
    floor.lineBetween(0, this.GROUND_Y, 960, this.GROUND_Y);

    // Líneas decorativas
    floor.lineStyle(1, 0x554078, 0.25);

    for (let x = 0; x < 960; x += 80) {
      floor.lineBetween(x, this.GROUND_Y, x + 30, 540);
    }

    // Iluminación ambiental
    this.add.rectangle(
      480,
      this.GROUND_Y + 4,
      960,
      2,
      0x9c68ff,
      0.35
    );
  }

  create
