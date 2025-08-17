// ===== MAIN APPLICATION LOGIC (VERSION FINALE RENFORCÉE) =====

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
        await this.loadDownloads();
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
        document.getElementById('sortBy').addEventListener('change', (e) => this.handleSort(e.target.value));
    }

    async loadCategories() {
        const categories = await window.dataStorage.getCategories();
        const categoriesContainer = document.getElementById('categoriesContainer');
        
        if (categoriesContainer && Array.isArray(categories)) {
            categoriesContainer.innerHTML = '';
            categories.forEach(category => {
                categoriesContainer.appendChild(this.createCategoryCard(category));
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
            downloadsContainer.innerHTML = '';
            if (downloadsData.length > 0) {
                downloadsData.forEach((download, index) => {
                    downloadsContainer.appendChild(this.createDownloadCard(download, index));
                });
            } else {
                downloadsContainer.innerHTML = `<div class="col-12 text-center"><p>Aucun téléchargement trouvé.</p></div>`;
            }
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
        this.showSectionLoader('downloadsContainer');
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
                instructionsHtml = `
                    <hr>
                    <h6><i class="fas fa-info-circle me-2"></i>Instructions :</h6>
                    <p class="small bg-light p-2 rounded download-instructions">${p.innerHTML.replace(/\n/g, '<br>')}</p>
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
