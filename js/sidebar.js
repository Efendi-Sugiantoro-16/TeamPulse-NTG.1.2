/**
 * Sidebar Management System
 * Handles sidebar functionality across all TeamPulse pages
 * Provides consistent animations and responsive behavior
 */

class SidebarManager {
    constructor() {
        this.sidebar = null;
        this.menuToggle = null;
        this.sidebarOverlay = null;
        this.sidebarClose = null;
        this.navLinks = [];
        this.isOpen = false;
        this.isMobile = false;
        this.resizeTimeout = null;
        
        this.init();
    }

    init() {
        // Get DOM elements
        this.sidebar = document.getElementById('sidebar');
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.sidebarClose = document.getElementById('sidebarClose') || document.getElementById('sidebarCloseBtn');
        
        if (!this.sidebar) {
            console.warn('Sidebar element not found');
            return;
        }

        // Get navigation links
        this.navLinks = this.sidebar.querySelectorAll('nav a');
        
        // Set initial state
        this.isMobile = window.innerWidth <= 991;
        this.updateSidebarState();
        
        // Add event listeners
        this.addEventListeners();
        
        // Add CSS classes for animations
        this.addAnimationClasses();
        
        // Initialize accessibility features
        this.initAccessibility();
    }

    addEventListeners() {
        // Menu toggle button
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.openSidebar());
            this.menuToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openSidebar();
                }
            });
        }

        // Sidebar close button
        if (this.sidebarClose) {
            this.sidebarClose.addEventListener('click', () => this.closeSidebar());
            this.sidebarClose.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.closeSidebar();
                }
            });
        }

        // Sidebar overlay
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }

        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMobile) {
                    this.closeSidebar();
                }
            });
        });

        // Window resize handling
        window.addEventListener('resize', () => this.handleResize());
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Touch events for mobile
        this.addTouchEvents();
    }

    addAnimationClasses() {
        // Add animation classes to sidebar
        this.sidebar.classList.add('sidebar-animated');
        
        // Add animation classes to nav items
        this.navLinks.forEach((link, index) => {
            link.style.animationDelay = `${index * 0.1}s`;
            link.classList.add('nav-item-animated');
        });
    }

    initAccessibility() {
        // Set ARIA attributes
        if (this.menuToggle) {
            this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
            this.menuToggle.setAttribute('aria-expanded', 'false');
            this.menuToggle.setAttribute('aria-controls', 'sidebar');
        }

        if (this.sidebarClose) {
            this.sidebarClose.setAttribute('aria-label', 'Close navigation menu');
        }

        // Set focus management
        this.sidebar.setAttribute('tabindex', '-1');
    }

    addTouchEvents() {
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        // Touch start
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = false;
            }
        }, { passive: true });

        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isMobile && this.isOpen) {
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = startX - currentX;
                const deltaY = Math.abs(startY - currentY);

                // Check if it's a horizontal swipe
                if (Math.abs(deltaX) > 50 && deltaY < 100) {
                    isDragging = true;
                    if (deltaX > 0) {
                        // Swipe left - close sidebar
                        this.closeSidebar();
                    }
                }
            }
        }, { passive: true });

        // Touch end
        document.addEventListener('touchend', () => {
            isDragging = false;
        }, { passive: true });
    }

    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 991;
            
            // Handle transition from mobile to desktop
            if (wasMobile && !this.isMobile) {
                this.closeSidebar();
            }
            
            this.updateSidebarState();
        }, 150);
    }

    handleKeyboard(e) {
        // Escape key closes sidebar
        if (e.key === 'Escape' && this.isOpen) {
            this.closeSidebar();
        }
        
        // Tab key management
        if (e.key === 'Tab' && this.isOpen && this.isMobile) {
            this.handleTabNavigation(e);
        }
    }

    handleTabNavigation(e) {
        const focusableElements = this.sidebar.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    updateSidebarState() {
        if (this.isMobile) {
            this.sidebar.classList.add('sidebar-mobile');
            this.sidebar.classList.remove('sidebar-desktop');
            this.closeSidebar();
        } else {
            this.sidebar.classList.add('sidebar-desktop');
            this.sidebar.classList.remove('sidebar-mobile');
            this.openSidebar();
        }
    }

    openSidebar() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.sidebar.classList.add('active');
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.add('active');
        }
        
        if (this.menuToggle) {
            this.menuToggle.setAttribute('aria-expanded', 'true');
        }
        
        // Prevent body scroll on mobile
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
        
        // Focus management
        setTimeout(() => {
            if (this.isMobile) {
                this.sidebar.focus();
            }
        }, 100);
        
        // Trigger custom event
        this.dispatchEvent('sidebarOpened');
    }

    closeSidebar() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.sidebar.classList.remove('active');
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.remove('active');
        }
        
        if (this.menuToggle) {
            this.menuToggle.setAttribute('aria-expanded', 'false');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to menu toggle
        if (this.isMobile && this.menuToggle) {
            this.menuToggle.focus();
        }
        
        // Trigger custom event
        this.dispatchEvent('sidebarClosed');
    }

    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { sidebar: this.sidebar, isOpen: this.isOpen }
        });
        document.dispatchEvent(event);
    }

    // Public methods for external use
    getState() {
        return {
            isOpen: this.isOpen,
            isMobile: this.isMobile,
            sidebar: this.sidebar
        };
    }

    destroy() {
        // Remove event listeners
        if (this.menuToggle) {
            this.menuToggle.removeEventListener('click', this.openSidebar);
        }
        if (this.sidebarClose) {
            this.sidebarClose.removeEventListener('click', this.closeSidebar);
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.removeEventListener('click', this.closeSidebar);
        }
        
        // Clear timeouts
        clearTimeout(this.resizeTimeout);
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar manager
    window.sidebarManager = new SidebarManager();
    
    // Add global sidebar methods
    window.SidebarManager = SidebarManager;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarManager;
} 