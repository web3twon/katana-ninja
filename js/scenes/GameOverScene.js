class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.finalScore = data.score || 0;
        this.highScore = data.highScore || 0;
        this.gameStats = data.gameStats || {
            dappsSliced: Math.floor(this.finalScore / 10), // Estimate
            maxCombo: Math.floor(this.finalScore / 50), // Estimate  
            gameTime: 60 // Default estimate
        };
    }
    
    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        this.createBackground();
        
        // Simple responsive font sizes without devicePixelRatio scaling
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 12, 64), 24);
        const scoreSize = Math.max(Math.min(baseSize / 20, 40), 18);
        const highScoreSize = Math.max(Math.min(baseSize / 25, 32), 16);
        const buttonSize = Math.max(Math.min(baseSize / 25, 28), 16);
        
        const gameOverText = this.add.text(centerX, centerY - gameHeight * 0.25, '💀 GAME OVER', {
            fontSize: `${Math.round(titleSize * 1.2)}px`,
            fill: '#f6ff0d',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '900',
            stroke: '#101631',
            strokeThickness: Math.max(4, titleSize / 12),
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Add dramatic text glow effect
        this.tweens.add({
            targets: gameOverText,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        
        // Show current score below title
        this.scoreText = this.add.text(centerX, centerY - gameHeight * 0.15, `🏆 Your Score: ${this.finalScore}`, {
            fontSize: `${Math.round(highScoreSize * 1.1)}px`,
            fill: '#f6ff0d',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '700',
            stroke: '#101631',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 6,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        
        
        // Performance statistics section - moved to bottom
        this.createPerformanceStats(centerX, centerY + gameHeight * 0.1, baseSize);
        
        // Single Play Again button positioned after score
        this.playAgainButton = this.createModernButton(
            centerX, 
            centerY - gameHeight * 0.05, 
            '🔄 PLAY AGAIN', 
            buttonSize,
            '#f6ff0d',
            '#e6e600'
        );
        
        // Modern button interactions with improved animations
        let playAgainClicked = false;
        this.playAgainButton.on('pointerdown', () => {
            if (playAgainClicked) return;
            playAgainClicked = true;
            
            this.sound.play('buttonClick', { volume: 0.5 });
            this.tweens.add({
                targets: this.playAgainButton,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Keep the same game mode when playing again
                    this.transitionToScene('GameScene');
                }
            });
        });
        
        this.playAgainButton.on('pointerover', () => {
            this.tweens.add({
                targets: this.playAgainButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Add glow effect to button background
            this.tweens.add({
                targets: this.playAgainButton.shadowBg,
                alpha: 0.5,
                duration: 150
            });
        });
        
        this.playAgainButton.on('pointerout', () => {
            this.tweens.add({
                targets: this.playAgainButton,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Remove glow effect
            this.tweens.add({
                targets: this.playAgainButton.shadowBg,
                alpha: 0.3,
                duration: 150
            });
        });
        
        // Store UI element references for resize handling
        this.gameOverText = gameOverText;
        
        // Fade in effect when scene starts
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
        
        // Katana game over background
        this.backgroundGraphics.fillGradientStyle(0x101631, 0x101631, 0x1a2550, 0x0c1125, 1);
        this.backgroundGraphics.fillRect(0, 0, width, height);
        
        // Dimmed accent particles
        for (let i = 0; i < 25; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 2);
            
            this.backgroundGraphics.fillStyle(0x4bbbf0, 0.15);
            this.backgroundGraphics.fillCircle(x, y, size);
        }
    }
    
    
    createPerformanceStats(centerX, centerY, baseSize) {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Responsive font sizing with better scaling
        const scoreSize = Math.max(Math.min(baseSize / 25, 28), 16);
        const statsSize = Math.max(Math.min(baseSize / 35, 18), 12);
        
        // Responsive container sizing based on screen dimensions
        const containerWidth = Math.min(gameWidth * 0.85, Math.max(320, gameWidth * 0.6));
        const containerHeight = Math.min(gameHeight * 0.25, Math.max(120, statsSize * 8));
        
        // Responsive positioning - increased gap to prevent overlap with high score text
        const statsY = centerY + gameHeight * 0.08; // Increased gap to prevent overlap
        
        // Create modern stats container with glassmorphism effect
        this.statsContainer = this.add.graphics();
        
        // Background blur effect (simulated with multiple layers)
        this.statsContainer.fillStyle(0x000000, 0.2);
        this.statsContainer.fillRoundedRect(
            centerX - containerWidth/2 + 2, 
            statsY - containerHeight/2 + 2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Main container with glassmorphism effect
        this.statsContainer.fillGradientStyle(0x101631, 0x1a2550, 0x1a2550, 0x101631, 0.85);
        this.statsContainer.fillRoundedRect(
            centerX - containerWidth/2, 
            statsY - containerHeight/2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Subtle inner glow
        this.statsContainer.lineStyle(1, 0xffffff, 0.1);
        this.statsContainer.strokeRoundedRect(
            centerX - containerWidth/2 + 1, 
            statsY - containerHeight/2 + 1, 
            containerWidth - 2, 
            containerHeight - 2, 
            15
        );
        
        // Main border with gradient effect
        this.statsContainer.lineStyle(2, 0x4bbbf0, 0.6);
        this.statsContainer.strokeRoundedRect(
            centerX - containerWidth/2, 
            statsY - containerHeight/2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Calculate responsive spacing
        const verticalSpacing = Math.max(scoreSize * 1.4, 20);
        const horizontalMargin = containerWidth * 0.15;
        
        // High score at the top of stats container
        const highScoreY = statsY - containerHeight/2 + verticalSpacing * 0.6;
        if (this.finalScore >= this.highScore) {
            this.highScoreText = this.add.text(centerX, highScoreY, '🎉 NEW HIGH SCORE! 🎉', {
                fontSize: `${Math.round(statsSize * 1.1)}px`,
                fill: '#f6ff0d',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '700',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: this.highScoreText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.highScoreText = this.add.text(centerX, highScoreY, `🥇 High Score: ${this.highScore}`, {
                fontSize: `${Math.round(statsSize * 1.1)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
        }
        
        // Performance statistics in organized rows
        const statsStartY = highScoreY + verticalSpacing;
        const rowSpacing = Math.max(statsSize * 1.6, 22);
        
        // For smaller screens, use single column layout
        if (gameWidth < 480 || containerWidth < 300) {
            // Single column layout for mobile
            const statsX = centerX;
            
            this.dappsSlicedText = this.add.text(statsX, statsStartY, `🔗 Dapps Sliced: ${this.gameStats.dappsSliced}`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
            
            this.maxComboText = this.add.text(statsX, statsStartY + rowSpacing, `🔥 Max Combo: ${this.gameStats.maxCombo}`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#ff6b35',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
            
            this.gameTimeText = this.add.text(statsX, statsStartY + rowSpacing * 2, `⏰ Time: ${this.gameStats.gameTime}s`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
        } else {
            // Two-column layout for larger screens
            const leftX = centerX - containerWidth/4;
            const rightX = centerX + containerWidth/4;
            
            // Left column
            this.dappsSlicedText = this.add.text(leftX, statsStartY, `🔗 Dapps Sliced: ${this.gameStats.dappsSliced}`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
            
            this.maxComboText = this.add.text(leftX, statsStartY + rowSpacing, `🔥 Max Combo: ${this.gameStats.maxCombo}`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#ff6b35',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
            
            // Right column
            this.gameTimeText = this.add.text(rightX, statsStartY + rowSpacing/2, `⏰ Time: ${this.gameStats.gameTime}s`, {
                fontSize: `${Math.round(statsSize)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5);
        }
    }
    
    createModernButton(x, y, text, fontSize, primaryColor, secondaryColor) {
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
    
    updateForResize() {
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const baseSize = Math.min(gameWidth, gameHeight);
        const titleSize = Math.max(Math.min(baseSize / 12, 64), 24);
        const scoreSize = Math.max(Math.min(baseSize / 20, 40), 18);
        const highScoreSize = Math.max(Math.min(baseSize / 25, 32), 16);
        const buttonSize = Math.max(Math.min(baseSize / 25, 28), 16);
        
        // Update game over text
        if (this.gameOverText) {
            this.gameOverText.setPosition(centerX, centerY - gameHeight * 0.25);
            this.gameOverText.setFontSize(Math.round(titleSize * 1.2));
        }
        
        // Update score text
        if (this.scoreText) {
            this.scoreText.setPosition(centerX, centerY - gameHeight * 0.15);
            this.scoreText.setFontSize(Math.round(highScoreSize * 1.1));
        }
        
        // Update play again button
        if (this.playAgainButton) {
            this.playAgainButton.setPosition(centerX, centerY - gameHeight * 0.05);
            if (this.playAgainButton.buttonText) {
                this.playAgainButton.buttonText.setFontSize(Math.round(buttonSize));
            }
        }
        
        // Redraw background for new dimensions
        this.redrawBackground();
        
        // Update stats container positioning without recreating
        this.updateStatsPosition();
    }
    
    redrawBackground() {
        if (this.backgroundGraphics) {
            this.backgroundGraphics.clear();
            this.drawBackground();
        }
    }
    
    updateStatsPosition() {
        if (!this.statsContainer) return;
        
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const baseSize = Math.min(gameWidth, gameHeight);
        const scoreSize = Math.max(Math.min(baseSize / 20, 40), 18);
        const statsSize = Math.max(Math.min(baseSize / 35, 18), 12);
        
        // Responsive container sizing
        const containerWidth = Math.min(gameWidth * 0.85, Math.max(320, gameWidth * 0.6));
        const containerHeight = Math.min(gameHeight * 0.25, Math.max(120, statsSize * 8));
        const statsY = centerY + gameHeight * 0.08;
        
        // Update stats container position and size
        this.statsContainer.clear();
        
        // Background blur effect (simulated with multiple layers)
        this.statsContainer.fillStyle(0x000000, 0.2);
        this.statsContainer.fillRoundedRect(
            centerX - containerWidth/2 + 2, 
            statsY - containerHeight/2 + 2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Main container with glassmorphism effect
        this.statsContainer.fillGradientStyle(0x101631, 0x1a2550, 0x1a2550, 0x101631, 0.85);
        this.statsContainer.fillRoundedRect(
            centerX - containerWidth/2, 
            statsY - containerHeight/2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Subtle inner glow
        this.statsContainer.lineStyle(1, 0xffffff, 0.1);
        this.statsContainer.strokeRoundedRect(
            centerX - containerWidth/2 + 1, 
            statsY - containerHeight/2 + 1, 
            containerWidth - 2, 
            containerHeight - 2, 
            15
        );
        
        // Main border with gradient effect
        this.statsContainer.lineStyle(2, 0x4bbbf0, 0.6);
        this.statsContainer.strokeRoundedRect(
            centerX - containerWidth/2, 
            statsY - containerHeight/2, 
            containerWidth, 
            containerHeight, 
            16
        );
        
        // Update text positions and sizes
        const verticalSpacing = Math.max(scoreSize * 1.4, 20);
        const highScoreY = statsY - containerHeight/2 + verticalSpacing * 0.6;
        const statsStartY = highScoreY + verticalSpacing;
        const rowSpacing = Math.max(statsSize * 1.6, 22);
        
        // Update high score text
        if (this.highScoreText) {
            this.highScoreText.setPosition(centerX, highScoreY);
            this.highScoreText.setFontSize(Math.round(statsSize * 1.1));
        }
        
        // Update stats text positions based on layout
        if (gameWidth < 480 || containerWidth < 300) {
            // Single column layout for mobile
            const statsX = centerX;
            
            if (this.dappsSlicedText) {
                this.dappsSlicedText.setPosition(statsX, statsStartY);
                this.dappsSlicedText.setFontSize(Math.round(statsSize));
            }
            
            if (this.maxComboText) {
                this.maxComboText.setPosition(statsX, statsStartY + rowSpacing);
                this.maxComboText.setFontSize(Math.round(statsSize));
            }
            
            if (this.gameTimeText) {
                this.gameTimeText.setPosition(statsX, statsStartY + rowSpacing * 2);
                this.gameTimeText.setFontSize(Math.round(statsSize));
            }
        } else {
            // Two-column layout for larger screens
            const leftX = centerX - containerWidth/4;
            const rightX = centerX + containerWidth/4;
            
            if (this.dappsSlicedText) {
                this.dappsSlicedText.setPosition(leftX, statsStartY);
                this.dappsSlicedText.setFontSize(Math.round(statsSize));
            }
            
            if (this.maxComboText) {
                this.maxComboText.setPosition(leftX, statsStartY + rowSpacing);
                this.maxComboText.setFontSize(Math.round(statsSize));
            }
            
            if (this.gameTimeText) {
                this.gameTimeText.setPosition(rightX, statsStartY + rowSpacing/2);
                this.gameTimeText.setFontSize(Math.round(statsSize));
            }
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