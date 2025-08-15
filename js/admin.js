// ===== ADMIN PANEL MANAGEMENT =====

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    // Initialize admin panel
    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadDashboard();
        this.setupFileUpload();
    this.setupFirebaseImageUpload();
    }
    // Setup Firebase image upload modal
    setupFirebaseImageUpload() {
        const uploadImageForm = document.getElementById('uploadImageForm');
        if (!uploadImageForm) return;
        uploadImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('firebaseImageFile');
            const nameInput = document.getElementById('firebaseImageName');
            const statusDiv = document.getElementById('firebaseImageUploadStatus');
            if (!fileInput.files.length) {
                statusDiv.textContent = 'Veuillez sélectionner une image.';
                return;
            }
            const file = fileInput.files[0];
            const fileName = nameInput.value ? nameInput.value : Date.now() + '_' + file.name;
            statusDiv.textContent = 'Envoi en cours...';
            try {
                const storageRef = firebase.storage().ref('images/' + fileName);
                const snapshot = await storageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                statusDiv.innerHTML = `<span class='text-success'>Image uploadée !</span><br>Lien : <a href='${downloadURL}' target='_blank'>${downloadURL}</a>`;
            } catch (error) {
                statusDiv.innerHTML = `<span class='text-danger'>Erreur : ${error.message}</span>`;
            }
        });
    }

    // Check if user is authenticated
    checkAuthentication() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Display admin email
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
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Add download form
        const addDownloadForm = document.getElementById('addDownloadForm');
        if (addDownloadForm) {
            addDownloadForm.addEventListener('submit', (e) => this.handleAddDownload(e));
        }

        // Edit download form
        const editDownloadForm = document.getElementById('editDownloadForm');
        if (editDownloadForm) {
            editDownloadForm.addEventListener('submit', (e) => this.handleEditDownload(e));
        }

        // Add category form
        const addCategoryForm = document.getElementById('addCategoryForm');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.authManager.logout();
            });
        }

        // File input change events
        const downloadImage = document.getElementById('downloadImage');
        if (downloadImage) {
            downloadImage.addEventListener('change', (e) => this.handleImageUpload(e, 'preview'));
        }

        const editDownloadImage = document.getElementById('editDownloadImage');
        if (editDownloadImage) {
            editDownloadImage.addEventListener('change', (e) => this.handleImageUpload(e, 'editPreview'));
        }
    }

    // Handle sidebar navigation
    handleNavigation(e) {
        e.preventDefault();
        const section = e.target.getAttribute('data-section');
        if (section) {
            this.showSection(section);
        }
    }

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Update active nav link
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Load section data
        this.currentSection = sectionName;
        this.loadSectionData(sectionName);
    }

    // Load data for specific section
    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'downloads':
                this.loadDownloadsManagement();
                break;
            case 'categories':
                this.loadCategoriesManagement();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    }

    // Load dashboard data
    loadDashboard() {
        const stats = window.dataStorage.getStats();
        
        // Update dashboard stats
        document.getElementById('dashTotalApps').textContent = stats.totalApps;
        document.getElementById('dashTotalDownloads').textContent = this.formatNumber(stats.totalDownloads);
        document.getElementById('dashTotalCategories').textContent = stats.totalCategories;
        document.getElementById('dashTodayDownloads').textContent = stats.todayDownloads;

        // Load recent activity
        this.loadRecentActivity();
    }

    // Load recent activity with real data
    loadRecentActivity() {
        const activities = window.dataStorage.getRecentActivity();
        const container = document.getElementById('recentActivity');
        
        if (container) {
            container.innerHTML = '';
            
            if (activities.length === 0) {
                container.innerHTML = '<p class="text-muted">Aucune activité récente</p>';
                return;
            }

            activities.slice(0, 10).forEach(activity => {
                const activityElement = this.createActivityElement(activity);
                container.appendChild(activityElement);
            });

            // Add real-time stats summary
            this.addActivitySummary(activities, container);
        }
    }

    // Add activity summary with real analytics
    addActivitySummary(activities, container) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayActivities = activities.filter(activity => 
            new Date(activity.time) >= today
        );
        
        const downloadCount = todayActivities.filter(a => a.type === 'download').length;
        const uploadCount = todayActivities.filter(a => a.type === 'upload').length;
        const updateCount = todayActivities.filter(a => a.type === 'update').length;
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'activity-summary mt-3 p-3 bg-light rounded';
        summaryDiv.innerHTML = `
            <h6>Résumé d'aujourd'hui</h6>
            <div class="row text-center">
                <div class="col-4">
                    <strong class="text-success">${downloadCount}</strong><br>
                    <small>Téléchargements</small>
                </div>
                <div class="col-4">
                    <strong class="text-primary">${uploadCount}</strong><br>
                    <small>Ajouts</small>
                </div>
                <div class="col-4">
                    <strong class="text-warning">${updateCount}</strong><br>
                    <small>Mises à jour</small>
                </div>
            </div>
        `;
        container.appendChild(summaryDiv);
    }

    // Create activity element with enhanced info
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
    loadDownloadsManagement() {
        const downloads = window.dataStorage.getDownloads();
        const tableBody = document.getElementById('downloadsTable');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            downloads.forEach(download => {
                const row = this.createDownloadRow(download);
                tableBody.appendChild(row);
            });
        }

        // Load categories for dropdowns
        this.loadCategoryOptions();
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
    loadCategoriesManagement() {
        const categories = window.dataStorage.getCategories();
        const container = document.getElementById('categoriesGrid');
        
        if (container) {
            container.innerHTML = '';
            
            categories.forEach(category => {
                const categoryCard = this.createCategoryManagementCard(category);
                container.appendChild(categoryCard);
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
    handleAddDownload(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const downloadData = {
            name: formData.get('name') || document.getElementById('downloadName').value,
            categoryId: document.getElementById('downloadCategory').value,
            description: document.getElementById('downloadDescription').value,
            url: document.getElementById('downloadUrl').value,
            version: document.getElementById('downloadVersion').value,
            size: document.getElementById('downloadSize').value,
            image: this.currentImageData,
            instructions: document.getElementById('downloadInstructions').value
        };
        
        // Validate required fields
        if (!downloadData.name || !downloadData.categoryId || !downloadData.description || !downloadData.url) {
            this.showAlert('Veuillez remplir tous les champs obligatoires.', 'danger');
            return;
        }
        
        // Add download
        const newDownload = window.dataStorage.addDownload(downloadData);
        if (newDownload) {
            this.showAlert('Téléchargement ajouté avec succès !', 'success');
            this.closeModal('addDownloadModal');
            this.loadDownloadsManagement();
            this.loadDashboard(); // Update stats
            e.target.reset();
            this.currentImageData = null;
        } else {
            this.showAlert('Erreur lors de l\'ajout du téléchargement.', 'danger');
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
    handleEditDownload(e) {
        e.preventDefault();
        
        const id = document.getElementById('editDownloadId').value;
        const downloadData = {
            name: document.getElementById('editDownloadName').value,
            categoryId: document.getElementById('editDownloadCategory').value,
            description: document.getElementById('editDownloadDescription').value,
            url: document.getElementById('editDownloadUrl').value,
            version: document.getElementById('editDownloadVersion').value,
            size: document.getElementById('editDownloadSize').value,
            instructions: document.getElementById('editDownloadInstructions').value
        };
        
        // Add new image if uploaded
        if (this.currentEditImageData) {
            downloadData.image = this.currentEditImageData;
        }
        
        // Update download
        const updatedDownload = window.dataStorage.updateDownload(id, downloadData);
        if (updatedDownload) {
            this.showAlert('Téléchargement mis à jour avec succès !', 'success');
            this.closeModal('editDownloadModal');
            this.loadDownloadsManagement();
            this.currentEditImageData = null;
        } else {
            this.showAlert('Erreur lors de la mise à jour du téléchargement.', 'danger');
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
