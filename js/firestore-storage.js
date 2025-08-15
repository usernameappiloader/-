// ===== FIRESTORE DATA STORAGE MANAGEMENT =====
// Nécessite l'initialisation de Firebase dans firebase-init.js

class FirestoreStorage {
    constructor() {
        this.db = window.db;
        this.storage = window.storage;
    }

    // Catégories
    async getCategories() {
        try {
            const snapshot = await this.db.collection('categories').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting categories:", error);
            return [];
        }
    }

    async getCategoryById(id) {
        try {
            const doc = await this.db.collection('categories').doc(id.toString()).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error("Error getting category by ID:", error);
            return null;
        }
    }

    async addCategory(categoryData) {
        try {
            const ref = await this.db.collection('categories').add(categoryData);
            return { id: ref.id, ...categoryData };
        } catch (error) {
            console.error("Error adding category:", error);
            return null;
        }
    }

    async updateCategory(id, categoryData) {
        try {
            await this.db.collection('categories').doc(id.toString()).update(categoryData);
            return this.getCategoryById(id);
        } catch (error) {
            console.error("Error updating category:", error);
            return null;
        }
    }

    async deleteCategory(id) {
        try {
            await this.db.collection('categories').doc(id.toString()).delete();
            const downloads = await this.getDownloads();
            const batch = this.db.batch();
            // FIX: Utilisation d'une comparaison de chaînes de caractères pour plus de robustesse
            downloads.filter(d => String(d.categoryId) === String(id)).forEach(d => {
                batch.delete(this.db.collection('downloads').doc(d.id.toString()));
            });
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error deleting category:", error);
            return false;
        }
    }

    // ... (le reste du fichier reste inchangé)
    // Downloads
    async getDownloads() {
        try {
            const snapshot = await this.db.collection('downloads').orderBy('name').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting downloads:", error);
            return [];
        }
    }

    async getDownloadById(id) {
        try {
            const doc = await this.db.collection('downloads').doc(id.toString()).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error("Error getting download by ID:", error);
            return null;
        }
    }

    async addDownload(downloadData) {
        try {
            if (downloadData.image instanceof File) {
                const file = downloadData.image;
                const storageRef = this.storage.ref(`downloads/${Date.now()}_${file.name}`);
                const snapshot = await storageRef.put(file);
                const imageUrl = await snapshot.ref.getDownloadURL();
                downloadData.image = imageUrl;
            }

            const ref = await this.db.collection('downloads').add(downloadData);
            await this.addActivity('upload', `${downloadData.name} a été ajouté au catalogue`, ref.id);
            return { id: ref.id, ...downloadData };
        } catch (error) {
            console.error("Error adding download:", error);
            return null;
        }
    }

    async updateDownload(id, downloadData) {
        try {
            if (downloadData.image instanceof File) {
                const file = downloadData.image;
                const storageRef = this.storage.ref(`downloads/${Date.now()}_${file.name}`);
                const snapshot = await storageRef.put(file);
                const imageUrl = await snapshot.ref.getDownloadURL();
                downloadData.image = imageUrl;
            }

            await this.db.collection('downloads').doc(id.toString()).update(downloadData);
            await this.addActivity('update', `${downloadData.name} a été mis à jour`, id);
            return this.getDownloadById(id);
        } catch (error) {
            console.error("Error updating download:", error);
            return null;
        }
    }


    async deleteDownload(id) {
        try {
            const download = await this.getDownloadById(id);
            if (!download) return false;
            await this.db.collection('downloads').doc(id.toString()).delete();
            await this.addActivity('delete', `${download.name} a été supprimé du catalogue`, id);
            return true;
        } catch (error) {
            console.error("Error deleting download:", error);
            return false;
        }
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
