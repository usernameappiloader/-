// ===== TOUCH GESTURES MANAGER - GESTION DES GESTES TACTILES =====

class TouchGesturesManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.maxVerticalDistance = 100;
        this.pullToRefreshThreshold = 80;
        this.isPulling = false;
        this.pullIndicator = null;
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupTouchEvents();
        if (typeof this.setupPullToRefresh === 'function') {
            this.setupPullToRefresh();
        } else {
            console.warn('setupPullToRefresh method not found in TouchGesturesManager');
        }
        this.setupSwipeNavigation();
        this.setupTouchFeedback();
    }

    // Setup basic touch events
    setupTouchEvents() {
        document.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    // Handle touch start
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;

        // Reset pull indicator
        if (this.pullIndicator) {
            this.pullIndicator.style.transform = 'translateY(-100%)';
            this.isPulling = false;
        }
    }

    // Handle touch move
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Handle pull to refresh
        if (this.isAtTop() && deltaY > 0) {
            e.preventDefault();
            this.handlePullToRefresh(deltaY);
        }

        // Handle horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            e.preventDefault();
        }
    }

    // Handle touch end
    handleTouchEnd(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Handle swipe gestures
        if (Math.abs(deltaX) > this.minSwipeDistance && Math.abs(deltaY) < this.maxVerticalDistance) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }

        // Handle pull to refresh completion
        if (this.isPulling && deltaY > this.pullToRefreshThreshold) {
            this.completePullToRefresh();
        } else if (this.pullIndicator) {
            this.pullIndicator.style.transform = 'translateY(-100%)';
            this.isPulling = false;
        }

        // Reset touch coordinates
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
    }

    // Check if user is at the top of the page
    isAtTop() {
        return window.scrollY === 0;
    }

    // Handle pull to refresh
    handlePullToRefresh(deltaY) {
        if (!this.pullIndicator) {
            this.createPullIndicator();
        }

        this.isPulling = true;
        const progress = Math.min(deltaY / this.pullToRefreshThreshold, 1);
        const translateY = Math.min(deltaY * 0.5, this.pullToRefreshThreshold);

        this.pullIndicator.style.transform = `translateY(${translateY - 100}%)`;
        this.pullIndicator.style.opacity = progress;

        // Update indicator text
        const indicatorText = this.pullIndicator.querySelector('.pull-text');
        if (progress >= 1) {
            indicatorText.textContent = 'Relâchez pour actualiser';
            this.pullIndicator.classList.add('ready');
        } else {
            indicatorText.textContent = 'Tirez pour actualiser';
            this.pullIndicator.classList.remove('ready');
        }
    }

    // Create pull to refresh indicator
    createPullIndicator() {
        this.pullIndicator = document.createElement('div');
        this.pullIndicator.className = 'pull-to-refresh-indicator';
        this.pullIndicator.innerHTML = `
            <div class="pull-spinner">
                <i class="fas fa-sync-alt"></i>
            </div>
            <div class="pull-text">Tirez pour actualiser</div>
        `;

        document.body.appendChild(this.pullIndicator);
    }

    // Complete pull to refresh
    completePullToRefresh() {
        if (!this.pullIndicator) return;

        const indicatorText = this.pullIndicator.querySelector('.pull-text');
        indicatorText.textContent = 'Actualisation...';
        this.pullIndicator.classList.add('refreshing');

        // Add spinning animation
        const spinner = this.pullIndicator.querySelector('.pull-spinner i');
        spinner.classList.add('fa-spin');

        // Refresh the page or reload data
        setTimeout(() => {
            if (window.downloadHub) {
                window.downloadHub.loadInitialData();
            }
            this.resetPullIndicator();
        }, 1000);
    }

    // Reset pull indicator
    resetPullIndicator() {
        if (!this.pullIndicator) return;

        this.pullIndicator.classList.remove('refreshing', 'ready');
        const spinner = this.pullIndicator.querySelector('.pull-spinner i');
        spinner.classList.remove('fa-spin');

        setTimeout(() => {
            if (this.pullIndicator) {
                this.pullIndicator.style.transform = 'translateY(-100%)';
                this.pullIndicator.style.opacity = '0';
                this.isPulling = false;
            }
        }, 300);
    }

    // Handle swipe right (previous section)
    handleSwipeRight() {
        const sections = ['home', 'categories', 'downloads'];
        const currentIndex = sections.indexOf(this.currentSection);

        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            this.navigateToSection(prevSection);
        }
    }

    // Handle swipe left (next section)
    handleSwipeLeft() {
        const sections = ['home', 'categories', 'downloads'];
        const currentIndex = sections.indexOf(this.currentSection);

        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            this.navigateToSection(nextSection);
        }
    }

    // Navigate to section
    navigateToSection(sectionId) {
        this.currentSection = sectionId;
        const element = document.getElementById(sectionId);

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Update URL hash
            history.replaceState(null, null, `#${sectionId}`);

            // Add visual feedback
            this.addSwipeFeedback(sectionId);
        }
    }

    // Add swipe feedback
    addSwipeFeedback(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('swipe-highlight');
            setTimeout(() => {
                element.classList.remove('swipe-highlight');
            }, 500);
        }
    }

    // Setup swipe navigation indicators
    setupSwipeNavigation() {
        // Create navigation dots
        const navDots = document.createElement('div');
        navDots.className = 'swipe-nav-dots';
        navDots.innerHTML = `
            <div class="nav-dot active" data-section="home"></div>
            <div class="nav-dot" data-section="categories"></div>
            <div class="nav-dot" data-section="downloads"></div>
        `;

        document.body.appendChild(navDots);

        // Update active dot on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveNavDot();
        });

        // Handle dot clicks
        navDots.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-dot')) {
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            }
        });
    }

    // Update active navigation dot
    updateActiveNavDot() {
        const sections = ['home', 'categories', 'downloads'];
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + window.scrollY;
                const elementBottom = elementTop + rect.height;

                if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
                    this.currentSection = sectionId;
                    this.updateNavDots(sectionId);
                }
            }
        });
    }

    // Update navigation dots
    updateNavDots(activeSection) {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.dataset.section === activeSection) {
                dot.classList.add('active');
            }
        });
    }

    // Setup touch feedback for interactive elements
    setupTouchFeedback() {
        // Add touch feedback to buttons and cards
        const interactiveElements = document.querySelectorAll('button, .category-card, .download-card, .btn');

        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });

            element.addEventListener('touchend', () => {
                element.classList.remove('touch-active');
            });

            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            });
        });
    }

    // Handle double tap to zoom (prevent default zoom)
    handleDoubleTap() {
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                // Handle double tap action if needed
                console.log('[Touch] Double tap detected');
            }

            lastTap = currentTime;
        });
    }

    // Get gesture information
    getGestureInfo() {
        return {
            startX: this.touchStartX,
            startY: this.touchStartY,
            endX: this.touchEndX,
            endY: this.touchEndY,
            deltaX: this.touchEndX - this.touchStartX,
            deltaY: this.touchEndY - this.touchStartY,
            currentSection: this.currentSection
        };
    }

    // Enable/disable touch gestures
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Remove event listeners if disabled
            document.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchmove', this.handleTouchMove);
            document.removeEventListener('touchend', this.handleTouchEnd);
        } else {
            this.setupTouchEvents();
        }
    }
}

// Initialize Touch Gestures Manager
document.addEventListener('DOMContentLoaded', () => {
    window.touchGestures = new TouchGesturesManager();
});
