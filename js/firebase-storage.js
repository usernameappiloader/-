// ===== FIREBASE DATA STORAGE MANAGEMENT =====
// Utilise Firestore pour toutes les opérations
class FirebaseStorage {
    constructor() {
        this.db = firebase.firestore();
    }

    // Récupérer les stats globales
    async getStats() {
        const doc = await this.db.collection('stats').doc('global').get();
        return doc.exists ? doc.data() : {};
    }

    // Récupérer l'activité récente (dernier 100 logs)
    async getRecentActivity(limit = 100) {
        const snapshot = await this.db.collection('activities').orderBy('timestamp', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }

    // Ajouter une activité
    addActivity(activity) {
        // Ajoute un champ timestamp pour le tri
        return this.db.collection('activities').add({ ...activity, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    }

    // Mettre à jour les stats
    updateStats(stats) {
        return this.db.collection('stats').doc('global').set(stats);
    }

    // Exemples d'autres méthodes Firestore (à adapter selon ton usage)
    getSettings() {
        return this.db.collection('settings').doc('main').get().then(doc => doc.exists ? doc.data() : {});
    }
    updateSettings(settings) {
        return this.db.collection('settings').doc('main').set(settings);
    }
    // ... Ajoute ici d'autres méthodes selon tes besoins ...
}

// Instance globale pour usage dans tes scripts
window.firebaseStorage = new FirebaseStorage();
