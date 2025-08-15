// ===== FIRESTORE DATA STORAGE MANAGEMENT =====
// Nécessite l'initialisation de Firebase dans firebase-init.js

class FirestoreStorage {
    constructor() {
        // La base de données est la seule chose dont nous avons besoin
        this.db = window.db; 
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

    // --- Fonctions de gestion des téléchargements (MODIFIÉES) ---

    async addDownload(downloadData) {
        try {
            // Si une image est fournie, on la convertit
            if (downloadData.image instanceof File) {
                downloadData.image = await this._fileToBase64(downloadData.image);
            }

            const ref = await this.db.collection('downloads').add(downloadData);
            // ... (le reste de la fonction est bon)
            await this.addActivity('upload', `${downloadData.name} a été ajouté au catalogue`, ref.id);
            return { id: ref.id, ...downloadData };
        } catch (error) {
            console.error("Error adding download:", error);
            return null;
        }
    }

    async updateDownload(id, downloadData) {
        try {
            // Si une NOUVELLE image est fournie, on la convertit
            if (downloadData.image instanceof File) {
                downloadData.image = await this._fileToBase64(downloadData.image);
            }

            await this.db.collection('downloads').doc(id.toString()).update(downloadData);
            // ... (le reste de la fonction est bon)
            await this.addActivity('update', `${downloadData.name} a été mis à jour`, id);
            return this.getDownloadById(id);
        } catch (error) {
            console.error("Error updating download:", error);
            return null;
        }
    }

    // --- Le reste du fichier est correct et n'a pas besoin de changer ---
    
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

    async getDownloads() {
        const snapshot = await this.db.collection('downloads').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getDownloadById(id) {
        const doc = await this.db.collection('downloads').doc(id.toString()).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async deleteDownload(id) {
        const download = await this.getDownloadById(id);
        await this.db.collection('downloads').doc(id.toString()).delete();
        await this.addActivity('delete', `${download.name} a été supprimé`, id);
        return true;
    }
    
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
