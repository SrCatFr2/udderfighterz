import Phaser from 'phaser';
import './style.css';
import { FightScene } from './game.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,

  parent: 'game',

  width: 960,
  height: 540,

  backgroundColor: '#10131d',

  pixelArt: true,
  antialias: false,

  physics: {
    default: 'arcade',

    arcade: {
      gravity: {
        y: 1100
      },

      debug: false
    }
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  scene: [FightScene]
});

window.addEventListener('contextmenu', event => {
  event.preventDefault();
});
