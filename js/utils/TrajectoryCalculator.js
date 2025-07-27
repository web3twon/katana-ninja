/**
 * Trajectory calculation utility for ensuring fruits follow viewport-aware arcs
 * Mimics the predictable trajectories from the original Fruit Ninja
 */
class TrajectoryCalculator {
    constructor(gameWidth, gameHeight, gravity = 300) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.gravity = gravity;
        
        // Detect desktop mode on mobile device (causes trajectory issues)
        this.isDesktopModeOnMobile = this.detectDesktopModeOnMobile();
        
        // Define safe zones for trajectory targets - Guarantees minimum 40% height
        this.safeZone = {
            minX: gameWidth * 0.05,          // 5% from left edge for tighter bounds
            maxX: gameWidth * 0.95,          // 5% from right edge for tighter bounds
            minY: gameHeight * 0.05,         // Top 5% of screen
            maxY: gameHeight * 0.6,          // 60% up the screen (ensures 40%+ minimum)
            guaranteedMinY: gameHeight * 0.4 // GUARANTEE fruits reach at least 40% up
        };
        
        // Flight time range for natural-feeling arcs - adjusted to prevent low angles
        this.flightTimeRange = {
            min: 1.0,  // Increased minimum for higher arcs
            max: 1.6   // Reduced max time for more consistent height
        };
    }
    
    /**
     * Calculate trajectory for a fruit spawn
     * @param {number} startX - Spawn X position
     * @param {number} startY - Spawn Y position (usually bottom of screen)
     * @returns {Object} Velocity object with x and y components
     */
    calculateTrajectory(startX, startY) {
        // Choose a target point in the safe zone where the arc should peak
        const targetX = this.chooseTargetX(startX);
        
        // GUARANTEE minimum 40% height - bias heavily toward higher targets
        const minTargetY = Math.min(this.safeZone.guaranteedMinY, this.safeZone.minY);
        const maxTargetY = this.safeZone.maxY;
        
        // 80% chance for higher targets (40%-20% screen height), 20% for very high (20%-5%)
        const targetY = Math.random() < 0.8 
            ? Phaser.Math.Between(minTargetY, this.safeZone.guaranteedMinY * 0.7) // Higher range
            : Phaser.Math.Between(this.safeZone.minY, minTargetY); // Very high range
        
        // Choose flight time based on distance for natural feel
        const distance = Math.abs(targetX - startX);
        const normalizedDistance = distance / this.gameWidth;
        const baseTime = this.flightTimeRange.min + (normalizedDistance * (this.flightTimeRange.max - this.flightTimeRange.min));
        const flightTime = baseTime + Phaser.Math.FloatBetween(-0.2, 0.2); // Add slight variation
        
        // Calculate required velocity using projectile motion equations
        const velocity = this.calculateVelocityToTarget(startX, startY, targetX, targetY, flightTime);
        
        // Apply desktop mode compensation if needed
        return this.applyDesktopModeCompensation(velocity);
    }
    
    /**
     * Choose a smart target X position based on spawn location
     * @param {number} startX - Starting X position
     * @returns {number} Target X position
     */
    chooseTargetX(startX) {
        // If spawning from left side, bias target toward center-right
        // If spawning from right side, bias target toward center-left
        // This creates natural crossing arcs
        
        const centerX = this.gameWidth / 2;
        const spawnSide = startX < centerX ? 'left' : 'right';
        
        if (spawnSide === 'left') {
            // Spawn from left, target center to right side
            const minTarget = centerX;
            const maxTarget = this.safeZone.maxX;
            return Phaser.Math.Between(minTarget, maxTarget);
        } else {
            // Spawn from right, target center to left side  
            const minTarget = this.safeZone.minX;
            const maxTarget = centerX;
            return Phaser.Math.Between(minTarget, maxTarget);
        }
    }
    
    /**
     * Calculate velocity components to reach a target point in given time
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y  
     * @param {number} x2 - Target X
     * @param {number} y2 - Target Y
     * @param {number} time - Flight time in seconds
     * @returns {Object} Velocity components {x, y}
     */
    calculateVelocityToTarget(x1, y1, x2, y2, time) {
        // Projectile motion equations:
        // x2 = x1 + vx * t
        // y2 = y1 + vy * t - 0.5 * g * t²
        
        // Solve for velocity components
        const vx = (x2 - x1) / time;
        const vy = (y2 - y1 + 0.5 * this.gravity * time * time) / time;
        
        return { x: vx, y: vy };
    }
    
    /**
     * Get trajectory for fruits that should arc across the screen
     * Creates the classic "cross-screen" arcs like in Fruit Ninja
     * @param {number} startX - Spawn X position
     * @param {number} startY - Spawn Y position
     * @returns {Object} Velocity object
     */
    getCrossScreenTrajectory(startX, startY) {
        // Force cross-screen trajectory by choosing target on opposite side
        const centerX = this.gameWidth / 2;
        const spawnSide = startX < centerX ? 'left' : 'right';
        
        let targetX;
        if (spawnSide === 'left') {
            // Spawn from left, target center-right - stay within safe bounds
            targetX = Phaser.Math.Between(this.gameWidth * 0.55, this.safeZone.maxX);
        } else {
            // Spawn from right, target center-left - stay within safe bounds
            targetX = Phaser.Math.Between(this.safeZone.minX, this.gameWidth * 0.45);
        }
        
        // GUARANTEE minimum 40% height for cross-screen trajectories too
        const minTargetY = Math.min(this.safeZone.guaranteedMinY, this.safeZone.minY);
        const targetY = Phaser.Math.Between(minTargetY, this.safeZone.maxY * 0.8);
        const flightTime = Phaser.Math.FloatBetween(1.2, 1.8); // Longer for more manageable arcs
        
        const velocity = this.calculateVelocityToTarget(startX, startY, targetX, targetY, flightTime);
        return this.applyDesktopModeCompensation(velocity);
    }
    
    /**
     * Get trajectory for fruits that should go straight up (easier targets)
     * @param {number} startX - Spawn X position
     * @param {number} startY - Spawn Y position
     * @returns {Object} Velocity object
     */
    getStraightUpTrajectory(startX, startY) {
        // Target directly above with slight random offset - stay within bounds
        const maxOffset = Math.min(80, this.gameWidth * 0.1); // Limit offset to 10% of screen width
        let targetX = startX + Phaser.Math.Between(-maxOffset, maxOffset);
        
        // Ensure target X stays within safe bounds
        targetX = Math.max(this.safeZone.minX, Math.min(targetX, this.safeZone.maxX));
        
        // GUARANTEE minimum 40% height for straight-up trajectories
        const minTargetY = Math.min(this.safeZone.guaranteedMinY, this.safeZone.minY);
        const targetY = Phaser.Math.Between(minTargetY, this.safeZone.maxY * 0.6);
        const flightTime = Phaser.Math.FloatBetween(0.8, 1.2); // Shorter for more force
        
        const velocity = this.calculateVelocityToTarget(startX, startY, targetX, targetY, flightTime);
        return this.applyDesktopModeCompensation(velocity);
    }
    
    /**
     * Update dimensions when screen resizes
     * @param {number} width - New game width
     * @param {number} height - New game height
     */
    updateDimensions(width, height) {
        this.gameWidth = width;
        this.gameHeight = height;
        
        // Re-detect desktop mode on mobile in case it changed
        this.isDesktopModeOnMobile = this.detectDesktopModeOnMobile();
        
        this.safeZone = {
            minX: width * 0.05,
            maxX: width * 0.95,
            minY: height * 0.05,
            maxY: height * 0.6,
            guaranteedMinY: height * 0.4  // GUARANTEE 40% minimum height
        };
    }
    
    /**
     * Validate that a trajectory will keep the fruit mostly visible
     * @param {number} startX - Start X position
     * @param {number} startY - Start Y position
     * @param {Object} velocity - Velocity components
     * @returns {boolean} True if trajectory is valid
     */
    validateTrajectory(startX, startY, velocity) {
        // Basic sanity checks - prevent NaN, Infinity, or obviously broken trajectories
        if (!velocity || typeof velocity.x !== 'number' || typeof velocity.y !== 'number') {
            return false;
        }
        
        if (!isFinite(velocity.x) || !isFinite(velocity.y)) {
            return false;
        }
        
        // Ensure we have some upward velocity (negative Y)
        if (velocity.y >= 0) {
            return false; // Trajectory goes downward or flat
        }
        
        // Prevent extremely high velocities that would make fruits disappear instantly
        const maxVelocity = 2000; // pixels/second
        if (Math.abs(velocity.x) > maxVelocity || Math.abs(velocity.y) > maxVelocity) {
            return false;
        }
        
        // Calculate peak position to ensure it's reasonable
        const timeToApex = Math.abs(velocity.y) / this.gravity;
        const apexX = startX + velocity.x * timeToApex;
        const apexY = startY + velocity.y * timeToApex - 0.5 * this.gravity * timeToApex * timeToApex;
        
        // STRICT bounds check to eliminate low angle trajectories
        const screenMargin = this.gameWidth * 0.1; // Tighter 10% margin on sides
        const minX = -screenMargin;
        const maxX = this.gameWidth + screenMargin;
        const minY = -200; // Allow going above screen
        const maxY = this.gameHeight * 0.6; // Must reach at least 40% up screen
        
        const inReasonableBounds = (apexX >= minX && apexX <= maxX && apexY >= minY && apexY <= maxY);
        
        // CRITICAL: Ensure minimum height is achieved - reject low trajectories
        const minHeightReached = apexY <= this.gameHeight * 0.6; // Apex must be above 40% screen height
        
        return inReasonableBounds && minHeightReached;
    }
    
    /**
     * Detect if we're in desktop mode on a mobile device
     * This causes viewport/DPR issues that make trajectories too extreme
     */
    detectDesktopModeOnMobile() {
        // Check if it's a mobile device with desktop user agent
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasDesktopUserAgent = !(/Mobi|Android/i.test(navigator.userAgent));
        const hasHighDPR = window.devicePixelRatio > 1.5;
        const hasLargeViewport = window.innerWidth > 768;
        
        // If it's a mobile device but reports desktop characteristics, it's likely desktop mode
        return (isMobileDevice && hasDesktopUserAgent) || 
               (hasHighDPR && hasLargeViewport && window.screen.width < 768);
    }
    
    /**
     * Apply desktop mode compensation to trajectory values
     * Reduces velocity scaling when desktop mode is detected on mobile
     */
    applyDesktopModeCompensation(velocity) {
        if (!this.isDesktopModeOnMobile) {
            return velocity;
        }
        
        // Desktop mode on mobile often causes 2-3x velocity scaling issues
        const compensationFactor = 0.6; // Reduce velocities by 40%
        
        return {
            x: velocity.x * compensationFactor,
            y: velocity.y * compensationFactor
        };
    }
}