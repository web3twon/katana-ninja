/**
 * Responsive utility functions for Katana Ninja game
 * Provides consistent sizing and positioning across all devices
 */
class ResponsiveUtils {
    static getFontSize(scene, category = 'normal') {
        const { width: gameWidth, height: gameHeight } = scene.cameras.main;
        const baseSize = Math.min(gameWidth, gameHeight);
        
        const sizes = {
            title: Math.max(Math.min(baseSize / 12, 64), 24),
            large: Math.max(Math.min(baseSize / 18, 48), 20),
            normal: Math.max(Math.min(baseSize / 25, 32), 16),
            small: Math.max(Math.min(baseSize / 30, 24), 14),
            tiny: Math.max(Math.min(baseSize / 35, 18), 12)
        };
        
        return sizes[category] || sizes.normal;
    }
    
    static getMargin(scene, type = 'normal') {
        const { width: gameWidth, height: gameHeight } = scene.cameras.main;
        
        const margins = {
            small: Math.max(gameWidth * 0.02, 10),
            normal: Math.max(gameWidth * 0.03, 20),
            large: Math.max(gameWidth * 0.05, 30),
            top: Math.max(gameHeight * 0.05, 30),
            bottom: Math.max(gameHeight * 0.05, 30)
        };
        
        return margins[type] || margins.normal;
    }
    
    static getStrokeThickness(fontSize) {
        return Math.max(2, fontSize / 12);
    }
    
    static isSmallScreen(scene) {
        const { width: gameWidth, height: gameHeight } = scene.cameras.main;
        return Math.min(gameWidth, gameHeight) < 500;
    }
    
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static getTouchSensitivity(scene) {
        // Increase touch sensitivity on smaller screens
        const baseSize = Math.min(scene.cameras.main.width, scene.cameras.main.height);
        return Math.max(5, baseSize / 100);
    }
}