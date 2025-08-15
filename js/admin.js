// ===== ADMIN PANEL MANAGEMENT (VERSION FINALE CORRIGÉE) =====

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadDashboard();
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

    async showSection(sectionName) {
        // Cacher toutes les sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });
        // Afficher la bonne section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Mettre à jour le lien actif dans la barre latérale
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;
        // Charger les données pour la section affichée
        await this.loadSectionData(sectionName);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard': await this.loadDashboard(); break;
            case 'downloads': await this.loadDownloadsManagement(); break;
            case 'categories': await this.loadCategoriesManagement(); break;
            case 'statistics': await this.loadStatistics(); break;
        }
    }

    async loadDashboard() {
        const stats = await window.dataStorage.getStats();
        if (stats) {
            document.getElementById('dashTotalApps').textContent = stats.totalApps;
            document.getElementById('dashTotalDownloads').textContent = this.formatNumber(stats.totalDownloads);
            document.getElementById('dashTotalCategories').textContent = stats.totalCategories;
            document.getElementById('dashTodayDownloads').textContent = stats.todayDownloads;
        }
        await this.loadRecentActivity();
    }

    async loadRecentActivity() {
        const activities = await window.dataStorage.getRecentActivity();
        const container = document.getElementById('recentActivity');
        if (container && Array.isArray(activities)) {
            container.innerHTML = activities.length > 0 ? '' : '<p class="text-muted">Aucune activité récente.</p>';
            activities.slice(0, 5).forEach(activity => {
                container.innerHTML += `<div class="activity-item">${activity.message} - <small>${this.formatTimeAgo(activity.time)}</small></div>`;
            });
        }
    }

    async loadDownloadsManagement() {
        const downloads = await window.dataStorage.getDownloads();
        const tableBody = document.getElementById('downloadsTable');
        if (tableBody && Array.isArray(downloads)) {
            tableBody.innerHTML = '';
            downloads.forEach(download => {
                tableBody.appendChild(this.createDownloadRow(download));
            });
        }
    }

    // CORRECTION : Passer l'ID comme une chaîne de caractères
    createDownloadRow(download) {
        const tr = document.createElement('tr');
        const imageHtml = download.image ? `<img src="${download.image}" alt="${download.name}" class="download-image">` : `<div class="download-image-placeholder"><i class="fas fa-image"></i></div>`;
        tr.innerHTML = `
            <td>${imageHtml}</td>
            <td><strong>${download.name}</strong><br><small class="text-muted">v${download.version}</small></td>
            <td><span class="badge bg-primary">${download.category}</span></td>
            <td>${this.formatNumber(download.downloads || 0)}</td>
            <td>${this.formatDate(download.dateAdded)}</td>
            <td>
                <button class="btn btn-edit btn-action" onclick="window.adminPanel.editDownload('${download.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-delete btn-action" onclick="window.adminPanel.deleteDownload('${download.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        return tr;
    }

    async loadCategoriesManagement() {
        const categories = await window.dataStorage.getCategories();
        const container = document.getElementById('categoriesGrid');
        if (container && Array.isArray(categories)) {
            container.innerHTML = '';
            categories.forEach(category => {
                container.appendChild(this.createCategoryManagementCard(category));
            });
        }
    }
    
    // CORRECTION : Passer l'ID comme une chaîne de caractères
    createCategoryManagementCard(category) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="category-grid-item">
                <div class="category-actions">
                    <button class="btn btn-delete btn-sm" onclick="window.adminPanel.deleteCategory('${category.id}')"><i class="fas fa-trash"></i></button>
                </div>
                <i class="${category.icon || 'fas fa-folder'}"></i>
                <h5>${category.name}</h5>
                <p>${category.description}</p>
            </div>
        `;
        return col;
    }

    async loadStatistics() {
        // Cette fonction peut être développée plus tard
        console.log("Chargement des statistiques...");
    }

    async populateCategoriesSelect() {
        const categories = await window.dataStorage.getCategories();
        const selects = document.querySelectorAll('select[data-populate="categories"]');
        if (Array.isArray(categories)) {
            selects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="" disabled selected>Choisir une catégorie</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
                if (currentValue) select.value = currentValue;
            });
        }
    }

    async handleAddDownload(e) {
        e.preventDefault();
        const categorySelect = document.getElementById('downloadCategory');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        
        const downloadData = {
            name: document.getElementById('downloadName').value.trim(),
            categoryId: selectedOption.value,
            category: selectedOption.text, // Sauvegarder le nom de la catégorie
            description: document.getElementById('downloadDescription').value.trim(),
            url: document.getElementById('downloadUrl').value.trim(),
            version: document.getElementById('downloadVersion').value.trim(),
            size: document.getElementById('downloadSize').value.trim(),
            image: document.getElementById('downloadImage').files[0],
            downloads: 0,
            dateAdded: new Date().toISOString()
        };
        
        const newDownload = await window.dataStorage.addDownload(downloadData);
        if (newDownload) {
            this.showAlert("Téléchargement ajouté avec succès !", "success");
            this.closeModal("addDownloadModal");
            e.target.reset();
            await this.loadDownloadsManagement();
            await this.loadDashboard();
        }
    }

    async editDownload(id) {
        const download = await window.dataStorage.getDownloadById(id);
        if (download) {
            document.getElementById('editDownloadId').value = download.id;
            document.getElementById('editDownloadName').value = download.name;
            document.getElementById('editDownloadCategory').value = download.categoryId;
            document.getElementById('editDownloadDescription').value = download.description;
            document.getElementById('editDownloadUrl').value = download.url;
            document.getElementById('editDownloadVersion').value = download.version;
            document.getElementById('editDownloadSize').value = download.size;
            
            const modal = new bootstrap.Modal(document.getElementById('editDownloadModal'));
            modal.show();
        }
    }

    async handleEditDownload(e) {
        e.preventDefault();
        const id = document.getElementById('editDownloadId').value;
        const categorySelect = document.getElementById('editDownloadCategory');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];

        const downloadData = {
            name: document.getElementById('editDownloadName').value.trim(),
            categoryId: selectedOption.value,
            category: selectedOption.text,
            description: document.getElementById('editDownloadDescription').value.trim(),
            url: document.getElementById('editDownloadUrl').value.trim(),
            version: document.getElementById('editDownloadVersion').value.trim(),
            size: document.getElementById('editDownloadSize').value.trim(),
        };
        
        const imageFile = document.getElementById('editDownloadImage').files[0];
        if (imageFile) {
            downloadData.image = imageFile;
        }

        await window.dataStorage.updateDownload(id, downloadData);
        this.showAlert('Téléchargement mis à jour avec succès !', 'success');
        this.closeModal('editDownloadModal');
        await this.loadDownloadsManagement();
    }

    async deleteDownload(id) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce téléchargement ?")) {
            await window.dataStorage.deleteDownload(id);
            this.showAlert('Téléchargement supprimé avec succès !', 'success');
            await this.loadDownloadsManagement();
            await this.loadDashboard();
        }
    }

    async handleAddCategory(e) {
        e.preventDefault();
        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            icon: document.getElementById('categoryIcon').value.trim(),
            description: document.getElementById('categoryDescription').value.trim()
        };
        await window.dataStorage.addCategory(categoryData);
        this.showAlert('Catégorie ajoutée avec succès !', 'success');
        this.closeModal('addCategoryModal');
        e.target.reset();
        await this.loadCategoriesManagement();
    }

    async deleteCategory(id) {
        if (confirm("ATTENTION : La suppression de cette catégorie entraînera la suppression de tous les téléchargements associés. Êtes-vous sûr ?")) {
            await window.dataStorage.deleteCategory(id);
            this.showAlert('Catégorie supprimée avec succès !', 'success');
            await this.loadCategoriesManagement();
            await this.loadDownloadsManagement();
            await this.loadDashboard();
        }
    }

    // Fonctions utilitaires
    showAlert(message, type) {
        const alertPlaceholder = document.querySelector('.content-section:not(.d-none)');
        if(alertPlaceholder) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
            alertPlaceholder.prepend(wrapper);
        }
    }
    closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }
    formatNumber(num) { return String(num || 0); }
    formatDate(dateString) { return new Date(dateString).toLocaleDateString('fr-FR'); }
    formatTimeAgo(dateString) { return new Date(dateString).toLocaleTimeString('fr-FR'); }
}

// Initialise le panneau d'administration et le rend accessible globalement
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
