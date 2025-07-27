class KatanaNinja {
    constructor() {
        const gameSize = this.calculateGameSize();
        
        this.config = {
            type: Phaser.AUTO,
            width: gameSize.width,
            height: gameSize.height,
            parent: 'game-container',
            backgroundColor: '#101631',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            },
            scene: [MenuScene, DifficultySelectScene, GameScene, GameOverScene],
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.NO_CENTER,
                width: gameSize.width,
                height: gameSize.height
            },
            render: {
                antialias: true,
                pixelArt: false,
                transparent: false,
                powerPreference: 'high-performance'
            },
            input: {
                touch: {
                    capture: false
                }
            }
        };
    }
    
    calculateGameSize() {
        // Use full viewport dimensions
        return {
            width: Math.max(window.innerWidth, 320),
            height: Math.max(window.innerHeight, 240)
        };
    }
    
    init() {
        this.game = new Phaser.Game(this.config);
        this.setupResizeHandler();
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.game.scale.resize(window.innerWidth, window.innerHeight);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.game.scale.resize(window.innerWidth, window.innerHeight);
            }, 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new KatanaNinja();
    game.init();
});