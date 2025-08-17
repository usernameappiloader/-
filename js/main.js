// ===== MAIN APPLICATION LOGIC (VERSION FINALE CORRIGÉE ET AMÉLIORÉE) =====

class DownloadHub {
    constructor() {
        this.currentCategory = '';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
    }

    async loadInitialData() {
        await this.loadCategories();
        await this.loadDownloads();
        await this.loadStats();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        document.getElementById('sortBy').addEventListener('change', (e) => this.handleSort(e.target.value));
    }

    async loadCategories() {
        const categories = await window.dataStorage.getCategories();
        const categoriesContainer = document.getElementById('categoriesContainer');
        const categoryFilter = document.getElementById('categoryFilter');

        if (categoriesContainer && Array.isArray(categories)) {
            categoriesContainer.innerHTML = '';
            categories.forEach(category => {
                categoriesContainer.appendChild(this.createCategoryCard(category));
            });
        }

        if (categoryFilter && Array.isArray(categories)) {
            categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.name}`;
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

    async loadDownloads(downloads = null) {
        const downloadsData = downloads || await window.dataStorage.getDownloads();
        const downloadsContainer = document.getElementById('downloadsContainer');

        if (downloadsContainer) {
            downloadsContainer.innerHTML = downloadsData.length > 0 ? '' : `<div class="col-12 text-center"><p>Aucun téléchargement trouvé.</p></div>`;
            downloadsData.forEach((download, index) => {
                downloadsContainer.appendChild(this.createDownloadCard(download, index));
            });
        }
    }

  createDownloadCard(download, index) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    const imageHtml = download.image ? `<img src="${download.image}" alt="${download.name}" loading="lazy">` : `<div class="download-card-image-placeholder"><i class="fas fa-image"></i></div>`;

    col.innerHTML = `
        <div class="download-card" style="animation-delay: ${index * 0.1}s">
            <div class="download-card-image">${imageHtml}</div>
            <div class="download-card-body">
                <h5 class="download-card-title">${download.name}</h5>
                <p class="download-card-description">${download.description}</p>
                <div class="download-card-meta">
                    <span><i class="fas fa-tag me-1"></i>${download.category}</span>
                    <span><i class="fas fa-download me-1"></i>${this.formatNumber(download.downloads || 0)}</span>
                </div>
                <div class="download-card-footer">
                    <small class="text-muted"><i class="fas fa-calendar me-1"></i>${this.formatDate(download.dateAdded)}</small>
                    <button class="btn download-btn" onclick="window.downloadHub.handleDownload('${download.id}')">Télécharger</button>
                </div>
            </div>
        </div>
    `;
    return col;
}

    async filterAndDisplayDownloads() {
        let downloads = await window.dataStorage.getDownloads();

        if (this.searchQuery) {
            downloads = downloads.filter(d => d.name.toLowerCase().includes(this.searchQuery) || d.description.toLowerCase().includes(this.searchQuery));
        }
        if (this.currentCategory) {
            downloads = downloads.filter(d => String(d.categoryId) === String(this.currentCategory));
        }
        downloads = this.sortDownloads(downloads, this.currentSort);

        await this.loadDownloads(downloads);
    }

    handleSearch(query) { this.searchQuery = query.toLowerCase().trim(); this.filterAndDisplayDownloads(); }
    handleSort(sortBy) { this.currentSort = sortBy; this.filterAndDisplayDownloads(); }
    handleCategoryFilter(categoryId) {
        this.currentCategory = categoryId;
        document.getElementById('categoryFilter').value = categoryId;
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
        const download = await window.dataStorage.getDownloadById(downloadId);
        if (download) {
            const fileName = `${download.name.replace(/\s+/g, '-')}-${download.version || 'file'}.zip`;
    
            document.getElementById('downloadModalTitle').textContent = download.name;
            document.getElementById('modalBody').innerHTML = `
                <p>${download.description}</p>
                <hr>
                <p class="small text-muted">Fichier : ${fileName}</p>
                <div id="download-status" class="mt-2"></div>
            `;
    
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadStatus = document.getElementById('download-status');
    
            // Remove previous event listeners to avoid multiple triggers
            const newDownloadBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
            
            newDownloadBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default link behavior
    
                newDownloadBtn.disabled = true;
                newDownloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Téléchargement...';
                downloadStatus.textContent = 'Préparation du téléchargement...';
    
                try {
                    const response = await fetch(download.url);
    
                    if (!response.ok) {
                        throw new Error(`Erreur réseau : ${response.statusText}`);
                    }
    
                    downloadStatus.textContent = 'Téléchargement en cours...';
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
    
                    // Track download after successful start
                    this.trackDownload(download.id);
    
                    downloadStatus.innerHTML = '<span class="text-success">Téléchargement démarré !</span>';
                
                } catch (error) {
                    console.error('Erreur de téléchargement:', error);
                    downloadStatus.innerHTML = `<span class="text-danger">Impossible de télécharger directement. Cliquez ici pour ouvrir la page de téléchargement : <a href="${download.url}" target="_blank">Ouvrir le lien</a></span>`;
                } finally {
                     newDownloadBtn.disabled = false;
                     newDownloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>Télécharger';
                }
            });
    
            const modal = new bootstrap.Modal(document.getElementById('downloadModal'));
            modal.show();
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

// L'initialisation se fait APRÈS la définition de la classe
document.addEventListener('DOMContentLoaded', () => {
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
});
