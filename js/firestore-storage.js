// ===== FIRESTORE DATA STORAGE MANAGEMENT =====
// Nécessite l'initialisation de Firebase dans firebase-init.js

// ===== FIRESTORE DATA STORAGE MANAGEMENT (VERSION FINALE ET COMPLÈTE) =====

class FirestoreStorage {
    constructor() {
        this.db = window.db; // On utilise uniquement la base de données
    }

    // Fonction interne pour convertir une image en texte (Base64)
    async _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- Catégories ---
    async getCategories() {
        const snapshot = await this.db.collection('categories').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCategoryById(id) {
        const doc = await this.db.collection('categories').doc(id.toString()).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async addCategory(categoryData) {
        const ref = await this.db.collection('categories').add(categoryData);
        return { id: ref.id, ...categoryData };
    }

    async updateCategory(id, categoryData) {
        await this.db.collection('categories').doc(id.toString()).update(categoryData);
        return this.getCategoryById(id);
    }

    async deleteCategory(id) {
        await this.db.collection('categories').doc(id.toString()).delete();
        const downloads = await this.getDownloads();
        const batch = this.db.batch();
        downloads.filter(d => String(d.categoryId) === String(id)).forEach(d => {
            batch.delete(this.db.collection('downloads').doc(d.id.toString()));
        });
        await batch.commit();
        return true;
    }

    // --- Téléchargements (avec conversion d'image) ---
    async getDownloads() {
        const snapshot = await this.db.collection('downloads').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getDownloadById(id) {
        const doc = await this.db.collection('downloads').doc(id.toString()).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async addDownload(downloadData) {
        if (downloadData.image instanceof File) {
            downloadData.image = await this._fileToBase64(downloadData.image);
        }
        const ref = await this.db.collection('downloads').add(downloadData);
        await this.addActivity('upload', `${downloadData.name} a été ajouté`, ref.id);
        return { id: ref.id, ...downloadData };
    }

    async updateDownload(id, downloadData) {
        if (downloadData.image instanceof File) {
            downloadData.image = await this._fileToBase64(downloadData.image);
        }
        await this.db.collection('downloads').doc(id.toString()).update(downloadData);
        await this.addActivity('update', `${downloadData.name} a été mis à jour`, id);
        return this.getDownloadById(id);
    }

    async deleteDownload(id) {
        const download = await this.getDownloadById(id);
        if (!download) return false;
        await this.db.collection('downloads').doc(id.toString()).delete();
        await this.addActivity('delete', `${download.name} a été supprimé`, id);
        return true;
    }

    // --- Activités (FONCTION MANQUANTE) ---
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
            userInfo: userInfo || { ip: 'Unknown', userAgent: navigator.userAgent }
        };
        await this.db.collection('activities').add(activity);
        return activity;
    }

    // --- Statistiques (FONCTION MANQUANTE) ---
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

    // --- Paramètres ---
    async getSettings() {
        const doc = await this.db.collection('settings').doc('main').get();
        return doc.exists ? doc.data() : {};
    }

    async updateSettings(newSettings) {
        await this.db.collection('settings').doc('main').set(newSettings, { merge: true });
        return this.getSettings();
    }
}

// Initialise l'instance globale
window.dataStorage = new FirestoreStorage();
