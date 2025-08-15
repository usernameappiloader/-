// ===== ADMIN PANEL MANAGEMENT =====

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    // Initialize admin panel
    async init() { // Ajout de async
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadDashboard(); // Ajout de await
        this.setupFileUpload();
    }

     checkAuthentication() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        const user = window.authManager.getCurrentUser();
        if (user) {
            const adminEmailElement = document.getElementById('adminEmail');
            if (adminEmailElement) {
                adminEmailElement.textContent = user.email;
            }
        }
    }


    // Setup event listeners
    setupEventListeners() {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        document.getElementById('addDownloadForm').addEventListener('submit', (e) => this.handleAddDownload(e));
        document.getElementById('editDownloadForm').addEventListener('submit', (e) => this.handleEditDownload(e));
        document.getElementById('addCategoryForm').addEventListener('submit', (e) => this.handleAddCategory(e));
        
        document.getElementById('addDownloadModal').addEventListener('show.bs.modal', () => this.populateCategoriesSelect());
        document.getElementById('editDownloadModal').addEventListener('show.bs.modal', () => this.populateCategoriesSelect());
    }

    handleNavigation(e) {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        if (section) {
            this.showSection(section);
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;
        this.loadSectionData(sectionName);
    }

    // Load data for specific section
    async loadSectionData(section) { // Ajout de async
        switch (section) {
            case 'dashboard':
                await this.loadDashboard(); // Ajout de await
                break;
            case 'downloads':
                await this.loadDownloadsManagement(); // Ajout de await
                break;
            case 'categories':
                await this.loadCategoriesManagement(); // Ajout de await
                break;
            case 'statistics':
                await this.loadStatistics(); // Ajout de await
                break;
        }
    }

    // Load dashboard data
    async loadDashboard() { // Ajout de async
        const stats = await window.dataStorage.getStats(); // Ajout de await
        if (stats) {
            document.getElementById('dashTotalApps').textContent = stats.totalApps;
            document.getElementById('dashTotalDownloads').textContent = this.formatNumber(stats.totalDownloads);
            document.getElementById('dashTotalCategories').textContent = stats.totalCategories;
            document.getElementById('dashTodayDownloads').textContent = stats.todayDownloads;
        }
        await this.loadRecentActivity(); // Ajout de await
    }

    // Load recent activity
    async loadRecentActivity() { // Ajout de async
        const activities = await window.dataStorage.getRecentActivity(); // Ajout de await
        const container = document.getElementById('recentActivity');
        
        if (container && Array.isArray(activities)) {
            container.innerHTML = '';
            if (activities.length === 0) {
                container.innerHTML = '<p class="text-muted">Aucune activité récente</p>';
                return;
            }
            activities.slice(0, 10).forEach(activity => {
                container.appendChild(this.createActivityElement(activity));
            });
        }
    }
    
    createActivityElement(activity) {
        const div = document.createElement('div');
        div.className = 'activity-item d-flex align-items-center p-2 border-bottom';
        
        const iconClass = activity.type === 'download' ? 'success' : 
                         activity.type === 'upload' ? 'primary' : 
                         activity.type === 'update' ? 'warning' : 'danger';
        
        const iconName = activity.type === 'download' ? 'download' : 
                        activity.type === 'upload' ? 'plus' : 
                        activity.type === 'update' ? 'edit' : 'trash';
        
        div.innerHTML = `
            <div class="activity-icon me-3">
                <i class="fas fa-${iconName} text-${iconClass}"></i>
            </div>
            <div class="activity-content flex-grow-1">
                <h6 class="mb-1">${activity.message}</h6>
                <small class="text-muted">
                    ${activity.userInfo ? `IP: ${activity.userInfo.ip} | ${activity.userInfo.platform}` : 'Système'}
                </small>
            </div>
            <div class="activity-time text-end">
                <small class="text-muted">${this.formatTimeAgo(activity.time)}</small>
            </div>
        `;
        
        return div;
    }

    // Load downloads management
     async loadDownloadsManagement() { // Ajout de async
        const downloads = await window.dataStorage.getDownloads(); // Ajout de await
        const tableBody = document.getElementById('downloadsTable');
        
        if (tableBody && Array.isArray(downloads)) {
            tableBody.innerHTML = '';
            downloads.forEach(download => {
                tableBody.appendChild(this.createDownloadRow(download));
            });
        }
        await this.populateCategoriesSelect(); // Ajout de await
    }
    // Create download table row
     createDownloadRow(download) {
        const tr = document.createElement('tr');
        
        const imageHtml = download.image ? 
            `<img src="${download.image}" alt="${download.name}" class="download-image">` :
            `<div class="download-image-placeholder"><i class="fas fa-image"></i></div>`;
        
        tr.innerHTML = `
            <td>${imageHtml}</td>
            <td>
                <strong>${download.name}</strong><br>
                <small class="text-muted">v${download.version}</small>
            </td>
            <td><span class="badge bg-primary">${download.category}</span></td>
            <td>${this.formatNumber(download.downloads)}</td>
            <td>${this.formatDate(download.dateAdded)}</td>
            <td>
                <button class="btn btn-edit btn-action" onclick="adminPanel.editDownload(${download.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete btn-action" onclick="adminPanel.deleteDownload(${download.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return tr;
    }

    // Load categories management
    // Load categories management
    async loadCategoriesManagement() { // Ajout de async
        const categories = await window.dataStorage.getCategories(); // Ajout de await
        const container = document.getElementById('categoriesGrid');
        
        if (container && Array.isArray(categories)) {
            container.innerHTML = '';
            categories.forEach(category => {
                container.appendChild(this.createCategoryManagementCard(category));
            });
        }
    }

    // Create category management card
    createCategoryManagementCard(category) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        
        col.innerHTML = `
            <div class="category-grid-item">
                <div class="category-actions">
                    <button class="btn btn-edit btn-sm" onclick="adminPanel.editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete btn-sm" onclick="adminPanel.deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <i class="${category.icon}"></i>
                <h5>${category.name}</h5>
                <p>${category.description}</p>
                <div class="mt-3">
                    <span class="badge bg-primary">${category.count} application${category.count !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;
        
        return col;
    }

    // Load statistics
    loadStatistics() {
        const downloads = window.dataStorage.getDownloads();
        const categories = window.dataStorage.getCategories();
        
        // Top downloads
        const topDownloads = downloads
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 10);
        
        this.displayTopDownloads(topDownloads);
        this.displayCategoryStats(categories, downloads);
    }

    // Display top downloads
    displayTopDownloads(topDownloads) {
        const container = document.getElementById('topDownloads');
        if (container) {
            container.innerHTML = '';
            
            topDownloads.forEach((download, index) => {
                const item = document.createElement('div');
                item.className = 'stats-item';
                item.innerHTML = `
                    <div class="stats-item-info">
                        <h6>${download.name}</h6>
                        <p>${download.category}</p>
                    </div>
                    <div class="stats-item-value">${this.formatNumber(download.downloads)}</div>
                `;
                container.appendChild(item);
            });
        }
    }

    // Display category statistics
    displayCategoryStats(categories, downloads) {
        const container = document.getElementById('categoryStats');
        if (container) {
            container.innerHTML = '';
            
            categories.forEach(category => {
                const categoryDownloads = downloads.filter(d => d.categoryId === category.id);
                const totalDownloads = categoryDownloads.reduce((sum, d) => sum + d.downloads, 0);
                
                const item = document.createElement('div');
                item.className = 'stats-item';
                item.innerHTML = `
                    <div class="stats-item-info">
                        <h6><i class="${category.icon} me-2"></i>${category.name}</h6>
                        <p>${category.count} applications</p>
                    </div>
                    <div class="stats-item-value">${this.formatNumber(totalDownloads)}</div>
                `;
                container.appendChild(item);
            });
        }
    }

     async populateCategoriesSelect() { // Ajout de async
        const categories = await window.dataStorage.getCategories(); // Ajout de await
        const selects = document.querySelectorAll('select[data-populate="categories"]');
        
        if (Array.isArray(categories)) {
            selects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="" disabled>Choisir une catégorie</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
                if(currentValue) select.value = currentValue;
            });
        }
    }

    // Load category options for dropdowns
    loadCategoryOptions() {
        const categories = window.dataStorage.getCategories();
        const selects = ['downloadCategory', 'editDownloadCategory'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Sélectionner une catégorie</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        });
    }

    // Handle add download form submission
    // Ajout de téléchargement avec image et Firestore
async handleAddDownload(e) {
        e.preventDefault();

    // Récupération des valeurs du formulaire
    const name = document.getElementById('downloadName').value.trim();
    const categoryId = document.getElementById('downloadCategory').value;
    const description = document.getElementById('downloadDescription').value.trim();
    const url = document.getElementById('downloadUrl').value.trim();
    const version = document.getElementById('downloadVersion').value.trim();
    const size = document.getElementById('downloadSize').value.trim();
    const instructions = document.getElementById('downloadInstructions').value.trim();
    const file = document.getElementById('downloadImage').files[0];

    // Vérification des champs obligatoires
    if (!name || !categoryId || !description || !url || !file) {
        this.showAlert("Veuillez remplir tous les champs obligatoires et choisir une image.", "danger");
        return;
    }

    try {
            // La logique existante est conservée...
            const downloadData = {
                name: document.getElementById('downloadName').value.trim(),
                categoryId: document.getElementById('downloadCategory').value,
                description: document.getElementById('downloadDescription').value.trim(),
                url: document.getElementById('downloadUrl').value.trim(),
                version: document.getElementById('downloadVersion').value.trim(),
                size: document.getElementById('downloadSize').value.trim(),
                instructions: document.getElementById('downloadInstructions').value.trim(),
                image: document.getElementById('downloadImage').files[0], // Le fichier brut
                downloads: 0,
                dateAdded: new Date().toISOString()
            };
            
            if (!downloadData.name || !downloadData.categoryId || !downloadData.url) {
                this.showAlert("Veuillez remplir tous les champs obligatoires.", "danger");
                return;
            }

            const newDownload = await window.dataStorage.addDownload(downloadData);

            if (newDownload) {
                this.showAlert("Téléchargement ajouté avec succès !", "success");
                this.closeModal("addDownloadModal");
                e.target.reset();
                this.loadDownloadsManagement();
                this.loadDashboard();
            } else {
                throw new Error("L'ajout à la base de données a échoué.");
            }

        } catch (error) {
            console.error("Erreur lors de l'ajout :", error);
            this.showAlert(`Erreur : ${error.message}`, "danger");
        }
    }

    // Handle edit download
    editDownload(id) {
        const download = window.dataStorage.getDownloadById(id);
        if (download) {
            // Populate edit form
            document.getElementById('editDownloadId').value = download.id;
            document.getElementById('editDownloadName').value = download.name;
            document.getElementById('editDownloadCategory').value = download.categoryId;
            document.getElementById('editDownloadDescription').value = download.description;
            document.getElementById('editDownloadUrl').value = download.url;
            document.getElementById('editDownloadVersion').value = download.version;
            document.getElementById('editDownloadSize').value = download.size;
            document.getElementById('editDownloadInstructions').value = download.instructions || '';
            
            // Show edit modal
            const modal = new bootstrap.Modal(document.getElementById('editDownloadModal'));
            modal.show();
        }
    }

    // Handle edit download form submission
     async handleEditDownload(e) {
        e.preventDefault();
        
        const id = document.getElementById('editDownloadId').value;
        const imageFile = document.getElementById('editDownloadImage').files[0];

        const downloadData = {
            name: document.getElementById('editDownloadName').value,
            categoryId: document.getElementById('editDownloadCategory').value,
            description: document.getElementById('editDownloadDescription').value,
            url: document.getElementById('editDownloadUrl').value,
            version: document.getElementById('editDownloadVersion').value,
            size: document.getElementById('editDownloadSize').value,
            instructions: document.getElementById('editDownloadInstructions').value,
        };

        // Ajoute la nouvelle image seulement si une a été sélectionnée
        if (imageFile) {
            downloadData.image = imageFile;
        }

        try {
            const updatedDownload = await window.dataStorage.updateDownload(id, downloadData);
            if (updatedDownload) {
                this.showAlert('Téléchargement mis à jour avec succès !', 'success');
                this.closeModal('editDownloadModal');
                this.loadDownloadsManagement();
            } else {
                throw new Error("La mise à jour a échoué.");
            }
        } catch(error) {
            this.showAlert(`Erreur lors de la mise à jour : ${error.message}`, 'danger');
        }
    }
    // Delete download
    deleteDownload(id) {
        const download = window.dataStorage.getDownloadById(id);
        if (download && confirm(`Êtes-vous sûr de vouloir supprimer "${download.name}" ?`)) {
            if (window.dataStorage.deleteDownload(id)) {
                this.showAlert('Téléchargement supprimé avec succès !', 'success');
                this.loadDownloadsManagement();
                this.loadDashboard(); // Update stats
            } else {
                this.showAlert('Erreur lors de la suppression du téléchargement.', 'danger');
            }
        }
    }

    // Handle add category form submission
    handleAddCategory(e) {
        e.preventDefault();
        
        const categoryData = {
            name: document.getElementById('categoryName').value,
            icon: document.getElementById('categoryIcon').value || 'fas fa-folder',
            description: document.getElementById('categoryDescription').value
        };
        
        // Validate required fields
        if (!categoryData.name) {
            this.showAlert('Veuillez entrer un nom pour la catégorie.', 'danger');
            return;
        }
        
        // Add category
        const newCategory = window.dataStorage.addCategory(categoryData);
        if (newCategory) {
            this.showAlert('Catégorie ajoutée avec succès !', 'success');
            this.closeModal('addCategoryModal');
            this.loadCategoriesManagement();
            this.loadCategoryOptions(); // Update dropdowns
            e.target.reset();
        } else {
            this.showAlert('Erreur lors de l\'ajout de la catégorie.', 'danger');
        }
    }

    // Edit category
    editCategory(id) {
        const category = window.dataStorage.getCategoryById(id);
        if (category) {
            const newName = prompt('Nouveau nom de la catégorie:', category.name);
            if (newName && newName.trim()) {
                const updatedCategory = window.dataStorage.updateCategory(id, { name: newName.trim() });
                if (updatedCategory) {
                    this.showAlert('Catégorie mise à jour avec succès !', 'success');
                    this.loadCategoriesManagement();
                    this.loadCategoryOptions();
                }
            }
        }
    }

    // Delete category
    deleteCategory(id) {
        const category = window.dataStorage.getCategoryById(id);
        if (category && confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Tous les téléchargements de cette catégorie seront également supprimés.`)) {
            if (window.dataStorage.deleteCategory(id)) {
                this.showAlert('Catégorie supprimée avec succès !', 'success');
                this.loadCategoriesManagement();
                this.loadDownloadsManagement(); // Refresh downloads
                this.loadCategoryOptions(); // Update dropdowns
                this.loadDashboard(); // Update stats
            } else {
                this.showAlert('Erreur lors de la suppression de la catégorie.', 'danger');
            }
        }
    }

    // Handle image upload
    handleImageUpload(e, previewType) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showAlert('Veuillez sélectionner un fichier image valide.', 'danger');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showAlert('La taille du fichier ne doit pas dépasser 5MB.', 'danger');
                return;
            }
            
            // Read file as data URL
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                if (previewType === 'preview') {
                    this.currentImageData = imageData;
                } else if (previewType === 'editPreview') {
                    this.currentEditImageData = imageData;
                }
                
                // Show preview (optional enhancement)
                this.showImagePreview(imageData, previewType);
            };
            reader.readAsDataURL(file);
        }
    }

    // Show image preview
    showImagePreview(imageData, previewType) {
        // This could be enhanced to show a preview of the uploaded image
        console.log('Image uploaded for', previewType);
    }

    // Setup file upload drag and drop
    setupFileUpload() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            const parent = input.closest('.mb-3');
            if (parent) {
                parent.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    parent.classList.add('dragover');
                });
                
                parent.addEventListener('dragleave', () => {
                    parent.classList.remove('dragover');
                });
                
                parent.addEventListener('drop', (e) => {
                    e.preventDefault();
                    parent.classList.remove('dragover');
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        input.files = files;
                        input.dispatchEvent(new Event('change'));
                    }
                });
            }
        });
    }

    // Remplit tous les <select data-populate="categories"> avec les vraies catégories
    populateCategoriesSelect() {
        const categories = window.dataStorage.getCategories();
        const selects = document.querySelectorAll('select[data-populate="categories"]');
        selects.forEach(select => {
            // Sauvegarde la valeur sélectionnée si elle existe
            const currentValue = select.value;
            select.innerHTML = '<option value="" disabled selected>Choisir une catégorie</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
            // Restaure la valeur sélectionnée si possible
            if (currentValue) select.value = currentValue;
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
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) {
            return `Il y a ${diffMinutes} min`;
        } else if (diffHours < 24) {
            return `Il y a ${diffHours}h`;
        } else {
            return `Il y a ${diffDays}j`;
        }
    }

    // Show alert message
    showAlert(message, type) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to page
        const container = document.querySelector('.content-section:not(.d-none)');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }

    // Export data
    exportData() {
        const data = window.dataStorage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `download-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Import data
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const success = window.dataStorage.importData(event.target.result);
                        if (success) {
                            this.showAlert('Données importées avec succès !', 'success');
                            this.loadSectionData(this.currentSection);
                        } else {
                            this.showAlert('Erreur lors de l\'importation des données.', 'danger');
                        }
                    } catch (error) {
                        this.showAlert('Fichier invalide.', 'danger');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
