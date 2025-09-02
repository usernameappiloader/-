// ===== MAIN APPLICATION LOGIC (VERSION FINALE RENFORCÉE ET OPTIMISÉE) =====

class DownloadHub {
    constructor() {
        this.allDownloads = []; // Stocke tous les téléchargements pour un filtrage rapide
        this.filteredDownloads = []; // Stocke les téléchargements filtrés pour la pagination
        this.currentCategory = '';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.init();

        // Bind the share handler to this instance
        this.handleShare = this.handleShare.bind(this);
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800); // 0.8s, correspond à la transition CSS
        }
    }

    async loadInitialData() {
        this.showSectionLoader('categoriesContainer');
        await this.loadCategories();
        
        this.showSectionLoader('downloadsContainer');
        // On charge les données une seule fois pour des performances optimales
        this.allDownloads = await window.dataStorage.getDownloads();
        this.filterAndDisplayDownloads(); // Affiche la liste initiale
        
        await this.loadStats();
    }
    
    showSectionLoader(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="col-12 loader-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                </div>
            `;
        }
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        
        const sortBySelect = document.getElementById('sortBy');
        if (sortBySelect) {
            sortBySelect.innerHTML = `
                <option value="name">Trier par nom (A-Z)</option>
                <option value="downloads">Trier par popularité</option>
                <option value="date">Trier par date d'ajout</option>
            `;
            sortBySelect.addEventListener('change', (e) => this.handleSort(e.target.value));
        }
    }

    async loadCategories() {
        const categories = await window.dataStorage.getCategories();
        const categoriesContainer = document.getElementById('categoriesContainer');
        const categoryFilter = document.getElementById('categoryFilter'); // On récupère le menu déroulant
        
        // On peuple les cartes de catégories
        if (categoriesContainer && Array.isArray(categories)) {
            categoriesContainer.innerHTML = '';
            categories.forEach(category => {
                categoriesContainer.appendChild(this.createCategoryCard(category));
            });
        }

        // CORRIGÉ : On peuple le menu déroulant du filtre
        if (categoryFilter && Array.isArray(categories)) {
            categoryFilter.innerHTML = '<option value="">Filtrer par catégorie</option>'; // Option par défaut
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
    }
    
    createCategoryCard(category) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="category-card" data-category-id="${category.id}">
                <i class="${category.icon || 'fas fa-folder'}"></i>
                <h5>${category.name}</h5>
                <p>${category.description}</p>
            </div>
        `;
        col.querySelector('.category-card').addEventListener('click', () => {
            this.handleCategoryFilter(category.id);
            document.getElementById('downloads').scrollIntoView({ behavior: 'smooth' });
        });
        return col;
    }

    handleShare(downloadId) {
        const download = this.allDownloads.find(d => d.id === downloadId);
        if (!download) {
            console.warn(`Download with id ${downloadId} not found for sharing.`);
            return;
        }

        const shareData = {
            title: download.name,
            text: download.description,
            url: window.location.href + `#download-${downloadId}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch((error) => {
                console.error('Error sharing:', error);
            });
        } else {
            // Fallback: open share URLs in new windows
            const encodedUrl = encodeURIComponent(shareData.url);
            const encodedText = encodeURIComponent(shareData.text);
            const encodedTitle = encodeURIComponent(shareData.title);

            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
            const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

            // Open a small popup window with share options
            const shareWindow = window.open('', 'Share', 'width=600,height=400');
            if (shareWindow) {
                shareWindow.document.write(`
                    <html><head><title>Partager</title></head><body>
                    <h3>Partager "${download.name}"</h3>
                    <ul>
                        <li><a href="${facebookUrl}" target="_blank">Facebook</a></li>
                        <li><a href="${twitterUrl}" target="_blank">Twitter</a></li>
                        <li><a href="${whatsappUrl}" target="_blank">WhatsApp</a></li>
                        <li><a href="${linkedInUrl}" target="_blank">LinkedIn</a></li>
                    </ul>
                    </body></html>
                `);
                shareWindow.document.close();
            } else {
                alert('Veuillez autoriser les popups pour partager ce contenu.');
            }
        }
    }

    // Cette fonction ne fait plus que l'affichage, la rendant plus simple
    loadDownloads(downloads) {
        const downloadsContainer = document.getElementById('downloadsContainer');

        if (downloadsContainer) {
            downloadsContainer.innerHTML = '';
            if (downloads.length > 0) {
                downloads.forEach((download, index) => {
                    downloadsContainer.appendChild(this.createDownloadCard(download, index));
                });
            } else {
                downloadsContainer.innerHTML = `<div class="col-12 text-center"><p>Aucun téléchargement correspondant à vos critères.</p></div>`;
            }
        }
    }

    createDownloadCard(download, index) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        const imageHtml = download.image ? `<img src="${download.image}" alt="${download.name}" loading="lazy">` : `<div class="download-card-image-placeholder"><i class="fas fa-image"></i></div>`;
        const isFavorite = window.uiEnhancements ? window.uiEnhancements.isFavorite(download.id) : false;
        const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';

        col.innerHTML = `
            <div class="download-card" style="animation-delay: ${index * 0.1}s">
                <div class="download-card-image">${imageHtml}</div>
                <div class="download-card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="download-card-title">${download.name}</h5>
                        <button class="btn btn-sm favorite-btn ${isFavorite ? 'active' : ''}"
                                data-download-id="${download.id}"
                                onclick="window.uiEnhancements.toggleFavorite('${download.id}')"
                                title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="${favoriteIcon}"></i>
                        </button>
                    </div>
                    <p class="download-card-description">${download.description}</p>
                    <div class="download-card-meta">
                        <span><i class="fas fa-tag me-1"></i>${download.category}</span>
                        <span><i class="fas fa-download me-1"></i>${this.formatNumber(download.downloads || 0)}</span>
                    </div>
                    <div class="download-card-footer">
                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>${this.formatDate(download.dateAdded)}</small>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm share-btn" onclick="window.downloadHub.handleShare('${download.id}')" title="Partager">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button class="btn download-btn" onclick="window.downloadHub.handleDownload('${download.id}')">Télécharger</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return col;
    }

    // Cette fonction est maintenant beaucoup plus rapide car elle ne recharge pas les données
    filterAndDisplayDownloads() {
        this.showSectionLoader('downloadsContainer');

        let filteredDownloads = [...this.allDownloads]; // On travaille sur une copie

        if (this.searchQuery) {
            filteredDownloads = filteredDownloads.filter(d => d.name.toLowerCase().includes(this.searchQuery) || d.description.toLowerCase().includes(this.searchQuery));
        }
        if (this.currentCategory) {
            filteredDownloads = filteredDownloads.filter(d => String(d.categoryId) === String(this.currentCategory));
        }

        filteredDownloads = this.sortDownloads(filteredDownloads, this.currentSort);
        this.filteredDownloads = filteredDownloads; // Stocke pour la pagination

    // Reset to page 1 when filtering
    // Removed resetting currentPage here to fix pagination issue
    // if (window.uiEnhancements) {
    //     window.uiEnhancements.currentPage = 1;
    // }

        this.loadDownloadsWithPagination(filteredDownloads);
    }

    loadDownloadsWithPagination(downloads) {
        if (window.uiEnhancements) {
            const paginatedDownloads = window.uiEnhancements.getPaginatedItems(downloads);
            window.uiEnhancements.updatePagination(downloads.length);
            this.loadDownloads(paginatedDownloads);
            console.log(`Pagination: Showing ${paginatedDownloads.length} of ${downloads.length} downloads on page ${window.uiEnhancements.currentPage}`);
        } else {
            this.loadDownloads(downloads);
        }
    }

    handleSearch(query) { 
        this.searchQuery = query.toLowerCase().trim(); 
        if(window.uiEnhancements) window.uiEnhancements.currentPage = 1; 
        this.filterAndDisplayDownloads(); 
    }
    handleSort(sortBy) { 
        this.currentSort = sortBy; 
        if(window.uiEnhancements) window.uiEnhancements.currentPage = 1; 
        this.filterAndDisplayDownloads(); 
    }
    handleCategoryFilter(categoryId) {
        this.currentCategory = categoryId;
        document.getElementById('categoryFilter').value = categoryId;
        if(window.uiEnhancements) window.uiEnhancements.currentPage = 1; 
        this.filterAndDisplayDownloads();
    }
    
    sortDownloads(downloads, sortBy) {
        switch (sortBy) {
            case 'name': return downloads.sort((a, b) => a.name.localeCompare(b.name));
            case 'downloads': return downloads.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            case 'date': return downloads.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            default: return downloads;
        }
    }

    async handleDownload(downloadId) {
        const modal = new bootstrap.Modal(document.getElementById('downloadModal'));
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('downloadModalTitle');

        modalTitle.textContent = "Chargement...";
        modalBody.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div>';
        modalBody.classList.add('loading');
        modal.show();

        const download = await window.dataStorage.getDownloadById(downloadId);
        
        modalBody.classList.remove('loading');

        if (download) {
            const fileName = `${download.name.replace(/\s+/g, '-')}-${download.version || 'file'}.zip`;
            
            let instructionsHtml = '';
            if (download.instructions) {
                const p = document.createElement('p');
                p.innerText = download.instructions;
                // MODIFICATION: Utilisation de la classe 'download-instructions' pour la compatibilité avec le thème sombre.
                instructionsHtml = `
                    <hr>
                    <h6><i class="fas fa-info-circle me-2"></i>Instructions :</h6>
                    <div class="download-instructions">${p.innerHTML.replace(/\n/g, '<br>')}</div>
                `;
            }

            modalTitle.textContent = download.name;
            modalBody.innerHTML = `
                <p>${download.description}</p>
                ${instructionsHtml} 
                <hr>
                <p class="small text-muted">Fichier : ${fileName}</p>
                <div id="download-status" class="mt-2"></div>
            `;
    
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadStatus = document.getElementById('download-status');
    
            const newDownloadBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
            
            newDownloadBtn.addEventListener('click', async (e) => {
                e.preventDefault(); 
    
                newDownloadBtn.disabled = true;
                newDownloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Préparation...';
                downloadStatus.innerHTML = '<span class="text-info">Tentative de téléchargement direct...</span>';
    
                try {
                    const response = await fetch(download.url);
                    if (!response.ok) throw new Error('Téléchargement direct impossible');
    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
    
                    this.trackDownload(download.id);
                    downloadStatus.innerHTML = '<span class="text-success">Téléchargement démarré !</span>';
                
                } catch (error) {
                    console.error('Erreur de téléchargement direct, redirection:', error);
                    downloadStatus.innerHTML = `<span class="text-warning">Redirection vers la page de téléchargement...</span>`;
                    window.open(download.url, '_blank');
                    this.trackDownload(download.id);
                } finally {
                     newDownloadBtn.disabled = false;
                     newDownloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>Télécharger';
                }
            });
        } else {
            modalTitle.textContent = "Erreur";
            modalBody.innerHTML = "<p>Détails du téléchargement introuvables.</p>";
        }
    }

    async trackDownload(downloadId) {
        await window.dataStorage.addActivity('download', `Téléchargement de ${downloadId}`);
    }

    async loadStats() {
        const stats = await window.dataStorage.getStats();
        if (stats) {
            document.getElementById('totalApps').textContent = this.formatNumber(stats.totalApps);
            document.getElementById('totalDownloads').textContent = this.formatNumber(stats.totalDownloads);
            document.getElementById('totalCategories').textContent = this.formatNumber(stats.totalCategories);
        }
    }

    formatNumber(num) { return String(num || 0); }
    formatDate(dateString) { return new Date(dateString).toLocaleDateString('fr-FR'); }
}


// Wait for both DOMContentLoaded and UIEnhancements to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if UIEnhancements is already initialized
    if (window.uiEnhancements) {
        initializeDownloadHub();
    } else {
        // Wait for UIEnhancements to be initialized with timeout
        let attempts = 0;
        const maxAttempts = 500; // 5 seconds max wait

        const checkUIEnhancements = setInterval(() => {
            attempts++;
            if (window.uiEnhancements) {
                clearInterval(checkUIEnhancements);
                initializeDownloadHub();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkUIEnhancements);
                console.warn('UIEnhancements not found after timeout, initializing DownloadHub without pagination');
                initializeDownloadHub();
            }
        }, 10); // Check every 10ms
    }
});

function initializeDownloadHub() {
    window.downloadHub = new DownloadHub();

    const lastSeen = localStorage.getItem('welcomeModalLastSeen');
    if (!lastSeen || (new Date().getTime() - lastSeen > 24 * 60 * 60 * 1000)) {
        const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        const confirmBtn = document.getElementById('confirmWelcomeBtn');
        let countdown = 3;

        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                confirmBtn.textContent = `Veuillez patienter ${countdown}s...`;
            } else {
                clearInterval(interval);
                confirmBtn.disabled = false;
                confirmBtn.textContent = "J'ai compris !";
            }
        }, 1000);

        confirmBtn.addEventListener('click', () => {
            localStorage.setItem('welcomeModalLastSeen', new Date().getTime());
            welcomeModal.hide();
        });

        welcomeModal.show();
    }
}
