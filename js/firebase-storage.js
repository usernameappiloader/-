// ===== FIRESTORE DATA STORAGE MANAGEMENT =====
// Nécessite l'initialisation de Firebase dans firebase-init.js

class FirestoreStorage {
    constructor() {
        this.db = window.db;
    }

    // Catégories
    async getCategories() {
        const snapshot = await this.db.collection('categories').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCategoryById(id) {
        const doc = await this.db.collection('categories').doc(id.toString()).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async addCategory(categoryData) {
        const ref = this.db.collection('categories').doc();
        await ref.set(categoryData);
        return { id: ref.id, ...categoryData };
    }

    async updateCategory(id, categoryData) {
        await this.db.collection('categories').doc(id.toString()).update(categoryData);
        return this.getCategoryById(id);
    }

    async deleteCategory(id) {
        await this.db.collection('categories').doc(id.toString()).delete();
        // Supprimer aussi les downloads de cette catégorie
        const downloads = await this.getDownloads();
        const batch = this.db.batch();
        downloads.filter(d => d.categoryId == id).forEach(d => {
            batch.delete(this.db.collection('downloads').doc(d.id.toString()));
        });
        await batch.commit();
        return true;
    }

    // Downloads
    async getDownloads() {
        const snapshot = await this.db.collection('downloads').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getDownloadById(id) {
        const doc = await this.db.collection('downloads').doc(id.toString()).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async addDownload(downloadData) {
        const ref = this.db.collection('downloads').doc();
        await ref.set(downloadData);
        await this.addActivity('upload', `${downloadData.name} a été ajouté au catalogue`, ref.id);
        return { id: ref.id, ...downloadData };
    }

    async updateDownload(id, downloadData) {
        await this.db.collection('downloads').doc(id.toString()).update(downloadData);
        await this.addActivity('update', `${downloadData.name} a été mis à jour`, id);
        return this.getDownloadById(id);
    }

    async deleteDownload(id) {
        const download = await this.getDownloadById(id);
        await this.db.collection('downloads').doc(id.toString()).delete();
        await this.addActivity('delete', `${download.name} a été supprimé du catalogue`, id);
        return true;
    }

    // Activités
    async getRecentActivity() {
        const snapshot = await this.db.collection('activities').orderBy('time', 'desc').limit(100).get();
        return snapshot.docs.map(doc => doc.data());
    }

    async addActivity(type, message, downloadId = null, userInfo = null) {
        const activity = {
            id: Date.now(),
            type,
            message,
            time: new Date().toISOString(),
            downloadId,
            userInfo: userInfo || {
                ip: 'Unknown',
                userAgent: navigator.userAgent.substring(0, 50) + '...'
            }
        };
        await this.db.collection('activities').add(activity);
        return activity;
    }

    // Stats (calculées dynamiquement)
    async getStats() {
        const downloads = await this.getDownloads();
        const categories = await this.getCategories();
        const activities = await this.getRecentActivity();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDownloads = activities.filter(a => a.type === 'download' && new Date(a.time) >= today).length;
        return {
            totalDownloads: downloads.reduce((sum, d) => sum + (d.downloads || 0), 0),
            todayDownloads,
            totalApps: downloads.length,
            totalCategories: categories.length,
            lastUpdated: new Date().toISOString()
        };
    }

    // Settings (stockés dans un doc unique)
    async getSettings() {
        const doc = await this.db.collection('settings').doc('main').get();
        return doc.exists ? doc.data() : {};
    }

    async updateSettings(newSettings) {
        await this.db.collection('settings').doc('main').set(newSettings, { merge: true });
        return this.getSettings();
    }

    // Import/export (optionnel)
    async exportData() {
        const [categories, downloads, stats, settings] = await Promise.all([
            this.getCategories(),
            this.getDownloads(),
            this.getStats(),
            this.getSettings()
        ]);
        return JSON.stringify({ categories, downloads, stats, settings, exportDate: new Date().toISOString() }, null, 2);
    }

    async importData(jsonData) {
        const data = JSON.parse(jsonData);
        const batch = this.db.batch();
        if (data.categories) {
            data.categories.forEach(cat => {
                const ref = this.db.collection('categories').doc(cat.id ? cat.id.toString() : undefined);
                batch.set(ref, cat);
            });
        }
        if (data.downloads) {
            data.downloads.forEach(dl => {
                const ref = this.db.collection('downloads').doc(dl.id ? dl.id.toString() : undefined);
                batch.set(ref, dl);
            });
        }
        if (data.settings) {
            const ref = this.db.collection('settings').doc('main');
            batch.set(ref, data.settings);
        }
        await batch.commit();
        return true;
    }
}

// Remplace l'instance globale
window.dataStorage = new FirestoreStorage();
