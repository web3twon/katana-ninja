/**
 * Color extraction utility for sampling dominant colors from fruit textures
 * Used to create realistic fruit particle effects
 */
class ColorExtractor {
    constructor() {
        this.colorCache = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * Extract dominant colors from a Phaser texture
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {string} textureKey - The texture key to sample
     * @param {number} sampleCount - Number of color samples to take
     * @returns {Array} Array of color objects with hex values
     */
    extractColors(scene, textureKey, sampleCount = 5) {
        // Check cache first
        const cacheKey = `${textureKey}_${sampleCount}`;
        if (this.colorCache.has(cacheKey)) {
            return this.colorCache.get(cacheKey);
        }
        
        try {
            // Get the texture from Phaser
            const texture = scene.textures.get(textureKey);
            if (!texture || !texture.source[0]) {
                console.warn(`Texture ${textureKey} not found, using fallback colors`);
                return this.getFallbackColors(textureKey);
            }
            
            const source = texture.source[0];
            const image = source.image;
            
            // Set canvas size to match image
            this.canvas.width = image.width;
            this.canvas.height = image.height;
            
            // Draw image to canvas for pixel sampling
            this.ctx.drawImage(image, 0, 0);
            
            // Sample pixels and extract colors
            const colors = this.samplePixels(sampleCount);
            
            // Cache the result
            this.colorCache.set(cacheKey, colors);
            
            return colors;
        } catch (error) {
            console.warn('Error extracting colors:', error);
            return this.getFallbackColors(textureKey);
        }
    }
    
    /**
     * Sample random pixels from the canvas
     * @param {number} sampleCount - Number of samples to take
     * @returns {Array} Array of color objects
     */
    samplePixels(sampleCount) {
        const colors = [];
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Take samples from center area (avoid transparent edges)
        const margin = Math.min(width, height) * 0.1;
        const sampleWidth = width - (margin * 2);
        const sampleHeight = height - (margin * 2);
        
        for (let i = 0; i < sampleCount; i++) {
            const x = Math.floor(margin + Math.random() * sampleWidth);
            const y = Math.floor(margin + Math.random() * sampleHeight);
            
            const pixelData = this.ctx.getImageData(x, y, 1, 1).data;
            const r = pixelData[0];
            const g = pixelData[1];
            const b = pixelData[2];
            const a = pixelData[3];
            
            // Skip transparent or very light pixels
            if (a > 128 && (r + g + b) < 700) {
                colors.push({
                    r: r,
                    g: g,
                    b: b,
                    hex: (r << 16) | (g << 8) | b,
                    css: `rgb(${r}, ${g}, ${b})`
                });
            }
        }
        
        // If no valid colors found, use fallback
        if (colors.length === 0) {
            return this.getFallbackColors();
        }
        
        return colors;
    }
    
    /**
     * Get fallback colors for specific fruit types
     * @param {string} textureKey - The texture key
     * @returns {Array} Array of fallback colors
     */
    getFallbackColors(textureKey = '') {
        const fallbackPalettes = {
            'fruit_0': [ // Apple - reds and greens
                { hex: 0xff4444, css: 'rgb(255, 68, 68)' },
                { hex: 0xcc3333, css: 'rgb(204, 51, 51)' },
                { hex: 0x66cc66, css: 'rgb(102, 204, 102)' },
                { hex: 0xffaa44, css: 'rgb(255, 170, 68)' }
            ],
            'fruit_1': [ // Orange - oranges and yellows
                { hex: 0xff8844, css: 'rgb(255, 136, 68)' },
                { hex: 0xffaa44, css: 'rgb(255, 170, 68)' },
                { hex: 0xffcc44, css: 'rgb(255, 204, 68)' },
                { hex: 0xdd6622, css: 'rgb(221, 102, 34)' }
            ],
            'fruit_2': [ // Banana - yellows
                { hex: 0xffdd44, css: 'rgb(255, 221, 68)' },
                { hex: 0xffee66, css: 'rgb(255, 238, 102)' },
                { hex: 0xddaa22, css: 'rgb(221, 170, 34)' },
                { hex: 0x88dd88, css: 'rgb(136, 221, 136)' }
            ],
            'fruit_3': [ // Watermelon - greens and reds
                { hex: 0x44cc44, css: 'rgb(68, 204, 68)' },
                { hex: 0xff6666, css: 'rgb(255, 102, 102)' },
                { hex: 0x226622, css: 'rgb(34, 102, 34)' },
                { hex: 0xdd4444, css: 'rgb(221, 68, 68)' }
            ],
            'fruit_4': [ // Grapes - purples
                { hex: 0x8844cc, css: 'rgb(136, 68, 204)' },
                { hex: 0x6633aa, css: 'rgb(102, 51, 170)' },
                { hex: 0xaa66dd, css: 'rgb(170, 102, 221)' },
                { hex: 0x44aa44, css: 'rgb(68, 170, 68)' }
            ],
            'fruit_5': [ // Strawberry - reds and greens
                { hex: 0xff3366, css: 'rgb(255, 51, 102)' },
                { hex: 0xdd2244, css: 'rgb(221, 34, 68)' },
                { hex: 0x66cc66, css: 'rgb(102, 204, 102)' },
                { hex: 0xffaacc, css: 'rgb(255, 170, 204)' }
            ],
            'fruit_6': [ // Pineapple - yellows and greens
                { hex: 0xffcc44, css: 'rgb(255, 204, 68)' },
                { hex: 0xddaa22, css: 'rgb(221, 170, 34)' },
                { hex: 0x66aa44, css: 'rgb(102, 170, 68)' },
                { hex: 0x88cc66, css: 'rgb(136, 204, 102)' }
            ]
        };
        
        return fallbackPalettes[textureKey] || fallbackPalettes['fruit_0'];
    }
    
    /**
     * Get a random color from the extracted palette
     * @param {Array} colors - Array of color objects
     * @returns {Object} Random color object
     */
    getRandomColor(colors) {
        if (!colors || colors.length === 0) {
            return { hex: 0xff6b6b, css: 'rgb(255, 107, 107)' };
        }
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Clear the color cache
     */
    clearCache() {
        this.colorCache.clear();
    }
}