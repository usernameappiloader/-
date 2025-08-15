// ===== DATA STORAGE MANAGEMENT =====
class DataStorage {
    getStats() {
        const stats = localStorage.getItem('downloadHub_stats');
        return stats ? JSON.parse(stats) : {};
    }
    updateSettings(newSettings) {
        const settings = this.getSettings();
        const updated = { ...settings, ...newSettings };
        localStorage.setItem('downloadHub_settings', JSON.stringify(updated));
        return updated;
    }
    getSettings() {
        const settings = localStorage.getItem('downloadHub_settings');
        return settings ? JSON.parse(settings) : {};
    }
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!localStorage.getItem('downloadHub_categories')) this.setDefaultCategories();
        if (!localStorage.getItem('downloadHub_downloads')) this.setDefaultDownloads();
    }

    setDefaultCategories() {
        const defaultCategories = [
            { id: 1, name: 'Applications Mobiles', icon: 'fas fa-mobile-alt', description: 'Applications pour Android et iOS', count: 0 },
            { id: 2, name: 'Logiciels PC', icon: 'fas fa-desktop', description: 'Logiciels pour Windows, Mac et Linux', count: 0 },
            { id: 3, name: 'Jeux', icon: 'fas fa-gamepad', description: 'Jeux gratuits et démos', count: 0 },
            { id: 4, name: 'Documents & Guides', icon: 'fas fa-file-pdf', description: 'Guides, manuels et documents utiles', count: 0 },
            { id: 5, name: 'Outils & Utilitaires', icon: 'fas fa-tools', description: 'Outils pratiques et utilitaires', count: 0 },
            { id: 6, name: 'Multimédia', icon: 'fas fa-photo-video', description: 'Lecteurs vidéo, éditeurs photo, etc.', count: 0 }
        ];
        localStorage.setItem('downloadHub_categories', JSON.stringify(defaultCategories));
    }

    setDefaultDownloads() {
        localStorage.setItem('downloadHub_downloads', JSON.stringify([]));
    }

    getCategories() {
        const categories = localStorage.getItem('downloadHub_categories');
        return categories ? JSON.parse(categories) : [];
    }

    getDownloads() {
        const downloads = localStorage.getItem('downloadHub_downloads');
        return downloads ? JSON.parse(downloads) : [];
    }

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

    addDownload(downloadData) {
        const downloads = this.getDownloads();
        const newId = Math.max(...downloads.map(d => d.id), 0) + 1;
        const newDownload = { ...downloadData, id: newId, dateAdded: new Date().toISOString() };
        downloads.push(newDownload);
        localStorage.setItem('downloadHub_downloads', JSON.stringify(downloads));
        return newDownload;
    }
}

// Create global instance
window.dataStorage = new DataStorage();
