class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    preload() {
        // Add error handlers for failed image loads
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load:', file.key);
        });
        
        this.load.on('complete', () => {
            this.createFallbackTextures();
        });
        
        // Load title image
        this.load.image('katanaTitle', 'assets/images/katanatitle.png');
        
        // Load fruit image assets
        this.load.image('fruit_0', 'assets/images/fruit_0.png');
        this.load.image('fruit_1', 'assets/images/fruit_1.png');
        this.load.image('fruit_2', 'assets/images/fruit_2.png');
        this.load.image('fruit_3', 'assets/images/fruit_3.png');
        this.load.image('fruit_4', 'assets/images/fruit_4.png');
        this.load.image('fruit_5', 'assets/images/fruit_5.png');
        this.load.image('fruit', 'assets/images/fruit.png');
        this.load.image('fruit_6', 'assets/images/fruit_6.png');
        
        // Load audio assets
        this.load.audio('slice_1', 'assets/audio/slice_fruit_1.mp3');
        this.load.audio('slice_2', 'assets/audio/slice_fruit_2.mp3');
        this.load.audio('slice_3', 'assets/audio/slice_fruit_3.mp3');
        this.load.audio('bgMusic', 'assets/audio/background_music.mp3');
        this.load.audio('buttonClick', 'assets/audio/button-click.mp3');
        this.load.audio('bombExplosion', 'assets/audio/bomb_explosion.mp3');
        this.load.audio('metalScrape', 'assets/audio/metalscrape.mp3');
        
        // Still create bomb texture since no bomb image was provided
        this.createBombTexture();
    }
    
    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Prepare background music but don't start it yet (to avoid autoplay warnings)
        if (!this.sound.get('bgMusic')) {
            this.backgroundMusic = this.sound.add('bgMusic', { 
                loop: true, 
                volume: 0.3 
            });
            // Music will start when user first interacts with a button
        }
        
        this.createBackground();
        
        // Simple responsive font sizes without devicePixelRatio scaling
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 12, 64), 24);
        const subtitleSize = Math.max(Math.min(baseSize / 25, 28), 16);
        const buttonSize = Math.max(Math.min(baseSize / 18, 40), 20);
        const instructionSize = Math.max(Math.min(baseSize / 30, 22), 14);
        const footerSize = Math.max(Math.min(baseSize / 35, 18), 12);
        
        // Custom title image with responsive scaling and effects
        const title = this.add.image(centerX, centerY - gameHeight * 0.2, 'katanaTitle');
        
        // Calculate responsive scale based on screen size
        const titleTargetWidth = Math.min(gameWidth * 0.8, Math.max(300, titleSize * 8));
        const titleScale = titleTargetWidth / title.width;
        title.setScale(titleScale);
        title.setOrigin(0.5);
        
        // Create multiple layered effects for dynamic appearance
        
        // Outer glow layer (large, soft)
        const outerGlow = this.add.image(centerX, centerY - gameHeight * 0.2, 'katanaTitle');
        outerGlow.setScale(titleScale * 1.3);
        outerGlow.setOrigin(0.5);
        outerGlow.setTint(0x4bbbf0);
        outerGlow.setAlpha(0.15);
        outerGlow.setDepth(title.depth - 3);
        
        // Middle glow layer (medium, more visible)
        const middleGlow = this.add.image(centerX, centerY - gameHeight * 0.2, 'katanaTitle');
        middleGlow.setScale(titleScale * 1.15);
        middleGlow.setOrigin(0.5);
        middleGlow.setTint(0x4bbbf0);
        middleGlow.setAlpha(0.3);
        middleGlow.setDepth(title.depth - 2);
        
        // Inner glow layer (subtle, close to title)
        const innerGlow = this.add.image(centerX, centerY - gameHeight * 0.2, 'katanaTitle');
        innerGlow.setScale(titleScale * 1.05);
        innerGlow.setOrigin(0.5);
        innerGlow.setTint(0x4bbbf0);
        innerGlow.setAlpha(0.4);
        innerGlow.setDepth(title.depth - 1);
        
        // Dramatic shadow effect
        const titleShadow = this.add.image(centerX + 6, centerY - gameHeight * 0.2 + 6, 'katanaTitle');
        titleShadow.setScale(titleScale);
        titleShadow.setOrigin(0.5);
        titleShadow.setTint(0x000000);
        titleShadow.setAlpha(0.7);
        titleShadow.setDepth(title.depth - 4);
        
        // Dynamic layered animations for epic effect
        
        // Main title gentle breathing
        this.tweens.add({
            targets: title,
            scaleX: titleScale * 1.02,
            scaleY: titleScale * 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Inner glow pulsing
        this.tweens.add({
            targets: innerGlow,
            alpha: 0.6,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Middle glow slower pulse
        this.tweens.add({
            targets: middleGlow,
            alpha: 0.5,
            scaleX: titleScale * 1.2,
            scaleY: titleScale * 1.2,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Outer glow very slow, large pulse
        this.tweens.add({
            targets: outerGlow,
            alpha: 0.25,
            scaleX: titleScale * 1.4,
            scaleY: titleScale * 1.4,
            duration: 5000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store references for potential resizing
        this.titleImage = title;
        this.titleShadow = titleShadow;
        this.titleInnerGlow = innerGlow;
        this.titleMiddleGlow = middleGlow;
        this.titleOuterGlow = outerGlow;
        
        // Subtitle with enhanced styling
        this.subtitle = this.add.text(centerX, centerY - gameHeight * 0.1, 'Slice the dapps, avoid the bombs! 💣', {
            fontSize: `${Math.round(subtitleSize * 1.1)}px`,
            fill: '#4bbbf0',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '500',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Modern gradient play button
        this.playButton = this.createModernButton(
            centerX, 
            centerY + gameHeight * 0.05, 
            '🎮 PLAY NOW', 
            buttonSize * 1.2,
            '#f6ff0d',
            '#e6e600'
        );
        
        // Modern button interactions with enhanced animations
        let playButtonClicked = false;
        this.playButton.on('pointerdown', () => {
            if (playButtonClicked) return;
            playButtonClicked = true;
            
            // Start background music on first user interaction
            if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
                this.backgroundMusic.play();
            }
            
            this.sound.play('buttonClick', { volume: 0.5 });
            this.tweens.add({
                targets: this.playButton,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.transitionToScene('DifficultySelectScene');
                }
            });
        });
        
        this.playButton.on('pointerover', () => {
            this.tweens.add({
                targets: this.playButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Add glow effect to button background
            this.tweens.add({
                targets: this.playButton.shadowBg,
                alpha: 0.5,
                duration: 150
            });
        });
        
        this.playButton.on('pointerout', () => {
            this.tweens.add({
                targets: this.playButton,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Remove glow effect
            this.tweens.add({
                targets: this.playButton.shadowBg,
                alpha: 0.3,
                duration: 150
            });
        });
        
        // Instructions with better styling
        this.instructions = this.add.text(centerX, centerY + gameHeight * 0.2, '🖱️ Use mouse or 👆 touch to slice', {
            fontSize: `${Math.round(instructionSize)}px`,
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
        
        
        // Fade in effect when scene starts
        this.fadeIn();
        
        // Add resize listener for responsive title scaling
        this.scale.on('resize', this.updateTitleForResize, this);
        
        // Clean up on scene shutdown to prevent zombie listeners
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.updateTitleForResize, this);
        });
    }
    
    updateTitleForResize() {
        if (!this.titleImage) return;
        
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 12, 64), 24);
        
        // Recalculate responsive scale
        const titleTargetWidth = Math.min(gameWidth * 0.8, Math.max(300, titleSize * 8));
        const titleScale = titleTargetWidth / this.titleImage.texture.source[0].width;
        
        // Update main title
        this.titleImage.setPosition(centerX, centerY - gameHeight * 0.2);
        this.titleImage.setScale(titleScale);
        
        // Update shadow
        if (this.titleShadow) {
            this.titleShadow.setPosition(centerX + 6, centerY - gameHeight * 0.2 + 6);
            this.titleShadow.setScale(titleScale);
        }
        
        // Update glow layers
        if (this.titleInnerGlow) {
            this.titleInnerGlow.setPosition(centerX, centerY - gameHeight * 0.2);
            this.titleInnerGlow.setScale(titleScale * 1.05);
        }
        
        if (this.titleMiddleGlow) {
            this.titleMiddleGlow.setPosition(centerX, centerY - gameHeight * 0.2);
            this.titleMiddleGlow.setScale(titleScale * 1.15);
        }
        
        if (this.titleOuterGlow) {
            this.titleOuterGlow.setPosition(centerX, centerY - gameHeight * 0.2);
            this.titleOuterGlow.setScale(titleScale * 1.3);
        }
        
        // Update other UI elements
        this.updateUIElementsForResize();
        
        // Redraw background for new dimensions
        this.redrawBackground();
    }
    
    updateUIElementsForResize() {
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const baseSize = Math.min(gameWidth, gameHeight);
        const subtitleSize = Math.max(Math.min(baseSize / 25, 28), 16);
        const buttonSize = Math.max(Math.min(baseSize / 18, 40), 20);
        const instructionSize = Math.max(Math.min(baseSize / 30, 22), 14);
        
        // Update subtitle
        if (this.subtitle) {
            this.subtitle.setPosition(centerX, centerY - gameHeight * 0.1);
            this.subtitle.setFontSize(Math.round(subtitleSize * 1.1));
        }
        
        // Update play button
        if (this.playButton) {
            this.playButton.setPosition(centerX, centerY + gameHeight * 0.05);
            // Update button text size if needed
            if (this.playButton.buttonText) {
                this.playButton.buttonText.setFontSize(Math.round(buttonSize));
            }
        }
        
        // Update instructions
        if (this.instructions) {
            this.instructions.setPosition(centerX, centerY + gameHeight * 0.2);
            this.instructions.setFontSize(Math.round(instructionSize));
        }
    }
    
    redrawBackground() {
        if (this.backgroundGraphics) {
            this.backgroundGraphics.clear();
            this.drawBackground();
        }
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
        
        // Katana-inspired gradient background
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
    
    
    createFallbackTextures() {
        const fruitKeys = ['fruit_0', 'fruit_1', 'fruit_2', 'fruit_3', 'fruit_4', 'fruit_5', 'fruit', 'fruit_6'];
        const fruitColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xf39c12, 0xdda0dd, 0xff9ff3];
        
        fruitKeys.forEach((key, index) => {
            if (!this.textures.exists(key)) {
                console.log(`Creating fallback texture for ${key}`);
                const graphics = this.add.graphics();
                graphics.fillStyle(fruitColors[index] || 0xff6b6b);
                graphics.fillCircle(30, 30, 28);  // Larger circle for 60px texture
                graphics.generateTexture(key, 60, 60);  // Match target size
                graphics.destroy();
            }
        });
    }
    
    createBombTexture() {
        const graphics = this.add.graphics();
        
        // Scale everything up for 60px texture
        graphics.fillStyle(0x2c2c54);
        graphics.fillCircle(30, 30, 27);  // Scaled from 20,20,18
        
        graphics.lineStyle(3, 0x40407a);  // Scaled from 2
        graphics.strokeCircle(30, 30, 27);
        
        graphics.fillStyle(0xff3838);
        graphics.fillRect(27, 3, 6, 15);  // Scaled from 18,2,4,10
        
        graphics.fillStyle(0xffaa00);
        graphics.fillCircle(27, 12, 4.5);  // Scaled from 18,8,3
        graphics.fillCircle(33, 9, 3);     // Scaled from 22,6,2
        graphics.fillCircle(30, 6, 3);     // Scaled from 20,4,2
        
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(22, 22, 6);    // Scaled from 15,15,4
        
        graphics.generateTexture('bomb', 60, 60);  // Match target size
        graphics.destroy();
    }
    
    createModernButton(x, y, text, fontSize, primaryColor, secondaryColor) {
        // Create button container with rounded background
        const buttonContainer = this.add.container(x, y);
        
        // Calculate button dimensions
        const padding = { x: Math.round(fontSize * 0.8), y: Math.round(fontSize * 0.4) };
        const textWidth = text.length * fontSize * 0.6; // Approximate text width
        const buttonWidth = textWidth + padding.x * 2;
        const buttonHeight = fontSize + padding.y * 2;
        
        // Create gradient background using graphics with enhanced smoothing
        const buttonBg = this.add.graphics();
        
        // Enable smooth line rendering for mobile
        buttonBg.lineStyle(0);
        buttonBg.fillStyle(0x000000, 0); // Start with transparent
        
        // Main button background with gradient effect
        buttonBg.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(primaryColor).color,
            Phaser.Display.Color.HexStringToColor(primaryColor).color,
            Phaser.Display.Color.HexStringToColor(secondaryColor).color,
            Phaser.Display.Color.HexStringToColor(secondaryColor).color,
            1
        );
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
        
        // Add subtle border with anti-aliasing
        buttonBg.lineStyle(1.5, 0xffffff, 0.4); // Slightly thinner for smoother mobile rendering
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
        
        // Create shadow effect with smooth rendering
        const shadowBg = this.add.graphics();
        shadowBg.lineStyle(0);
        shadowBg.fillStyle(0x000000, 0.25); // Slightly more transparent for softer shadow
        shadowBg.fillRoundedRect(-buttonWidth/2 + 2, -buttonHeight/2 + 2, buttonWidth, buttonHeight, 12);
        shadowBg.setDepth(-1);
        
        // Create button text with bright yellow glow
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
                blur: 8,
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
        buttonContainer.originalScale = 1;
        
        return buttonContainer;
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