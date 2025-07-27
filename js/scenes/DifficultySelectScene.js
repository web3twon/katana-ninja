class DifficultySelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DifficultySelectScene' });
    }
    
    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        this.createBackground();
        
        // Simple responsive font sizes
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 15, 48), 20);
        const buttonSize = Math.max(Math.min(baseSize / 20, 36), 18);
        const descriptionSize = Math.max(Math.min(baseSize / 35, 20), 12);
        
        // Title
        this.title = this.add.text(centerX, centerY - gameHeight * 0.25, 'Choose Difficulty', {
            fontSize: `${Math.round(titleSize)}px`,
            fill: '#f6ff0d',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '700',
            align: 'center',
            stroke: '#101631',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Easy Mode Button
        this.easyButton = this.createModeButton(
            centerX,
            centerY - 60,
            '😊 EASY MODE',
            buttonSize * 1.1,
            '#4ecdc4',
            '#45b7d1'
        );
        
        // Easy Mode Description
        this.easyDesc = this.add.text(centerX, centerY - 10, 'No bombs • Infinite lives • Perfect for kids!', {
            fontSize: `${Math.round(descriptionSize)}px`,
            fill: '#4bbbf0',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '400',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Normal Mode Button  
        this.normalButton = this.createModeButton(
            centerX,
            centerY + 60,
            '⚔️ NORMAL MODE',
            buttonSize * 1.1,
            '#ff6b35',
            '#e55a2b'
        );
        
        // Normal Mode Description
        this.normalDesc = this.add.text(centerX, centerY + 110, 'Classic gameplay • Bombs • Lives system', {
            fontSize: `${Math.round(descriptionSize)}px`,
            fill: '#4bbbf0',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '400',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Setup button interactions
        this.setupButtonInteractions(this.easyButton, 'easy');
        this.setupButtonInteractions(this.normalButton, 'normal');
        
        // Fade in effect
        this.fadeIn();
        
        // Add resize listener and cleanup
        this.scale.on('resize', this.updateForResize, this);
        
        // Clean up on scene shutdown to prevent zombie listeners
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.updateForResize, this);
        });
    }
    
    createBackground() {
        // Keep reference to background graphics for redrawing on resize
        this.backgroundGraphics = this.add.graphics();
        this.drawBackground();
    }
    
    drawBackground() {
        if (!this.backgroundGraphics) return;
        
        // Clear previous background
        this.backgroundGraphics.clear();
        
        const { width, height } = this.cameras.main;
        
        // Same background style as MenuScene
        this.cameras.main.setBackgroundColor('#101631');
        
        // Gradient from Katana dark blue to lighter blue
        this.backgroundGraphics.fillGradientStyle(0x101631, 0x101631, 0x4bbbf0, 0x1a2550, 0.8);
        this.backgroundGraphics.fillRect(0, 0, width, height);
        
        // Add subtle accent dots with Katana yellow
        this.backgroundGraphics.fillStyle(0xf6ff0d, 0.1);
        for (let i = 0; i < 25; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 2);
            this.backgroundGraphics.fillCircle(x, y, size);
        }
        
        // Add blue accent particles
        this.backgroundGraphics.fillStyle(0x4bbbf0, 0.2);
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            this.backgroundGraphics.fillCircle(x, y, size);
        }
    }
    
    createModeButton(x, y, text, fontSize, primaryColor, secondaryColor) {
        // Create button container with rounded background
        const buttonContainer = this.add.container(x, y);
        
        // Calculate button dimensions
        const padding = { x: Math.round(fontSize * 0.8), y: Math.round(fontSize * 0.4) };
        const textWidth = text.length * fontSize * 0.6; // Approximate text width
        const buttonWidth = textWidth + padding.x * 2;
        const buttonHeight = fontSize + padding.y * 2;
        
        // Create gradient background using graphics
        const buttonBg = this.add.graphics();
        
        // Main button background with gradient effect
        buttonBg.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(primaryColor).color,
            Phaser.Display.Color.HexStringToColor(primaryColor).color,
            Phaser.Display.Color.HexStringToColor(secondaryColor).color,
            Phaser.Display.Color.HexStringToColor(secondaryColor).color,
            1
        );
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
        
        // Add subtle border
        buttonBg.lineStyle(2, 0xffffff, 0.3);
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
        
        // Create shadow effect
        const shadowBg = this.add.graphics();
        shadowBg.fillStyle(0x000000, 0.3);
        shadowBg.fillRoundedRect(-buttonWidth/2 + 3, -buttonHeight/2 + 3, buttonWidth, buttonHeight, 12);
        shadowBg.setDepth(-1);
        
        // Create button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${Math.round(fontSize)}px`,
            fill: '#ffffff',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '700',
            stroke: '#101631',
            strokeThickness: 2,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#f6ff0d',
                blur: 6,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Add all elements to container
        buttonContainer.add([shadowBg, buttonBg, buttonText]);
        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive();
        
        // Store references for animations
        buttonContainer.buttonBg = buttonBg;
        buttonContainer.buttonText = buttonText;
        buttonContainer.shadowBg = shadowBg;
        
        return buttonContainer;
    }
    
    setupButtonInteractions(button, difficulty) {
        let buttonClicked = false;
        button.on('pointerdown', () => {
            if (buttonClicked) return;
            buttonClicked = true;
            
            this.sound.play('buttonClick', { volume: 0.5 });
            this.tweens.add({
                targets: button,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Store difficulty preference in game registry (persists until page reload)
                    this.registry.set('gameMode', difficulty);
                    this.transitionToScene('GameScene');
                }
            });
        });
        
        button.on('pointerover', () => {
            this.tweens.add({
                targets: button,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Add glow effect to button background
            this.tweens.add({
                targets: button.shadowBg,
                alpha: 0.5,
                duration: 150
            });
        });
        
        button.on('pointerout', () => {
            this.tweens.add({
                targets: button,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Remove glow effect
            this.tweens.add({
                targets: button.shadowBg,
                alpha: 0.3,
                duration: 150
            });
        });
    }
    
    updateForResize() {
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 15, 48), 20);
        const buttonSize = Math.max(Math.min(baseSize / 20, 36), 18);
        const descriptionSize = Math.max(Math.min(baseSize / 35, 20), 12);
        
        // Update title
        if (this.title) {
            this.title.setPosition(centerX, centerY - gameHeight * 0.25);
            this.title.setFontSize(Math.round(titleSize));
        }
        
        // Update easy button and description
        if (this.easyButton) {
            this.easyButton.setPosition(centerX, centerY - 60);
            if (this.easyButton.buttonText) {
                this.easyButton.buttonText.setFontSize(Math.round(buttonSize * 1.1));
            }
        }
        
        if (this.easyDesc) {
            this.easyDesc.setPosition(centerX, centerY - 10);
            this.easyDesc.setFontSize(Math.round(descriptionSize));
        }
        
        // Update normal button and description
        if (this.normalButton) {
            this.normalButton.setPosition(centerX, centerY + 60);
            if (this.normalButton.buttonText) {
                this.normalButton.buttonText.setFontSize(Math.round(buttonSize * 1.1));
            }
        }
        
        if (this.normalDesc) {
            this.normalDesc.setPosition(centerX, centerY + 110);
            this.normalDesc.setFontSize(Math.round(descriptionSize));
        }
        
        // Redraw background for new dimensions
        this.redrawBackground();
    }
    
    redrawBackground() {
        if (this.backgroundGraphics) {
            this.backgroundGraphics.clear();
            this.drawBackground();
        }
    }
    
    transitionToScene(sceneName) {
        // Create fade out effect
        const fadeOverlay = this.add.rectangle(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 
            0
        ).setDepth(10000);
        
        this.tweens.add({
            targets: fadeOverlay,
            alpha: 1,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.scene.start(sceneName);
            }
        });
    }
    
    fadeIn() {
        // Create fade overlay starting black
        const fadeOverlay = this.add.rectangle(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 
            1
        ).setDepth(10000);
        
        this.tweens.add({
            targets: fadeOverlay,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => {
                fadeOverlay.destroy();
            }
        });
    }
}