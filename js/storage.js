// ===== DATA STORAGE MANAGEMENT =====

class DataStorage {
    constructor() {
        this.initializeData();
    }

    // Initialize default data if not exists
    initializeData() {
        if (!localStorage.getItem('downloadHub_categories')) {
            this.setDefaultCategories();
        }
        if (!localStorage.getItem('downloadHub_downloads')) {
            this.setDefaultDownloads();
        }
        if (!localStorage.getItem('downloadHub_stats')) {
            this.setDefaultStats();
        }
        if (!localStorage.getItem('downloadHub_settings')) {
            this.setDefaultSettings();
        }
    }

    // Set default categories
    setDefaultCategories() {
        const defaultCategories = [
            {
                id: 1,
                name: 'Applications Mobiles',
                icon: 'fas fa-mobile-alt',
                description: 'Applications pour Android et iOS',
                count: 0
            },
            {
                id: 2,
                name: 'Logiciels PC',
                icon: 'fas fa-desktop',
                description: 'Logiciels pour Windows, Mac et Linux',
                count: 0
            },
            {
                id: 3,
                name: 'Jeux',
                icon: 'fas fa-gamepad',
                description: 'Jeux gratuits et démos',
                count: 0
            },
            {
                id: 4,
                name: 'Documents & Guides',
                icon: 'fas fa-file-pdf',
                description: 'Guides, manuels et documents utiles',
                count: 0
            },
            {
                id: 5,
                name: 'Outils & Utilitaires',
                icon: 'fas fa-tools',
                description: 'Outils pratiques et utilitaires',
                count: 0
            },
            {
                id: 6,
                name: 'Multimédia',
                icon: 'fas fa-photo-video',
                description: 'Lecteurs vidéo, éditeurs photo, etc.',
                count: 0
            }
        ];
        localStorage.setItem('downloadHub_categories', JSON.stringify(defaultCategories));
    }

    // Set default downloads
    setDefaultDownloads() {
        const defaultDownloads = [
            {
                id: 1,
                name: 'WhatsApp Desktop',
                category: 'Applications Mobiles',
                categoryId: 1,
                description: 'Application de messagerie instantanée pour rester connecté avec vos proches depuis votre ordinateur.',
                url: 'https://www.whatsapp.com/download',
                version: '2.2347.4',
                size: '150 MB',
                downloads: 1250,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMjVEMzY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNDBDNjcuOSA0MCA0MCA2Ny45IDQwIDEwMEM0MCA5Ny4xIDQwLjggOTQuNCA0Mi4yIDkyTDQwIDEyMEw2OC4yIDExNy45QzcwLjYgMTE5LjIgNzMuMiAxMjAgNzYgMTIwSDEwMEMxMzIuMSAxMjAgMTYwIDkyLjEgMTYwIDYwQzE2MCA0Ny45IDE1Mi4xIDQwIDEwMCA0MFoiIGZpbGw9IndoaXRlIi8+CjwvdXN2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: true
            },
            {
                id: 2,
                name: 'VLC Media Player',
                category: 'Multimédia',
                categoryId: 6,
                description: 'Lecteur multimédia gratuit et open source capable de lire pratiquement tous les formats vidéo et audio.',
                url: 'https://www.videolan.org/vlc/',
                version: '3.0.18',
                size: '45 MB',
                downloads: 2100,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkY4QzAwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IndoaXRlIi8+CjwvdXN2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: true
            },
            {
                id: 3,
                name: 'Visual Studio Code',
                category: 'Logiciels PC',
                categoryId: 2,
                description: 'Éditeur de code source gratuit et puissant développé par Microsoft avec support pour de nombreux langages.',
                url: 'https://code.visualstudio.com/',
                version: '1.84.2',
                size: '85 MB',
                downloads: 1800,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMDA3QUNDIi8+CjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IndoaXRlIi8+CjwvdXN2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: false
            },
            {
                id: 4,
                name: 'Minecraft',
                category: 'Jeux',
                categoryId: 3,
                description: 'Jeu de construction et d\'aventure en monde ouvert où votre créativité est la seule limite.',
                url: 'https://www.minecraft.net/',
                version: '1.20.2',
                size: '500 MB',
                downloads: 3200,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjJCNDdBIi8+CjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjOENCNzNEIi8+CjxyZWN0IHg9IjEyMCIgeT0iNDAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzhDQjczRCIvPgo8L3N2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: true
            },
            {
                id: 5,
                name: 'Guide PDF - Développement Web',
                category: 'Documents & Guides',
                categoryId: 4,
                description: 'Guide complet pour apprendre le développement web moderne avec HTML5, CSS3 et JavaScript.',
                url: '#',
                version: '2023.1',
                size: '15 MB',
                downloads: 890,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjREMzNTQ1Ii8+CjxyZWN0IHg9IjUwIiB5PSI0MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IndoaXRlIi8+CjwvdXN2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: false
            },
            {
                id: 6,
                name: 'WinRAR',
                category: 'Outils & Utilitaires',
                categoryId: 5,
                description: 'Logiciel de compression et décompression de fichiers supportant de nombreux formats d\'archives.',
                url: 'https://www.win-rar.com/',
                version: '6.24',
                size: '3.2 MB',
                downloads: 1650,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkZDMTA3Ii8+CjxyZWN0IHg9IjYwIiB5PSI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzQzQTQwIi8+CjwvdXN2Zz4K',
                dateAdded: new Date().toISOString(),
                featured: false
            }
        ];
        localStorage.setItem('downloadHub_downloads', JSON.stringify(defaultDownloads));
        this.updateCategoryCounts();
    }

    // Set default stats
    setDefaultStats() {
        const defaultStats = {
            totalDownloads: 11980,
            todayDownloads: 45,
            totalApps: 6,
            totalCategories: 6,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('downloadHub_stats', JSON.stringify(defaultStats));
    }

    // Set default settings
    setDefaultSettings() {
        const defaultSettings = {
            adminEmail: 'siakakeita272@gmail.com',
            adminPassword: 'Keita1234.',
            siteName: 'Download Hub',
            siteDescription: 'Votre destination pour les téléchargements gratuits et sécurisés',
            maxFileSize: '500MB',
            allowedFileTypes: ['exe', 'msi', 'dmg', 'apk', 'pdf', 'zip', 'rar'],
            lastLogin: null
        };
        localStorage.setItem('downloadHub_settings', JSON.stringify(defaultSettings));
    }

    // Get all categories
    getCategories() {
        const categories = localStorage.getItem('downloadHub_categories');
        return categories ? JSON.parse(categories) : [];
    }

    // Get category by ID
    getCategoryById(id) {
        const categories = this.getCategories();
        return categories.find(cat => cat.id === parseInt(id));
    }

    // Add new category
    addCategory(categoryData) {
        const categories = this.getCategories();
        const newId = Math.max(...categories.map(c => c.id), 0) + 1;
        const newCategory = {
            id: newId,
            name: categoryData.name,
            icon: categoryData.icon || 'fas fa-folder',
            description: categoryData.description || '',
            count: 0
        };
        categories.push(newCategory);
        localStorage.setItem('downloadHub_categories', JSON.stringify(categories));
        return newCategory;
    }

    // Update category
    updateCategory(id, categoryData) {
        const categories = this.getCategories();
        const index = categories.findIndex(cat => cat.id === parseInt(id));
        if (index !== -1) {
            categories[index] = { ...categories[index], ...categoryData };
            localStorage.setItem('downloadHub_categories', JSON.stringify(categories));
            return categories[index];
        }
        return null;
    }

    // Delete category
    deleteCategory(id) {
        const categories = this.getCategories();
        const filteredCategories = categories.filter(cat => cat.id !== parseInt(id));
        localStorage.setItem('downloadHub_categories', JSON.stringify(filteredCategories));
        
        // Also remove downloads in this category
        const downloads = this.getDownloads();
        const filteredDownloads = downloads.filter(download => download.categoryId !== parseInt(id));
        localStorage.setItem('downloadHub_downloads', JSON.stringify(filteredDownloads));
        
        this.updateCategoryCounts();
        return true;
    }

    // Get all downloads
    getDownloads() {
        const downloads = localStorage.getItem('downloadHub_downloads');
        return downloads ? JSON.parse(downloads) : [];
    }

    // Get download by ID
    getDownloadById(id) {
        const downloads = this.getDownloads();
        return downloads.find(download => download.id === parseInt(id));
    }

    // Get downloads by category
    getDownloadsByCategory(categoryId) {
        const downloads = this.getDownloads();
        return downloads.filter(download => download.categoryId === parseInt(categoryId));
    }

    // Get featured downloads
    getFeaturedDownloads() {
        const downloads = this.getDownloads();
        return downloads.filter(download => download.featured);
    }

    // Search downloads
    searchDownloads(query) {
        const downloads = this.getDownloads();
        const searchTerm = query.toLowerCase();
        return downloads.filter(download => 
            download.name.toLowerCase().includes(searchTerm) ||
            download.description.toLowerCase().includes(searchTerm) ||
            download.category.toLowerCase().includes(searchTerm)
        );
    }

    // Add new download with activity tracking
    addDownload(downloadData) {
        const downloads = this.getDownloads();
        const newId = Math.max(...downloads.map(d => d.id), 0) + 1;
        const category = this.getCategoryById(downloadData.categoryId);
        
        const newDownload = {
            id: newId,
            name: downloadData.name,
            category: category ? category.name : 'Autre',
            categoryId: parseInt(downloadData.categoryId),
            description: downloadData.description,
            url: downloadData.url,
            version: downloadData.version || '1.0',
            size: downloadData.size || 'N/A',
            downloads: 0,
            image: downloadData.image || null,
            dateAdded: new Date().toISOString(),
            lastDownloaded: null,
            featured: downloadData.featured || false,
            instructions: downloadData.instructions || null
        };
        
        downloads.push(newDownload);
        localStorage.setItem('downloadHub_downloads', JSON.stringify(downloads));
        
        // Add real activity log
        this.addActivity('upload', `${newDownload.name} a été ajouté au catalogue`, newId);
        
        this.updateCategoryCounts();
        this.updateStats();
        return newDownload;
    }

    // Update download with activity tracking
    updateDownload(id, downloadData) {
        const downloads = this.getDownloads();
        const index = downloads.findIndex(download => download.id === parseInt(id));
        if (index !== -1) {
            const oldName = downloads[index].name;
            const category = this.getCategoryById(downloadData.categoryId);
            downloads[index] = { 
                ...downloads[index], 
                ...downloadData,
                category: category ? category.name : downloads[index].category,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('downloadHub_downloads', JSON.stringify(downloads));
            
            // Add real activity log
            this.addActivity('update', `${oldName} a été mis à jour`, id);
            
            this.updateCategoryCounts();
            return downloads[index];
        }
        return null;
    }

    // Delete download with activity tracking
    deleteDownload(id) {
        const downloads = this.getDownloads();
        const downloadToDelete = downloads.find(download => download.id === parseInt(id));
        
        if (downloadToDelete) {
            const filteredDownloads = downloads.filter(download => download.id !== parseInt(id));
            localStorage.setItem('downloadHub_downloads', JSON.stringify(filteredDownloads));
            
            // Add real activity log
            this.addActivity('delete', `${downloadToDelete.name} a été supprimé du catalogue`, id);
            
            this.updateCategoryCounts();
            this.updateStats();
            return true;
        }
        return false;
    }

    // Increment download count with real tracking
    incrementDownloadCount(id, userInfo = null) {
        const downloads = this.getDownloads();
        const index = downloads.findIndex(download => download.id === parseInt(id));
        if (index !== -1) {
            downloads[index].downloads += 1;
            downloads[index].lastDownloaded = new Date().toISOString();
            localStorage.setItem('downloadHub_downloads', JSON.stringify(downloads));
            
            // Add real activity log
            this.addActivity(
                'download', 
                `${downloads[index].name} a été téléchargé`, 
                id,
                userInfo
            );
            
            // Update stats with real data
            this.updateStats();
            
            return downloads[index];
        }
        return null;
    }

    // Update category counts
    updateCategoryCounts() {
        const categories = this.getCategories();
        const downloads = this.getDownloads();
        
        categories.forEach(category => {
            category.count = downloads.filter(download => download.categoryId === category.id).length;
        });
        
        localStorage.setItem('downloadHub_categories', JSON.stringify(categories));
    }

    // Get stats
    getStats() {
        const stats = localStorage.getItem('downloadHub_stats');
        return stats ? JSON.parse(stats) : this.setDefaultStats();
    }

    // Update stats (real calculation)
    updateStats() {
        const downloads = this.getDownloads();
        const categories = this.getCategories();
        const activities = this.getRecentActivity();
        
        // Calculate today's downloads from real activity logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDownloads = activities.filter(activity => 
            activity.type === 'download' && 
            new Date(activity.time) >= today
        ).length;
        
        const stats = {
            totalDownloads: downloads.reduce((sum, download) => sum + download.downloads, 0),
            todayDownloads: todayDownloads,
            totalApps: downloads.length,
            totalCategories: categories.length,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('downloadHub_stats', JSON.stringify(stats));
        return stats;
    }

    // Get settings
    getSettings() {
        const settings = localStorage.getItem('downloadHub_settings');
        return settings ? JSON.parse(settings) : this.setDefaultSettings();
    }

    // Update settings
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        localStorage.setItem('downloadHub_settings', JSON.stringify(updatedSettings));
        return updatedSettings;
    }

    // Get recent activity (real tracking)
    getRecentActivity() {
        const activities = localStorage.getItem('downloadHub_activities');
        return activities ? JSON.parse(activities) : [];
    }

    // Add activity log
    addActivity(type, message, downloadId = null, userInfo = null) {
        const activities = this.getRecentActivity();
        const newActivity = {
            id: Date.now(),
            type: type, // 'download', 'upload', 'update', 'delete'
            message: message,
            time: new Date().toISOString(),
            downloadId: downloadId,
            userInfo: userInfo || {
                ip: 'Unknown',
                userAgent: navigator.userAgent.substring(0, 50) + '...'
            }
        };
        
        activities.unshift(newActivity);
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }
        
        localStorage.setItem('downloadHub_activities', JSON.stringify(activities));
        return newActivity;
    }

    // Clear old activities (older than 30 days)
    cleanOldActivities() {
        const activities = this.getRecentActivity();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filteredActivities = activities.filter(activity => 
            new Date(activity.time) > thirtyDaysAgo
        );
        
        localStorage.setItem('downloadHub_activities', JSON.stringify(filteredActivities));
    }

    // Export data
    exportData() {
        const data = {
            categories: this.getCategories(),
            downloads: this.getDownloads(),
            stats: this.getStats(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    // Import data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.categories) localStorage.setItem('downloadHub_categories', JSON.stringify(data.categories));
            if (data.downloads) localStorage.setItem('downloadHub_downloads', JSON.stringify(data.downloads));
            if (data.stats) localStorage.setItem('downloadHub_stats', JSON.stringify(data.stats));
            if (data.settings) localStorage.setItem('downloadHub_settings', JSON.stringify(data.settings));
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem('downloadHub_categories');
        localStorage.removeItem('downloadHub_downloads');
        localStorage.removeItem('downloadHub_stats');
        localStorage.removeItem('downloadHub_settings');
        this.initializeData();
    }
}

// Create global instance
window.dataStorage = new DataStorage();
