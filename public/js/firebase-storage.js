// ===== FIREBASE DATA STORAGE MANAGEMENT =====
// Utilise la Realtime Database de Firebase pour toutes les opérations
class FirebaseStorage {
    constructor() {
        this.db = firebase.database();
    }

    // Récupérer les stats globales
    async getStats() {
        const snapshot = await this.db.ref('stats').once('value');
        return snapshot.val() || {};
    }

    // Récupérer l'activité récente (dernier 100 logs)
    async getRecentActivity(limit = 100) {
        const snapshot = await this.db.ref('activities').limitToLast(limit).once('value');
        const data = snapshot.val() || {};
        // Retourne du plus récent au plus ancien
        return Object.values(data).reverse();
    }

    // Ajouter une activité
    addActivity(activity) {
        return this.db.ref('activities').push(activity);
    }

    // Mettre à jour les stats
    updateStats(stats) {
        return this.db.ref('stats').set(stats);
    }

    // Exemples d'autres méthodes Firebase (à adapter selon ton usage)
    getSettings() {
        return this.db.ref('settings').once('value').then(s => s.val() || {});
    }
    updateSettings(settings) {
        return this.db.ref('settings').set(settings);
    }
    // ... Ajoute ici d'autres méthodes selon tes besoins ...
}

// Instance globale pour usage dans tes scripts
window.firebaseStorage = new FirebaseStorage();
