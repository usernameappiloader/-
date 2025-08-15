// ===== MAIN APPLICATION LOGIC =====

class DownloadHub {
    constructor() {
        this.currentCategory = '';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadDownloads();
        this.loadStats();
        this.setupSmoothScrolling();
        this.setupAnimations();
        
        // Auto-refresh data every 30 seconds to ensure visitors see new files
        this.setupAutoRefresh();
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }

        // Sort functionality
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => this.handleSort(e.target.value));
        }

        // Download modal events
        const downloadModal = document.getElementById('downloadModal');
        if (downloadModal) {
            downloadModal.addEventListener('show.bs.modal', (e) => this.handleDownloadModal(e));
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // Window scroll events for animations
        window.addEventListener('scroll', () => this.handleScroll());

        // Resize events for responsive adjustments
        window.addEventListener('resize', () => this.handleResize());
    }

    // Load and display categories
    loadCategories() {
        // Ensure category counts are updated first
        window.dataStorage.updateCategoryCounts();
        
        const categories = window.dataStorage.getCategories();
        const categoriesContainer = document.getElementById('categoriesContainer');
        const categoryFilter = document.getElementById('categoryFilter');

        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
            
            categories.forEach(category => {
                const categoryCard = this.createCategoryCard(category);
                categoriesContainer.appendChild(categoryCard);
            });
        }

        // Populate category filter
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id.toString(); // Ensure string value
                option.textContent = `${category.name} (${category.count})`;
                categoryFilter.appendChild(option);
            });
        }
    }

    // Create category card element
    createCategoryCard(category) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';

        col.innerHTML = `
            <div class="category-card fade-in-up" data-category-id="${category.id}">
                <i class="${category.icon}"></i>
                <h5>${category.name}</h5>
                <p>${category.description}</p>
                <span class="badge">${category.count} app${category.count !== 1 ? 's' : ''}</span>
            </div>
        `;

        // Add click event to filter by category
        col.querySelector('.category-card').addEventListener('click', () => {
            this.handleCategoryFilter(category.id);
            document.getElementById('downloads').scrollIntoView({ behavior: 'smooth' });
        });

        return col;
    }

    // Load and display downloads
    loadDownloads(downloads = null) {
        const downloadsData = downloads || window.dataStorage.getDownloads();
        const downloadsContainer = document.getElementById('downloadsContainer');

        if (downloadsContainer) {
            downloadsContainer.innerHTML = '';

            if (downloadsData.length === 0) {
                downloadsContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Aucun téléchargement trouvé pour votre recherche.
                        </div>
                    </div>
                `;
                return;
            }

            downloadsData.forEach((download, index) => {
                const downloadCard = this.createDownloadCard(download, index);
                downloadsContainer.appendChild(downloadCard);
            });

            // Trigger animations
            this.triggerAnimations();
        }
    }

    // Create download card element
    createDownloadCard(download, index) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';

        const imageHtml = download.image ? 
            `<img src="${download.image}" alt="${download.name}" loading="lazy">` :
            `<i class="placeholder-icon fas fa-mobile-alt"></i>`;

        col.innerHTML = `
            <div class="download-card fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="download-card-image">
                    ${imageHtml}
                </div>
                <div class="download-card-body">
                    <h5 class="download-card-title">${download.name}</h5>
                    <p class="download-card-description">${download.description}</p>
                    <div class="download-card-meta">
                        <span><i class="fas fa-tag me-1"></i>${download.category}</span>
                        <span><i class="fas fa-download me-1"></i>${this.formatNumber(download.downloads)}</span>
                    </div>
                    <div class="download-card-meta">
                        <span><i class="fas fa-code-branch me-1"></i>v${download.version}</span>
                        <span><i class="fas fa-hdd me-1"></i>${download.size}</span>
                    </div>
                    <div class="download-card-footer">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${this.formatDate(download.dateAdded)}
                        </small>
                        <button class="btn download-btn" data-download-id="${download.id}">
                            <i class="fas fa-download me-2"></i>Télécharger
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add download button event
        const downloadBtn = col.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => this.handleDownload(download.id));

        return col;
    }

    // Handle search functionality
    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.filterAndDisplayDownloads();
    }

    // Handle category filter
    handleCategoryFilter(categoryId) {
        this.currentCategory = categoryId;
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryId;
        }
        this.filterAndDisplayDownloads();
    }


    // Handle sorting
    handleSort(sortBy) {
        this.currentSort = sortBy;
        this.filterAndDisplayDownloads();
    }

    // Filter and display downloads based on current filters
    filterAndDisplayDownloads() {
        let downloads = window.dataStorage.getDownloads();
        
        // Ensure category counts are updated
        window.dataStorage.updateCategoryCounts();

        // Apply search filter
        if (this.searchQuery) {
            downloads = downloads.filter(download => 
                download.name.toLowerCase().includes(this.searchQuery) ||
                download.description.toLowerCase().includes(this.searchQuery) ||
                download.category.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category filter
        if (this.currentCategory && this.currentCategory !== '') {
            downloads = downloads.filter(download => 
                String(download.categoryId) === String(this.currentCategory)
            );
        }

        // Apply sorting
        downloads = this.sortDownloads(downloads, this.currentSort);

        // Display filtered downloads
        this.loadDownloads(downloads);
        
        // Update category display to reflect current counts
        this.updateCategoryDisplay();
    }


    // Update category display
    updateCategoryDisplay() {
        // Refresh category counts and display
        setTimeout(() => {
            this.loadCategories();
        }, 100);
    }

    // Sort downloads
    sortDownloads(downloads, sortBy) {
        switch (sortBy) {
            case 'name':
                return downloads.sort((a, b) => a.name.localeCompare(b.name));
            case 'downloads':
                return downloads.sort((a, b) => b.downloads - a.downloads);
            case 'date':
                return downloads.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            default:
                return downloads;
        }
    }

    // Handle download button click
    handleDownload(downloadId) {
        const download = window.dataStorage.getDownloadById(downloadId);
        if (download) {
            // Show download modal
            this.showDownloadModal(download);
        }
    }

    // Show download modal
    showDownloadModal(download) {
        const modal = document.getElementById('downloadModal');
        const modalBody = document.getElementById('modalBody');
        const downloadBtn = document.getElementById('downloadBtn');

        if (modal && modalBody && downloadBtn) {
            // Update modal content
            modalBody.innerHTML = `
                <div class="text-center mb-3">
                    ${download.image ? 
                        `<img src="${download.image}" alt="${download.name}" class="img-fluid rounded" style="max-height: 200px;">` :
                        `<i class="fas fa-mobile-alt display-4 text-primary"></i>`
                    }
                </div>
                <h5 class="text-center mb-3">${download.name}</h5>
                <p>${download.description}</p>
                <div class="row text-center">
                    <div class="col-6">
                        <strong>Version:</strong><br>
                        <span class="text-primary">${download.version}</span>
                    </div>
                    <div class="col-6">
                        <strong>Taille:</strong><br>
                        <span class="text-primary">${download.size}</span>
                    </div>
                </div>
                <hr>
                <div class="row text-center">
                    <div class="col-6">
                        <strong>Catégorie:</strong><br>
                        <span class="text-muted">${download.category}</span>
                    </div>
                    <div class="col-6">
                        <strong>Téléchargements:</strong><br>
                        <span class="text-muted">${this.formatNumber(download.downloads)}</span>
                    </div>
                </div>
                ${download.instructions ? `
                <hr>
                <div class="instructions-section">
                    <h6 class="text-dark"><i class="fas fa-list-ol me-2 text-primary"></i>Instructions de téléchargement :</h6>
                    <div class="instructions-content p-3 border rounded" style="background-color: #f8f9fa; border-color: #dee2e6;">
                        ${download.instructions.split('\n').map(line => 
                            line.trim() ? `<p class="mb-2 text-dark"><i class="fas fa-arrow-right me-2 text-primary"></i><strong>${line.trim()}</strong></p>` : ''
                        ).join('')}
                    </div>
                </div>
                ` : ''}
            `;

            // Update download button
            downloadBtn.href = download.url;
            downloadBtn.onclick = () => this.trackDownload(download.id);

            // Show modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    // Track download and increment counter with real user info
    async trackDownload(downloadId) {
        const ipAddress = await this.getUserIP(); // Attend la résolution de la promesse

        const userInfo = {
            ip: ipAddress, // L'adresse IP est maintenant une chaîne de caractères
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'Direct',
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
         window.dataStorage.incrementDownloadCount(downloadId, userInfo);
        this.loadStats();
        
        this.showNotification('Téléchargement commencé !', 'success');
    }


    async getUserIP() {
        // NOTE : Cette fonction dépend du service externe api.ipify.org.
        // Assurez-vous que ses conditions d'utilisation sont compatibles avec votre projet.
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) return 'Unknown';
            const data = await response.json();
            return data.ip;
        } catch (error) {
            // Pas d'alerte console en production
            return 'Unknown';
        }
    }


    // Load and display statistics
    loadStats() {
        const stats = window.dataStorage.getStats();
        
        // Update stats display
        const totalApps = document.getElementById('totalApps');
        const totalDownloads = document.getElementById('totalDownloads');
        const totalCategories = document.getElementById('totalCategories');

        if (totalApps) totalApps.textContent = this.formatNumber(stats.totalApps);
        if (totalDownloads) totalDownloads.textContent = this.formatNumber(stats.totalDownloads);
        if (totalCategories) totalCategories.textContent = this.formatNumber(stats.totalCategories);
    }

    // Setup smooth scrolling
    setupSmoothScrolling() {
        // Already handled in event listeners
    }

    // Handle smooth scroll for navigation links
    handleSmoothScroll(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    // Setup animations
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        // Observe all elements with fade-in-up class
        document.querySelectorAll('.fade-in-up').forEach(el => {
            observer.observe(el);
        });
    }

    // Trigger animations for dynamically added content
    triggerAnimations() {
        setTimeout(() => {
            document.querySelectorAll('.fade-in-up:not(.animate)').forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('animate');
                }, index * 100);
            });
        }, 100);
    }

    // Handle scroll events
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }

    // Handle resize events
    handleResize() {
        // Adjust layout for mobile devices
        this.adjustMobileLayout();
    }

    // Adjust layout for mobile devices
    adjustMobileLayout() {
        const isMobile = window.innerWidth < 768;
        const cards = document.querySelectorAll('.download-card, .category-card');
        
        cards.forEach(card => {
            if (isMobile) {
                card.classList.add('mobile-optimized');
            } else {
                card.classList.remove('mobile-optimized');
            }
        });
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Hier';
        } else if (diffDays < 7) {
            return `Il y a ${diffDays} jours`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Search suggestions (future enhancement)
    getSearchSuggestions(query) {
        const downloads = window.dataStorage.getDownloads();
        const suggestions = [];
        
        downloads.forEach(download => {
            if (download.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push(download.name);
            }
        });
        
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    // Get popular downloads
    getPopularDownloads(limit = 6) {
        const downloads = window.dataStorage.getDownloads();
        return downloads
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, limit);
    }

    // Get recent downloads
    getRecentDownloads(limit = 6) {
        const downloads = window.dataStorage.getDownloads();
        return downloads
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, limit);
    }

    // Export user data (for GDPR compliance)
    exportUserData() {
        const data = {
            searchHistory: [], // Would track user searches
            downloadHistory: [], // Would track user downloads
            preferences: {
                theme: 'light',
                language: 'fr'
            },
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'download-hub-user-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Setup auto-refresh to ensure all visitors see new files
    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.refreshData();
        }, 30000);
        
        // Also refresh when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshData();
            }
        });
    }

    // Refresh data to show new files added by admin
    refreshData() {
        const currentDownloadsCount = window.dataStorage.getDownloads().length;
        const currentCategoriesCount = window.dataStorage.getCategories().length;
        
        // Update category counts
        window.dataStorage.updateCategoryCounts();
        
        // Check if new downloads or categories were added
        const newDownloadsCount = window.dataStorage.getDownloads().length;
        const newCategoriesCount = window.dataStorage.getCategories().length;
        
        if (newDownloadsCount !== currentDownloadsCount || newCategoriesCount !== currentCategoriesCount) {
            // Refresh the display
            this.loadCategories();
            this.filterAndDisplayDownloads();
            this.loadStats();
            
            // Show notification if new content is available
            if (newDownloadsCount > currentDownloadsCount) {
                this.showNotification('Nouvelles applications disponibles !', 'info');
            }
        }
    }

    // Force refresh data (can be called manually)
    forceRefresh() {
        this.loadCategories();
        this.loadDownloads();
        this.loadStats();
        this.showNotification('Données actualisées !', 'success');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.downloadHub = new DownloadHub();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .fade-in-up {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .fade-in-up.animate {
        opacity: 1;
        transform: translateY(0);
    }
    
    .navbar.scrolled {
        background-color: rgba(0, 123, 255, 0.95) !important;
        backdrop-filter: blur(10px);
    }
    
    .mobile-optimized {
        margin-bottom: 1rem;
    }
    
    .notification-toast {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
        border-radius: 8px;
    }
`;
document.head.appendChild(style);
