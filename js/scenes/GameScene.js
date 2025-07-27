class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init() {
        this.score = 0;
        this.gameMode = this.registry.get('gameMode') || 'normal';
        this.lives = this.gameMode === 'easy' ? Infinity : 3;
        this.combo = 0;
        this.gameRunning = true;
        
        this.spawnRate = 1000;
        this.difficultyTimer = 0;
        
        // Game statistics tracking
        this.gameStats = {
            dappsSliced: 0,
            maxCombo: 0,
            gameStartTime: Date.now(),
            gameTime: 0
        };
        
        this.fruits = null;
        this.bombs = null;
        this.sliceTrail = [];
        
        // Initialize color extractor for fruit particles
        this.colorExtractor = new ColorExtractor();
        
        // Initialize trajectory calculator for viewport-aware spawning
        this.trajectoryCalculator = null; // Will be initialized in create()
        
        // Combo display management
        this.comboResetTimer = null;
        this.currentSliceHitFruit = false; // Track if current slice gesture hit any fruits
        this.gestureComboCount = 0; // Track combo count for current gesture only
    }
    
    create() {
        this.createBackground();
        this.inputManager = new InputManager(this);
        
        // Initialize trajectory calculator with current viewport dimensions
        this.trajectoryCalculator = new TrajectoryCalculator(
            this.cameras.main.width, 
            this.cameras.main.height, 
            this.physics.world.gravity.y
        );
        
        this.setupGroups();
        this.setupUI();
        this.setupEvents();
        this.setupTimers();
        this.setupResizeListener();
        
        this.createSliceGraphics();
        
        // Create guardrails after everything else is set up
        this.time.delayedCall(100, () => {
            this.createGuardrails();
        });
        
        // Fade in effect when scene starts
        this.fadeIn();
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
        
        // Katana-inspired game background
        this.backgroundGraphics.fillGradientStyle(0x101631, 0x101631, 0x1a2550, 0x4bbbf0, 0.6);
        this.backgroundGraphics.fillRect(0, 0, width, height);
        
        // Subtle Katana accent particles
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 2);
            
            this.backgroundGraphics.fillStyle(0xf6ff0d, 0.08);
            this.backgroundGraphics.fillCircle(x, y, size);
        }
        
        // Blue accent dots
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            
            this.backgroundGraphics.fillStyle(0x4bbbf0, 0.12);
            this.backgroundGraphics.fillCircle(x, y, size);
        }
    }
    
    redrawBackground() {
        // Redraw background when screen resizes
        this.drawBackground();
    }
    
    setupGroups() {
        this.fruits = this.physics.add.group();
        this.bombs = this.physics.add.group();
    }
    
    createGuardrails() {
        try {
            // Safety check - only create if scene is active and groups exist
            if (!this.scene.isActive() || !this.fruits || !this.bombs) {
                return;
            }
            
            const { width: gameWidth, height: gameHeight } = this.cameras.main;
            
            // Create simple invisible sprites for guardrails
            const leftWall = this.physics.add.sprite(-30, gameHeight / 2, null);
            leftWall.setVisible(false);
            leftWall.body.setImmovable(true);
            leftWall.body.setSize(60, gameHeight * 2);
            
            const rightWall = this.physics.add.sprite(gameWidth + 30, gameHeight / 2, null);
            rightWall.setVisible(false);
            rightWall.body.setImmovable(true);
            rightWall.body.setSize(60, gameHeight * 2);
            
            // Set up collisions to bounce items back into play area
            this.physics.add.collider(this.fruits, leftWall, this.bounceOffGuardrail, null, this);
            this.physics.add.collider(this.fruits, rightWall, this.bounceOffGuardrail, null, this);
            this.physics.add.collider(this.bombs, leftWall, this.bounceOffGuardrail, null, this);
            this.physics.add.collider(this.bombs, rightWall, this.bounceOffGuardrail, null, this);
            
            // Store references for resize updates
            this.leftWall = leftWall;
            this.rightWall = rightWall;
        } catch (error) {
            console.warn('Guardrail creation failed, continuing without guardrails:', error);
            // Disable guardrails if creation fails
            this.leftWall = null;
            this.rightWall = null;
        }
    }
    
    bounceOffGuardrail(item, guardrail) {
        // Reverse horizontal velocity to bounce back into play area
        const currentVelocity = item.body.velocity;
        item.setVelocityX(-currentVelocity.x * 0.8); // Reduce velocity slightly for realistic bounce
        
        // Add slight randomness to prevent repetitive bouncing
        const randomBoost = Phaser.Math.Between(-50, 50);
        item.setVelocityY(currentVelocity.y + randomBoost);
    }
    
    updateGuardrails() {
        try {
            if (!this.leftWall || !this.rightWall || !this.leftWall.body || !this.rightWall.body) return;
            
            const { width: gameWidth, height: gameHeight } = this.cameras.main;
            
            // Update left guardrail position and size
            this.leftWall.setPosition(-30, gameHeight / 2);
            this.leftWall.body.setSize(60, gameHeight * 2);
            
            // Update right guardrail position and size
            this.rightWall.setPosition(gameWidth + 30, gameHeight / 2);
            this.rightWall.body.setSize(60, gameHeight * 2);
        } catch (error) {
            console.warn('Guardrail update failed:', error);
        }
    }
    
    setupUI() {
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        
        // Simple responsive font sizes without devicePixelRatio scaling
        const baseSize = Math.min(gameWidth, gameHeight);
        const scoreFontSize = Math.max(Math.min(baseSize / 25, 32), 16);
        const livesFontSize = Math.max(Math.min(baseSize / 30, 28), 14);
        const comboFontSize = Math.max(Math.min(baseSize / 25, 32), 16);
        
        // Calculate safe positioning with margins
        const margin = Math.max(gameWidth * 0.03, 20);
        const topMargin = Math.max(gameHeight * 0.05, 30);
        const padding = Math.max(baseSize * 0.02, 12);
        
        // Create HUD container backgrounds for better readability
        this.createHUDContainers(margin, topMargin, padding, scoreFontSize, livesFontSize, comboFontSize);
        
        this.scoreText = this.add.text(margin + padding, topMargin + padding, '🏆 Score: 0', {
            fontSize: `${Math.round(scoreFontSize)}px`,
            fill: '#f6ff0d',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '700',
            stroke: '#101631',
            strokeThickness: Math.max(2, scoreFontSize / 12),
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: false,
                fill: true
            }
        }).setDepth(11);
        
        // Create individual heart sprites for better animation control (only in normal mode)
        if (this.gameMode === 'normal') {
            this.createAnimatedHearts(margin + padding + livesFontSize * 3.5, topMargin + scoreFontSize + padding * 2 + 10, livesFontSize);
        }
        
        // Only show lives UI in normal mode
        if (this.gameMode === 'normal') {
            this.livesText = this.add.text(margin + padding, topMargin + scoreFontSize + padding * 2 + 10, 'Lives:', {
                fontSize: `${Math.round(livesFontSize)}px`,
                fill: '#4bbbf0',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '600',
                stroke: '#101631',
                strokeThickness: Math.max(2, livesFontSize / 12),
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: false,
                    fill: true
                }
            }).setDepth(11);
        }
        
        this.comboText = this.add.text(gameWidth - margin - padding, topMargin + padding, '', {
            fontSize: `${Math.round(comboFontSize)}px`,
            fill: '#f6ff0d',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '800',
            stroke: '#101631',
            strokeThickness: Math.max(2, comboFontSize / 12),
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: false,
                fill: true
            }
        }).setOrigin(1, 0).setDepth(11);
    }
    
    createHUDContainers(margin, topMargin, padding, scoreFontSize, livesFontSize, comboFontSize) {
        const { width: gameWidth } = this.cameras.main;
        
        // Left HUD container (Score and Lives) with responsive width for mobile compatibility
        // Calculate based on actual text content rather than arbitrary multipliers
        const scoreTextWidth = this.scoreText ? this.scoreText.width : scoreFontSize * 10;
        const livesTextWidth = this.gameMode === 'normal' && this.livesText ? this.livesText.width + livesFontSize * 4 : 0; // Hearts width
        const contentWidth = Math.max(scoreTextWidth, livesTextWidth);
        const paddingMultiplier = 1.5; // 50% padding around content
        const leftContainerWidth = Math.min(contentWidth * paddingMultiplier, gameWidth * 0.4);
        const leftContainerHeight = scoreFontSize + livesFontSize + padding * 3 + 10;
        
        this.leftHUDContainer = this.add.graphics();
        
        // Background blur effect (simulated with shadow)
        this.leftHUDContainer.fillStyle(0x000000, 0.2);
        this.leftHUDContainer.fillRoundedRect(margin + 2, topMargin + 2, leftContainerWidth, leftContainerHeight, 12);
        
        // Main container with glassmorphism
        this.leftHUDContainer.fillGradientStyle(0x101631, 0x1a2550, 0x1a2550, 0x101631, 0.85);
        this.leftHUDContainer.fillRoundedRect(margin, topMargin, leftContainerWidth, leftContainerHeight, 12);
        
        // Inner glow
        this.leftHUDContainer.lineStyle(1, 0xffffff, 0.1);
        this.leftHUDContainer.strokeRoundedRect(margin + 1, topMargin + 1, leftContainerWidth - 2, leftContainerHeight - 2, 11);
        
        // Main border
        this.leftHUDContainer.lineStyle(2, 0xf6ff0d, 0.6);
        this.leftHUDContainer.strokeRoundedRect(margin, topMargin, leftContainerWidth, leftContainerHeight, 12);
        this.leftHUDContainer.setDepth(10);
        
        // Store container dimensions for updates
        this.hudContainerDimensions = {
            left: { x: margin, y: topMargin, width: leftContainerWidth, height: leftContainerHeight },
            padding: padding
        };
    }
    
    createAnimatedHearts(x, y, fontSize) {
        this.heartSprites = [];
        
        for (let i = 0; i < 3; i++) {
            // Create heart using text for emoji support
            const heart = this.add.text(x + i * (fontSize + 5), y, '❤️', {
                fontSize: `${Math.round(fontSize)}px`,
                fill: '#ff4757'
            }).setDepth(11);
            
            this.heartSprites.push(heart);
            
            // Add subtle pulsing animation
            this.tweens.add({
                targets: heart,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 1000 + i * 200, // Stagger the animations
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    updateUIForResize() {
        // Update UI elements positioning and sizing when screen resizes
        if (!this.scoreText || !this.comboText) return;
        
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const baseSize = Math.min(gameWidth, gameHeight);
        const scoreFontSize = Math.max(Math.min(baseSize / 25, 32), 16);
        const livesFontSize = Math.max(Math.min(baseSize / 30, 28), 14);
        const comboFontSize = Math.max(Math.min(baseSize / 25, 32), 16);
        
        const margin = Math.max(gameWidth * 0.03, 20);
        const topMargin = Math.max(gameHeight * 0.05, 30);
        const padding = Math.max(baseSize * 0.02, 12);
        
        // Update HUD containers
        if (this.leftHUDContainer) {
            this.leftHUDContainer.clear();
            // Calculate based on actual text content
            const scoreTextWidth = this.scoreText ? this.scoreText.width : scoreFontSize * 10;
            const livesTextWidth = this.gameMode === 'normal' && this.livesText ? this.livesText.width + livesFontSize * 4 : 0;
            const contentWidth = Math.max(scoreTextWidth, livesTextWidth);
            const paddingMultiplier = 1.5;
            const leftContainerWidth = Math.min(contentWidth * paddingMultiplier, gameWidth * 0.4);
            const leftContainerHeight = scoreFontSize + livesFontSize + padding * 3 + 10;
            
            // Background blur effect (simulated with shadow)
            this.leftHUDContainer.fillStyle(0x000000, 0.2);
            this.leftHUDContainer.fillRoundedRect(margin + 2, topMargin + 2, leftContainerWidth, leftContainerHeight, 12);
            
            // Main container with glassmorphism
            this.leftHUDContainer.fillGradientStyle(0x101631, 0x1a2550, 0x1a2550, 0x101631, 0.85);
            this.leftHUDContainer.fillRoundedRect(margin, topMargin, leftContainerWidth, leftContainerHeight, 12);
            
            // Inner glow
            this.leftHUDContainer.lineStyle(1, 0xffffff, 0.1);
            this.leftHUDContainer.strokeRoundedRect(margin + 1, topMargin + 1, leftContainerWidth - 2, leftContainerHeight - 2, 11);
            
            // Main border
            this.leftHUDContainer.lineStyle(2, 0xf6ff0d, 0.6);
            this.leftHUDContainer.strokeRoundedRect(margin, topMargin, leftContainerWidth, leftContainerHeight, 12);
        }
        
        // Update font sizes and positions
        this.scoreText.setFontSize(scoreFontSize);
        this.scoreText.setStroke('#101631', Math.max(2, scoreFontSize / 12));
        this.scoreText.setPosition(margin + padding, topMargin + padding);
        
        if (this.livesText && this.gameMode === 'normal') {
            this.livesText.setFontSize(livesFontSize);
            this.livesText.setStroke('#101631', Math.max(2, livesFontSize / 12));
            this.livesText.setPosition(margin + padding, topMargin + scoreFontSize + padding * 2 + 10);
        }
        
        // Update heart positions (only in normal mode)
        if (this.heartSprites && this.gameMode === 'normal') {
            this.heartSprites.forEach((heart, i) => {
                heart.setPosition(margin + padding + livesFontSize * 3.5 + i * (livesFontSize + 5), topMargin + scoreFontSize + padding * 2 + 10);
                heart.setFontSize(livesFontSize);
            });
        }
        
        this.comboText.setFontSize(comboFontSize);
        this.comboText.setStroke('#101631', Math.max(2, comboFontSize / 12));
        this.comboText.setPosition(gameWidth - margin - padding, topMargin + padding);
        
        // Update trajectory calculator dimensions
        if (this.trajectoryCalculator) {
            this.trajectoryCalculator.updateDimensions(gameWidth, gameHeight);
        }
    }
    
    setupEvents() {
        this.events.on('sliceMove', this.onSliceMove, this);
        this.events.on('sliceEnd', this.onSliceEnd, this);
    }
    
    setupResizeListener() {
        // Listen to Phaser's scale manager resize events
        this.scale.on('resize', this.onResize, this);
        
        // Clean up on scene shutdown
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.onResize, this);
        });
    }
    
    onResize() {
        // Update UI layout and background when scale changes
        this.updateUIForResize();
        this.redrawBackground();
        
        // Update guardrail positions for new screen size
        this.updateGuardrails();
        
        // Update trajectory calculator dimensions
        if (this.trajectoryCalculator) {
            this.trajectoryCalculator.updateDimensions(
                this.cameras.main.width, 
                this.cameras.main.height
            );
        }
        
        // Ensure combo text positioning is also updated
        if (this.comboText) {
            const { width: gameWidth } = this.cameras.main;
            const baseSize = Math.min(gameWidth, this.cameras.main.height);
            const margin = Math.max(gameWidth * 0.03, 20);
            const topMargin = Math.max(this.cameras.main.height * 0.05, 30);
            const padding = Math.max(baseSize * 0.02, 12);
            
            this.comboText.setPosition(gameWidth - margin - padding, topMargin + padding);
        }
    }
    
    setupTimers() {
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnRate,
            callback: this.spawnFruit,
            callbackScope: this,
            loop: true
        });
        
        this.difficultyTimer = this.time.addEvent({
            delay: 10000,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });
    }
    
    createSliceGraphics() {
        this.sliceGraphics = this.add.graphics();
    }
    
    spawnFruit() {
        if (!this.gameRunning) return;
        
        const isBomb = this.gameMode === 'easy' ? false : Math.random() < 0.15;
        // Spawn from safe area that guarantees staying within bounds
        const spawnMargin = this.cameras.main.width * 0.1; // 10% margin from each side for tighter control
        const x = Phaser.Math.Between(spawnMargin, this.cameras.main.width - spawnMargin);
        const y = this.cameras.main.height + 50;
        
        let item;
        const targetSize = 60; // Increased from 40 for better visibility
        
        if (isBomb) {
            item = this.physics.add.sprite(x, y, 'bomb');
            item.setData('type', 'bomb');
            item.setData('sliced', false);
            this.bombs.add(item);
            
            // Bomb texture is now 60px, no scaling needed
            // item.setScale(1);
        } else {
            const fruitType = Phaser.Math.Between(0, 6);
            item = this.physics.add.sprite(x, y, `fruit_${fruitType}`);
            item.setData('type', 'fruit');
            item.setData('sliced', false);
            item.setData('fruitType', fruitType);
            this.fruits.add(item);
            
            // Scale fruit down to match bomb size (60px)
            const scaleX = targetSize / item.width;
            const scaleY = targetSize / item.height;
            item.setScale(Math.min(scaleX, scaleY)); // Scale down to match bomb
        }
        
        // Calculate smart trajectory instead of random velocity
        const trajectory = this.calculateSmartTrajectory(x, y);
        item.setVelocity(trajectory.x, trajectory.y);
        item.setInteractive();
        
        // Check regularly if fruit has fallen off the bottom
        const fallCheckTimer = this.time.addEvent({
            delay: 100, // Check every 100ms
            callback: () => {
                if (item.active && item.y > this.cameras.main.height + 50) {
                    // Fruit has fallen off the bottom
                    if (item.getData('type') === 'fruit') {
                        // Show red X where the fruit would hit the bottom
                        this.showMissedFruitIndicator(item.x, this.cameras.main.height - 30);
                        // Only lose life in normal mode
                        if (this.gameMode === 'normal') {
                            this.loseLife();
                        }
                    }
                    item.destroy();
                    fallCheckTimer.remove();
                }
            },
            loop: true
        });
        
        // Store timer reference on item for cleanup
        item.setData('fallCheckTimer', fallCheckTimer);
        
        // Fallback cleanup after 6 seconds
        this.time.delayedCall(6000, () => {
            if (item.active) {
                const timer = item.getData('fallCheckTimer');
                if (timer) timer.remove();
                item.destroy();
            }
        });
    }
    
    /**
     * Calculate smart trajectory for spawned items
     * Ensures fruits follow viewport-aware arcs like in real Fruit Ninja
     */
    calculateSmartTrajectory(startX, startY) {
        if (!this.trajectoryCalculator) {
            // Fallback with guaranteed upward force
            return {
                x: Phaser.Math.Between(-150, 150),
                y: Phaser.Math.Between(-900, -700)  // Strong upward velocity
            };
        }
        
        // Choose trajectory type for variety (like real Fruit Ninja)
        const trajectoryType = this.chooseTrajectoryType();
        
        let trajectory;
        switch (trajectoryType) {
            case 'cross-screen':
                trajectory = this.trajectoryCalculator.getCrossScreenTrajectory(startX, startY);
                break;
            case 'straight-up':
                trajectory = this.trajectoryCalculator.getStraightUpTrajectory(startX, startY);
                break;
            default:
                trajectory = this.trajectoryCalculator.calculateTrajectory(startX, startY);
        }
        
        // CRITICAL: Validate trajectory and ensure no low angles
        if (!this.trajectoryCalculator.validateTrajectory(startX, startY, trajectory) || trajectory.y > -400) {
            // Force a guaranteed good straight-up trajectory for bad/low angles
            trajectory = this.trajectoryCalculator.getStraightUpTrajectory(startX, startY);
            
            // Double-check and force minimum upward velocity if still bad
            if (trajectory.y > -400) {
                trajectory = {
                    x: Phaser.Math.Between(-100, 100),
                    y: Phaser.Math.Between(-900, -700) // Guaranteed strong upward force
                };
            }
        }
        
        return trajectory;
    }
    
    /**
     * Choose trajectory type for gameplay variety
     * Mimics the varied fruit patterns from real Fruit Ninja
     */
    chooseTrajectoryType() {
        const random = Math.random();
        
        // Weighted probabilities for different trajectory types
        if (random < 0.6) {
            return 'normal';        // 60% - Standard arcing trajectories
        } else if (random < 0.85) {
            return 'cross-screen';  // 25% - Dramatic cross-screen arcs
        } else {
            return 'straight-up';   // 15% - Easy straight-up targets
        }
    }
    
    onSliceMove(sliceData) {
        this.drawSliceTrail(sliceData.from, sliceData.to);
        this.checkSliceCollision(sliceData.from, sliceData.to);
    }
    
    onSliceEnd() {
        this.clearSliceTrail();
        
        // End of gesture - finalize combo logic
        if (this.gestureComboCount > 1) {
            // Had a combo in this gesture, keep display visible for satisfaction
            this.combo = this.gestureComboCount; // Set final combo value for display
            this.updateComboText();
            this.scheduleComboDisplayReset();
        } else {
            // No combo or single hit, clear immediately
            this.combo = 0;
            this.updateComboText();
        }
        
        // Reset gesture tracking for next gesture
        this.currentSliceHitFruit = false;
        this.gestureComboCount = 0;
    }
    
    drawSliceTrail(from, to) {
        this.sliceTrail.push({ from, to, time: this.time.now, id: Math.random() });
        
        this.sliceGraphics.clear();
        
        // Keep trails visible longer for better visual impact
        this.sliceTrail = this.sliceTrail.filter(trail => 
            this.time.now - trail.time < 500
        );
        
        this.sliceTrail.forEach((trail, index) => {
            const age = this.time.now - trail.time;
            const alpha = 1 - (age / 500);
            const baseWidth = 12; // Increased base width
            const width = baseWidth * alpha;
            
            // Calculate velocity-based width (faster slices = wider trails)
            const distance = Phaser.Math.Distance.Between(
                trail.from.x, trail.from.y, trail.to.x, trail.to.y
            );
            const velocityMultiplier = Math.min(distance / 50, 2); // Cap at 2x
            const dynamicWidth = width * (0.5 + velocityMultiplier * 0.5);
            
            // Multi-layer gradient trail effect
            // Outer glow (energy aura)
            this.sliceGraphics.lineStyle(dynamicWidth + 8, 0xf6ff0d, alpha * 0.3);
            this.sliceGraphics.lineBetween(
                trail.from.x, trail.from.y,
                trail.to.x, trail.to.y
            );
            
            // Middle layer (katana steel)
            this.sliceGraphics.lineStyle(dynamicWidth + 4, 0x4bbbf0, alpha * 0.6);
            this.sliceGraphics.lineBetween(
                trail.from.x, trail.from.y,
                trail.to.x, trail.to.y
            );
            
            // Inner core (bright edge)
            this.sliceGraphics.lineStyle(dynamicWidth, 0xffffff, alpha * 0.9);
            this.sliceGraphics.lineBetween(
                trail.from.x, trail.from.y,
                trail.to.x, trail.to.y
            );
            
            // Sharp center line (cutting edge)
            this.sliceGraphics.lineStyle(Math.max(2, dynamicWidth * 0.3), 0xffffff, alpha);
            this.sliceGraphics.lineBetween(
                trail.from.x, trail.from.y,
                trail.to.x, trail.to.y
            );
        });
    }
    
    clearSliceTrail() {
        this.sliceTrail = [];
        this.sliceGraphics.clear();
    }
    
    checkSliceCollision(from, to) {
        const allItems = [...this.fruits.getChildren(), ...this.bombs.getChildren()];
        
        allItems.forEach(item => {
            if (!item.active || item.getData('sliced')) return;
            
            const bounds = item.getBounds();
            if (this.lineIntersectsRect(from, to, bounds)) {
                item.setData('sliced', true);
                
                // Calculate slice direction for realistic particle effects
                const sliceDirection = {
                    x: to.x - from.x,
                    y: to.y - from.y
                };
                const length = Math.sqrt(sliceDirection.x * sliceDirection.x + sliceDirection.y * sliceDirection.y);
                if (length > 0) {
                    sliceDirection.x /= length;
                    sliceDirection.y /= length;
                }
                
                item.setData('sliceDirection', sliceDirection);
                this.sliceItem(item);
            }
        });
    }
    
    lineIntersectsRect(lineStart, lineEnd, rect) {
        const { x: x1, y: y1 } = lineStart;
        const { x: x2, y: y2 } = lineEnd;
        const { x: rx, y: ry, width: rw, height: rh } = rect;
        
        const left = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        const right = this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        const top = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        const bottom = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
        
        return left || right || top || bottom;
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return false;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    sliceItem(item) {
        if (!item || !item.active) return;
        
        const type = item.getData('type');
        
        // Clean up fall check timer since item is being sliced
        const fallCheckTimer = item.getData('fallCheckTimer');
        if (fallCheckTimer) {
            fallCheckTimer.remove();
        }
        
        if (type === 'fruit') {
            this.sliceFruit(item);
        } else if (type === 'bomb') {
            this.sliceBomb(item);
        } else {
            console.warn('Unknown item type sliced:', type);
            return;
        }
        
        item.destroy();
    }
    
    sliceFruit(fruit) {
        // Mark that this slice gesture hit a fruit
        this.currentSliceHitFruit = true;
        
        // Cancel any pending display reset since we're in an active gesture
        this.cancelComboReset();
        
        // Increment gesture combo count
        this.gestureComboCount++;
        
        // Update display combo and calculate points based on gesture combo
        this.combo = this.gestureComboCount;
        const points = 10 * this.combo;
        this.score += points;
        
        // Update game statistics
        this.gameStats.dappsSliced++;
        if (this.combo > this.gameStats.maxCombo) {
            this.gameStats.maxCombo = this.combo;
        }
        
        this.updateScore();
        this.updateComboText();
        
        // Create floating score popup
        this.createFloatingScorePopup(fruit.x, fruit.y, points, this.combo);
        
        // Add impact screen shake based on combo
        this.addImpactShake(this.combo);
        
        // Play random slice sound effect
        const sliceSounds = ['slice_1', 'slice_2', 'slice_3'];
        const randomSlice = sliceSounds[Math.floor(Math.random() * sliceSounds.length)];
        this.sound.play(randomSlice, { volume: 0.7 });
        
        // Get fruit type and slice direction for realistic particles
        const fruitType = fruit.getData('fruitType');
        const textureKey = `fruit_${fruitType}`;
        const sliceDirection = fruit.getData('sliceDirection') || { x: 1, y: 0 };
        
        this.createFruitParticles(fruit.x, fruit.y, textureKey, sliceDirection);
        
        this.tweens.add({
            targets: fruit,
            scaleX: 0,
            scaleY: 0,
            duration: 100
        });
    }
    
    sliceBomb(bomb) {
        // Play bomb explosion sound
        this.sound.play('bombExplosion', { volume: 0.8 });
        
        // Dramatic bomb explosion shake
        this.addExplosionShake();
        
        this.gameOver();
        
        this.createBombParticles(bomb.x, bomb.y);
    }
    
    createFruitParticles(x, y, textureKey, sliceDirection = { x: 1, y: 0 }) {
        // Extract colors from the fruit texture
        const colors = this.colorExtractor.extractColors(this, textureKey, 4);
        
        // Calculate perpendicular direction to slice for particle spread
        const perpX = -sliceDirection.y;
        const perpY = sliceDirection.x;
        
        // Create fruit chunk particles (small versions of the fruit)
        const chunkCount = Phaser.Math.Between(3, 5);
        for (let i = 0; i < chunkCount; i++) {
            const chunk = this.add.sprite(x, y, textureKey);
            const scale = Phaser.Math.FloatBetween(0.15, 0.3);
            chunk.setScale(scale);
            chunk.setDepth(100);
            
            // Add random rotation
            chunk.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
            
            // Physics movement - spread perpendicular to slice direction
            const side = (i % 2 === 0) ? 1 : -1; // Alternate sides
            const baseVelocity = 100;
            const velocityX = perpX * side * baseVelocity + Phaser.Math.Between(-30, 30);
            const velocityY = perpY * side * baseVelocity + Phaser.Math.Between(-80, -20);
            const rotationSpeed = Phaser.Math.FloatBetween(-0.2, 0.2);
            
            this.tweens.add({
                targets: chunk,
                x: x + velocityX,
                y: y + velocityY + 100, // Add gravity effect
                rotation: chunk.rotation + rotationSpeed * 5,
                scaleX: scale * 0.5,
                scaleY: scale * 0.5,
                alpha: 0,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => chunk.destroy()
            });
        }
        
        // Create color particles (juice/pulp effect)
        const colorParticleCount = Phaser.Math.Between(8, 12);
        for (let i = 0; i < colorParticleCount; i++) {
            const color = this.colorExtractor.getRandomColor(colors);
            const particle = this.add.circle(x, y, Phaser.Math.Between(2, 4), color.hex);
            particle.setDepth(99);
            
            // Spread color particles in both directions from slice
            const side = Math.random() < 0.5 ? 1 : -1;
            const spreadIntensity = 60;
            const velocityX = perpX * side * spreadIntensity + Phaser.Math.Between(-40, 40);
            const velocityY = perpY * side * spreadIntensity + Phaser.Math.Between(-80, -20);
            
            this.tweens.add({
                targets: particle,
                x: x + velocityX,
                y: y + velocityY + 60,
                alpha: 0,
                duration: 600,
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * Show red X indicator where a fruit hit the bottom
     * @param {number} x - X position where fruit hit bottom
     * @param {number} y - Y position (near bottom of screen)
     */
    showMissedFruitIndicator(x, y) {
        // Create red X using graphics
        const xMark = this.add.graphics();
        xMark.lineStyle(6, 0xff0000, 1); // Thick red line
        
        const size = 25; // Size of the X
        
        // Draw X shape (two diagonal lines)
        xMark.lineBetween(x - size, y - size, x + size, y + size); // Top-left to bottom-right
        xMark.lineBetween(x + size, y - size, x - size, y + size); // Top-right to bottom-left
        
        xMark.setDepth(1000); // Make sure it appears on top
        
        // Add pulsing animation
        this.tweens.add({
            targets: xMark,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.7,
            duration: 200,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Fade out after pulsing
                this.tweens.add({
                    targets: xMark,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => xMark.destroy()
                });
            }
        });
        
        // Add miss shake effect
        this.addMissShake();
    }
    
    createBombParticles(x, y) {
        // Keep original bomb particles (darker, more explosive)
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), 0x333333);
            particle.setDepth(100);
            
            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-80, 80),
                y: y + Phaser.Math.Between(-80, 80),
                alpha: 0,
                duration: 700,
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createFloatingScorePopup(x, y, points, combo) {
        // Create floating score text with enhanced styling
        const scoreText = this.add.text(x, y, `+${points}`, {
            fontSize: `${Math.round(Math.max(24, points))}px`,
            fill: combo > 1 ? '#f6ff0d' : '#4bbbf0',
            fontFamily: 'Poppins, Arial, sans-serif',
            fontStyle: '800',
            stroke: '#101631',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 6,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5).setDepth(1000);
        
        // Add combo text if applicable
        if (combo > 1) {
            const comboText = this.add.text(x, y + 30, `COMBO x${combo}!`, {
                fontSize: `${Math.round(16)}px`,
                fill: '#ff6b35',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontStyle: '700',
                stroke: '#101631',
                strokeThickness: 2,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    stroke: false,
                    fill: true
                }
            }).setOrigin(0.5).setDepth(1000);
            
            // Animate combo text
            this.tweens.add({
                targets: comboText,
                y: y - 20,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 1000,
                ease: 'Power2.easeOut',
                onComplete: () => comboText.destroy()
            });
        }
        
        // Animate score popup
        this.tweens.add({
            targets: scoreText,
            y: y - 60,
            alpha: 0,
            scaleX: combo > 1 ? 1.3 : 1.0,
            scaleY: combo > 1 ? 1.3 : 1.0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => scoreText.destroy()
        });
        
        // Add slight upward movement with physics-like arc
        this.tweens.add({
            targets: scoreText,
            x: x + Phaser.Math.Between(-30, 30),
            duration: 800,
            ease: 'Sine.easeOut'
        });
    }
    
    addImpactShake(combo) {
        // Scale shake intensity with combo level
        const baseIntensity = 0.003;
        const comboMultiplier = Math.min(combo * 0.002, 0.015); // Cap intensity
        const intensity = baseIntensity + comboMultiplier;
        const duration = 80 + (combo * 20); // Longer shake for higher combos
        
        this.cameras.main.shake(duration, intensity);
        
        // Add slight zoom pulse for high combos
        if (combo >= 3) {
            this.cameras.main.zoomTo(1.02, 100);
            this.time.delayedCall(100, () => {
                this.cameras.main.zoomTo(1.0, 150);
            });
        }
    }
    
    addExplosionShake() {
        // Intense bomb explosion shake
        this.cameras.main.shake(800, 0.025);
        
        // Add zoom out effect for explosion impact
        this.cameras.main.zoomTo(0.95, 200);
        this.time.delayedCall(200, () => {
            this.cameras.main.zoomTo(1.0, 400);
        });
        
        // Add flash effect
        this.cameras.main.flash(300, 255, 100, 100);
    }
    
    addLifeLossShake() {
        // Moderate shake for life loss with red tint
        this.cameras.main.shake(400, 0.01);
        
        // Red flash to indicate damage
        this.cameras.main.flash(150, 255, 0, 0);
    }
    
    addMissShake() {
        // Quick shake for missed fruit
        this.cameras.main.shake(120, 0.008);
    }
    
    loseLife() {
        // In easy mode, don't lose lives
        if (this.gameMode === 'easy') {
            return;
        }
        
        this.lives--;
        this.animateHeartLoss();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    animateHeartLoss() {
        const heartIndex = this.lives; // Index of heart to lose (0-based)
        
        if (this.heartSprites && this.heartSprites[heartIndex]) {
            const heart = this.heartSprites[heartIndex];
            
            // Stop the pulsing animation
            this.tweens.killTweensOf(heart);
            
            // Animate heart removal with dramatic effect
            this.tweens.add({
                targets: heart,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                angle: 45,
                duration: 500,
                ease: 'Back.easeIn',
                onComplete: () => {
                    heart.destroy(); // Completely remove the heart
                }
            });
            
            // Add dramatic life loss shake
            this.addLifeLossShake();
        }
    }
    
    updateScore() {
        this.scoreText.setText(`🏆 Score: ${this.score}`);
    }
    
    
    updateComboText() {
        if (this.combo > 1) {
            this.comboText.setText(`🔥 Combo x${this.combo}!`);
            
            // Stop any existing tween on combo text
            this.tweens.killTweensOf(this.comboText);
            
            // Reset scale and add pulse effect
            this.comboText.setScale(1);
            this.tweens.add({
                targets: this.comboText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        } else {
            this.comboText.setText('');
            this.comboText.setScale(1);
        }
    }
    
    /**
     * Schedule combo display reset with delay - visual display only
     * The combo logic has already been reset, this just clears the text
     */
    scheduleComboDisplayReset() {
        // Cancel any existing combo reset timer
        if (this.comboResetTimer) {
            this.comboResetTimer.remove();
        }
        
        // Set new timer to clear combo display after delay
        this.comboResetTimer = this.time.delayedCall(2500, () => { // 2.5 seconds delay
            // Clear the display - combo is already logically reset
            this.combo = 0;
            this.updateComboText();
            this.comboResetTimer = null;
        });
    }
    
    /**
     * Cancel combo reset timer when new combo starts
     */
    cancelComboReset() {
        if (this.comboResetTimer) {
            this.comboResetTimer.remove();
            this.comboResetTimer = null;
        }
    }
    
    increaseDifficulty() {
        if (this.spawnRate > 300) {
            this.spawnRate -= 50;
            this.spawnTimer.delay = this.spawnRate;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.spawnTimer.remove();
        this.difficultyTimer.remove();
        
        // Clean up combo reset timer
        if (this.comboResetTimer) {
            this.comboResetTimer.remove();
            this.comboResetTimer = null;
        }
        
        const highScore = parseInt(localStorage.getItem('katanaNinjaHighScore') || '0');
        if (this.score > highScore) {
            localStorage.setItem('katanaNinjaHighScore', this.score.toString());
        }
        
        // Calculate final game time
        this.gameStats.gameTime = Math.round((Date.now() - this.gameStats.gameStartTime) / 1000);
        
        this.inputManager.destroy();
        
        this.transitionToScene('GameOverScene', { 
            score: this.score, 
            highScore: Math.max(this.score, highScore),
            gameStats: this.gameStats
        });
    }
    
    transitionToScene(sceneName, data = null) {
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
                if (data) {
                    this.scene.start(sceneName, data);
                } else {
                    this.scene.start(sceneName);
                }
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