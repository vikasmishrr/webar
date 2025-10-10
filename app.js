/**
 * WebAR Video Experience
 * Built with Blippar WebAR SDK v2.0.8
 * 
 * This application creates an AR experience where a video plays as a floating plane
 * in the camera feed. Optimized for mobile browsers with HTTPS support.
 */

class WebARVideoApp {
    constructor() {
        // Application state
        this.isInitialized = false;
        this.isCameraAllowed = false;
        this.arScene = null;
        this.videoElement = null;
        this.videoTexture = null;
        this.videoPlane = null;
        
        // DOM elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.permissionPrompt = document.getElementById('permissionPrompt');
        this.errorMessage = document.getElementById('errorMessage');
        this.allowCameraBtn = document.getElementById('allowCameraBtn');
        this.errorText = document.getElementById('errorText');
        this.canvas = document.getElementById('ar-canvas');
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the WebAR application
     * Sets up event listeners and starts the AR experience
     */
    async init() {
        try {
            console.log('🚀 Initializing WebAR Video Experience...');
            
            // Check for HTTPS requirement
            if (!this.isSecureContext()) {
                this.showError('This app requires HTTPS to access the camera. Please use a secure connection.');
                return;
            }

            // Check for WebAR SDK availability
            if (typeof WEBARSDK === 'undefined') {
                this.showError('WebAR SDK not loaded. Please check your internet connection.');
                return;
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Start the AR experience
            await this.startARExperience();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Failed to initialize AR experience. Please refresh the page.');
        }
    }

    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
        // Camera permission button
        this.allowCameraBtn.addEventListener('click', () => {
            this.requestCameraPermission();
        });

        // Handle visibility change (mobile optimization)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseVideo();
            } else {
                this.resumeVideo();
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Start the AR experience
     * Initializes the WebAR SDK and sets up the scene
     */
    async startARExperience() {
        try {
            console.log('📱 Starting AR experience...');
            
            // Show permission prompt if needed
            if (!this.isCameraAllowed) {
                this.showPermissionPrompt();
                return;
            }

            // Initialize WebAR SDK
            await this.initializeWebARSDK();
            
            // Create video element and texture
            await this.setupVideo();
            
            // Create AR scene with video plane
            this.createARScene();
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            console.log('✅ AR experience started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start AR experience:', error);
            this.showError('Failed to start AR experience. Please check camera permissions.');
        }
    }

    /**
     * Initialize the Blippar WebAR SDK
     * Sets up the AR engine with proper configuration
     */
    async initializeWebARSDK() {
        try {
            console.log('🔧 Initializing WebAR SDK...');
            
            // Check if WebAR SDK is available
            if (!WEBARSDK || !WEBARSDK.init) {
                throw new Error('WebAR SDK not properly loaded');
            }

            // Initialize the WebAR SDK
            await WEBARSDK.init({
                canvas: this.canvas,
                camera: {
                    facingMode: 'environment'
                }
            });

            // Get the AR scene
            this.arScene = WEBARSDK.getScene();
            
            console.log('✅ WebAR SDK initialized');
            
        } catch (error) {
            console.error('❌ WebAR SDK initialization failed:', error);
            throw new Error('Failed to initialize WebAR SDK');
        }
    }

    /**
     * Set up video element and create texture
     * Creates a video element that will be used as a texture in AR
     */
    async setupVideo() {
        try {
            console.log('🎥 Setting up video...');
            
            // Create video element
            this.videoElement = document.createElement('video');
            this.videoElement.src = 'video.mp4';
            this.videoElement.loop = true;
            this.videoElement.muted = true; // Required for autoplay
            this.videoElement.playsInline = true; // Prevent fullscreen on mobile
            this.videoElement.crossOrigin = 'anonymous';
            
            // Set video attributes for mobile optimization
            this.videoElement.setAttribute('webkit-playsinline', 'true');
            this.videoElement.setAttribute('playsinline', 'true');
            
            // Add to DOM (hidden)
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);
            
            // Wait for video to be ready
            await this.waitForVideoReady();
            
            // Create video texture using WebAR SDK
            this.videoTexture = WEBARSDK.createVideoTexture(this.videoElement);
            
            console.log('✅ Video setup complete');
            
        } catch (error) {
            console.error('❌ Video setup failed:', error);
            throw new Error('Failed to setup video');
        }
    }

    /**
     * Wait for video to be ready to play
     * Handles video loading and metadata
     */
    async waitForVideoReady() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Video loading timeout'));
            }, 10000); // 10 second timeout

            this.videoElement.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.videoElement.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(new Error('Video loading failed: ' + e.message));
            });

            // Start loading the video
            this.videoElement.load();
        });
    }

    /**
     * Create AR scene with floating video plane
     * Creates a plane geometry with video texture in 3D space
     */
    createARScene() {
        try {
            console.log('🎬 Creating AR scene...');
            
            // Create a simple video plane using WebAR SDK
            this.videoPlane = WEBARSDK.createVideoPlane({
                video: this.videoElement,
                width: 2,
                height: 1.125,
                position: { x: 0, y: 0, z: -2 }
            });
            
            // Add to scene
            this.arScene.add(this.videoPlane);
            
            // Start video playback
            this.startVideoPlayback();
            
            // Start AR rendering loop
            this.startRenderLoop();
            
            console.log('✅ AR scene created');
            
        } catch (error) {
            console.error('❌ Failed to create AR scene:', error);
            throw new Error('Failed to create AR scene');
        }
    }

    /**
     * Start video playback
     * Begins playing the video with proper error handling
     */
    async startVideoPlayback() {
        try {
            console.log('▶️ Starting video playback...');
            
            // Play the video
            await this.videoElement.play();
            
            console.log('✅ Video playback started');
            
        } catch (error) {
            console.error('❌ Video playback failed:', error);
            // Try to play again after a short delay
            setTimeout(() => {
                this.videoElement.play().catch(console.error);
            }, 1000);
        }
    }

    /**
     * Start the AR rendering loop
     * Continuously renders the AR scene
     */
    startRenderLoop() {
        const render = () => {
            if (this.arScene && this.isInitialized) {
                // Update video texture
                if (this.videoTexture) {
                    this.videoTexture.update();
                }
                
                // Render the scene using WebAR SDK
                WEBARSDK.render();
            }
            
            // Continue the loop
            requestAnimationFrame(render);
        };
        
        // Start the loop
        render();
    }

    /**
     * Request camera permission from user
     * Handles camera access with proper error handling
     */
    async requestCameraPermission() {
        try {
            console.log('📷 Requesting camera permission...');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use rear camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Permission granted
            this.isCameraAllowed = true;
            this.hidePermissionPrompt();
            
            // Start AR experience
            await this.startARExperience();
            
            console.log('✅ Camera permission granted');
            
        } catch (error) {
            console.error('❌ Camera permission denied:', error);
            this.showError('Camera access is required for this AR experience. Please allow camera access and refresh the page.');
        }
    }

    /**
     * Show permission prompt to user
     */
    showPermissionPrompt() {
        this.permissionPrompt.classList.add('show');
    }

    /**
     * Hide permission prompt
     */
    hidePermissionPrompt() {
        this.permissionPrompt.classList.remove('show');
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        this.loadingOverlay.classList.add('hidden');
        this.isInitialized = true;
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        this.hideLoadingOverlay();
    }

    /**
     * Pause video playback
     * Called when app goes to background
     */
    pauseVideo() {
        if (this.videoElement && !this.videoElement.paused) {
            this.videoElement.pause();
        }
    }

    /**
     * Resume video playback
     * Called when app comes to foreground
     */
    resumeVideo() {
        if (this.videoElement && this.videoElement.paused) {
            this.videoElement.play().catch(console.error);
        }
    }

    /**
     * Handle orientation change
     * Adjusts the scene for new orientation
     */
    handleOrientationChange() {
        if (this.arScene) {
            // Update canvas size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // Update WebAR SDK camera
            WEBARSDK.updateCamera({
                aspect: window.innerWidth / window.innerHeight
            });
        }
    }

    /**
     * Handle window resize
     * Adjusts the scene for new dimensions
     */
    handleResize() {
        if (this.arScene) {
            // Update canvas size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // Update WebAR SDK camera
            WEBARSDK.updateCamera({
                aspect: window.innerWidth / window.innerHeight
            });
        }
    }

    /**
     * Check if the context is secure (HTTPS)
     * Required for camera access
     */
    isSecureContext() {
        return window.isSecureContext || 
               window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 WebAR Video Experience Starting...');
    new WebARVideoApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    console.log('👋 WebAR Video Experience Ending...');
});
