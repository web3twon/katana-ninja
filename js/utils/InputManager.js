class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isSlicing = false;
        this.slicePath = [];
        this.lastSlicePoint = null;
        
        // Blade dragging sound management
        this.bladeScrapeSound = null;
        this.isBladeSoundPlaying = false;
        
        this.setupInputHandlers();
    }
    
    setupInputHandlers() {
        this.scene.input.on('pointerdown', this.onSliceStart, this);
        this.scene.input.on('pointermove', this.onSliceMove, this);
        this.scene.input.on('pointerup', this.onSliceEnd, this);
        
        this.scene.input.on('pointerout', this.onSliceEnd, this);
        this.scene.input.on('pointercancel', this.onSliceEnd, this);
    }
    
    onSliceStart(pointer) {
        this.isSlicing = true;
        this.slicePath = [];
        this.lastSlicePoint = { x: pointer.x, y: pointer.y };
        this.slicePath.push({ x: pointer.x, y: pointer.y, time: this.scene.time.now });
        
        // Start blade scraping sound effect
        this.startBladeScrapeSound();
        
        this.scene.events.emit('sliceStart', pointer);
    }
    
    onSliceMove(pointer) {
        if (!this.isSlicing) return;
        
        const currentPoint = { x: pointer.x, y: pointer.y };
        
        if (this.lastSlicePoint) {
            const distance = Phaser.Math.Distance.Between(
                this.lastSlicePoint.x, this.lastSlicePoint.y,
                currentPoint.x, currentPoint.y
            );
            
            // Scale minimum distance based on screen size for better touch responsiveness
            const minDistance = Math.max(3, Math.min(this.scene.cameras.main.width, this.scene.cameras.main.height) / 150);
            
            // Always emit slice move for continuous ninja slicing, even for small movements
            this.scene.events.emit('sliceMove', {
                from: this.lastSlicePoint,
                to: currentPoint,
                path: this.slicePath
            });
            
            // Only add to path and update lastSlicePoint if significant movement occurred
            // This prevents path array from growing too large while maintaining continuous slicing
            if (distance > minDistance) {
                this.slicePath.push({ 
                    x: currentPoint.x, 
                    y: currentPoint.y, 
                    time: this.scene.time.now 
                });
                
                this.lastSlicePoint = currentPoint;
            }
        }
    }
    
    onSliceEnd(pointer) {
        if (!this.isSlicing) return;
        
        this.isSlicing = false;
        
        // Stop blade scraping sound effect
        this.stopBladeScrapeSound();
        
        this.scene.events.emit('sliceEnd', {
            path: this.slicePath,
            endPoint: { x: pointer.x, y: pointer.y }
        });
        
        this.slicePath = [];
        this.lastSlicePoint = null;
    }
    
    getSliceVelocity() {
        if (this.slicePath.length < 2) return 0;
        
        const recent = this.slicePath.slice(-3);
        if (recent.length < 2) return 0;
        
        const start = recent[0];
        const end = recent[recent.length - 1];
        const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
        const timeSpan = end.time - start.time;
        
        return timeSpan > 0 ? distance / timeSpan : 0;
    }
    
    /**
     * Start the blade scraping sound effect for realistic katana dragging
     * Plays the sound from halfway point and loops until slice ends
     */
    startBladeScrapeSound() {
        // Avoid duplicate sounds if already playing
        if (this.isBladeSoundPlaying) return;
        
        try {
            // Create the blade scrape sound with specific configuration
            this.bladeScrapeSound = this.scene.sound.add('metalScrape', {
                volume: 0.4,
                loop: true,
                rate: 1.0
            });
            
            // Start playing from halfway through the audio (50% through)
            // This gives us the sustained scraping part without the initial attack
            this.bladeScrapeSound.play();
            
            // Use setSeek with duration calculation for proper percentage seeking
            if (this.bladeScrapeSound.duration > 0) {
                this.bladeScrapeSound.setSeek(this.bladeScrapeSound.duration * 0.5);
            }
            this.isBladeSoundPlaying = true;
            
        } catch (error) {
            console.warn('Failed to start blade scrape sound:', error);
            this.isBladeSoundPlaying = false;
        }
    }
    
    /**
     * Stop the blade scraping sound effect when slice gesture ends
     */
    stopBladeScrapeSound() {
        if (this.bladeScrapeSound && this.isBladeSoundPlaying) {
            try {
                // Fade out the sound for smoother ending
                this.scene.tweens.add({
                    targets: this.bladeScrapeSound,
                    volume: 0,
                    duration: 100,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        if (this.bladeScrapeSound) {
                            this.bladeScrapeSound.stop();
                            this.bladeScrapeSound.destroy();
                            this.bladeScrapeSound = null;
                        }
                    }
                });
            } catch (error) {
                console.warn('Failed to stop blade scrape sound:', error);
                // Force cleanup on error
                if (this.bladeScrapeSound) {
                    this.bladeScrapeSound.stop();
                    this.bladeScrapeSound.destroy();
                    this.bladeScrapeSound = null;
                }
            }
            this.isBladeSoundPlaying = false;
        }
    }
    
    destroy() {
        // Clean up blade scrape sound if still playing
        this.stopBladeScrapeSound();
        
        // Remove input event listeners
        this.scene.input.off('pointerdown', this.onSliceStart, this);
        this.scene.input.off('pointermove', this.onSliceMove, this);
        this.scene.input.off('pointerup', this.onSliceEnd, this);
        this.scene.input.off('pointerout', this.onSliceEnd, this);
        this.scene.input.off('pointercancel', this.onSliceEnd, this);
    }
}