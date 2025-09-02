// ===== UI ENHANCEMENTS MODULE =====
// Handles theme toggle, pagination, favorites, and animations

class UIEnhancements {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.favorites = this.loadFavorites();
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupPagination();
        this.setupAnimations();
        this.applyTheme();
    }

    // ===== THEME MANAGEMENT =====
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            this.updateThemeIcon();
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.saveTheme();
        this.applyTheme();
        this.updateThemeIcon();
    }

    applyTheme() {
        const body = document.body;
        if (this.currentTheme === 'light') {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
    }

    loadTheme() {
        return localStorage.getItem('theme') || 'dark';
    }

    // ===== PAGINATION =====
    setupPagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('Prev page clicked, current page:', this.currentPage);
                this.changePage(this.currentPage - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('Next page clicked, current page:', this.currentPage);
                this.changePage(this.currentPage + 1);
            });
        }
    }

    getPaginatedItems(items) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return items.slice(startIndex, endIndex);
    }

    updatePagination(totalItems) {
        console.log(`updatePagination called with totalItems: ${totalItems}, itemsPerPage: ${this.itemsPerPage}`);
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        console.log(`Calculated totalPages: ${totalPages}`);

        const paginationContainer = document.getElementById('pagination-container');
        const paginationInfo = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const paginationUl = document.querySelector('.pagination-custom');

        if (totalPages <= 1) {
            console.log('Hiding pagination - only 1 page or less');
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }

        console.log('Showing pagination');
        if (paginationContainer) paginationContainer.style.display = 'flex';
        if (paginationInfo) paginationInfo.textContent = `Page ${this.currentPage} sur ${totalPages}`;

        // Update prev/next buttons
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;

        // Remove existing page number buttons
        if (paginationUl) {
            const existingPageBtns = paginationUl.querySelectorAll('.page-number-btn');
            existingPageBtns.forEach(btn => btn.remove());

            // Generate page numbers
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            const nextBtnLi = nextBtn ? nextBtn.parentElement : null;

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('li');
                pageBtn.className = 'page-item page-number-btn';
                pageBtn.innerHTML = `<button class="page-link ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
                pageBtn.querySelector('button').addEventListener('click', () => {
                    console.log(`Page ${i} clicked`);
                    this.changePage(i);
                });

                if (nextBtnLi) {
                    paginationUl.insertBefore(pageBtn, nextBtnLi);
                } else {
                    paginationUl.appendChild(pageBtn);
                }
            }
        }
    }

    changePage(page) {
        const totalItems = window.downloadHub ? window.downloadHub.filteredDownloads.length : 0;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        console.log(`changePage called with page=${page}, totalPages=${totalPages}`);

        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            if (window.downloadHub && typeof window.downloadHub.filterAndDisplayDownloads === 'function') {
                window.downloadHub.filterAndDisplayDownloads();
            } else {
                console.warn('window.downloadHub or filterAndDisplayDownloads not available');
            }
            // Scroll to top of downloads section
            const downloadsSection = document.getElementById('downloads');
            if (downloadsSection) {
                downloadsSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            console.warn(`Invalid page number: ${page}`);
        }
    }

    // ===== FAVORITES MANAGEMENT =====
    toggleFavorite(downloadId) {
        const index = this.favorites.indexOf(downloadId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(downloadId);
        }
        this.saveFavorites();
        this.updateFavoriteButtons();
        this.showNotification(index > -1 ? 'Retiré des favoris' : 'Ajouté aux favoris');
    }

    isFavorite(downloadId) {
        return this.favorites.includes(downloadId);
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const downloadId = btn.getAttribute('data-download-id');
            const isFav = this.isFavorite(downloadId);
            const icon = btn.querySelector('i');

            btn.classList.toggle('active', isFav);
            if (icon) {
                icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
            }
        });
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    loadFavorites() {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    }

    // ===== ANIMATIONS =====
    setupAnimations() {
        this.setupHoverAnimations();
        this.setupScrollAnimations();
    }

    setupHoverAnimations() {
        // Enhanced hover effects for cards
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.category-card, .download-card, .stat-item')) {
                e.target.closest('.category-card, .download-card, .stat-item').classList.add('hover-enhanced');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.category-card, .download-card, .stat-item')) {
                e.target.closest('.category-card, .download-card, .stat-item').classList.remove('hover-enhanced');
            }
        });

        // Click animations
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('button, .btn')) {
                e.target.closest('button, .btn').classList.add('click-animation');
            }
        });

        document.addEventListener('mouseup', (e) => {
            document.querySelectorAll('.click-animation').forEach(el => {
                el.classList.remove('click-animation');
            });
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe cards for scroll animations
        document.querySelectorAll('.category-card, .download-card, .stat-item').forEach(card => {
            observer.observe(card);
        });
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// ===== NOTIFICATION ANIMATIONS =====
const notificationStyles = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .notification-toast {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
`;

// Add notification styles to head
const style = document.createElement('style');
style.textContent = notificationStyles;
document.head.appendChild(style);

// Initialize UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiEnhancements = new UIEnhancements();
});
