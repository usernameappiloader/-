// Firebase Authentication with Firestore
class FirebaseAuthManager {
    constructor() {
        this.db = firebase.firestore();
        this.initializeAuth();
    }

    async initializeAuth() {
        // Ensure admin credentials exist in Firestore
        await this.ensureAdminCredentials();
    }

    async ensureAdminCredentials() {
        try {
            const adminRef = this.db.collection('settings').doc('admin');
            const adminDoc = await adminRef.get();
            
            if (!adminDoc.exists) {
                // Create admin credentials from your data
                await adminRef.set({
                    email: 'siakakeita272@gmail.com',
                    password: 'Keita1234.',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Admin credentials created in Firestore');
            }
        } catch (error) {
            console.error('Error ensuring admin credentials:', error);
        }
    }

    async validateCredentials(email, password) {
        try {
            const adminRef = this.db.collection('settings').doc('admin');
            const adminDoc = await adminRef.get();
            
            if (!adminDoc.exists) {
                // Fallback to default credentials
                return email === 'siakakeita272@gmail.com' && password === 'Keita1234.';
            }
            
            const adminData = adminDoc.data();
            return email === adminData.email && password === adminData.password;
        } catch (error) {
            console.error('Error validating credentials:', error);
            return false;
        }
    }

    async updatePassword(currentPassword, newPassword) {
        try {
            const adminRef = this.db.collection('settings').doc('admin');
            const adminDoc = await adminRef.get();
            
            if (!adminDoc.exists) {
                throw new Error('Admin credentials not found');
            }
            
            const adminData = adminDoc.data();
            
            if (currentPassword !== adminData.password) {
                throw new Error('Mot de passe actuel incorrect');
            }
            
            await adminRef.update({ password: newPassword });
            return true;
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }
}

// Initialize Firebase Auth
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseAuth = new FirebaseAuthManager();
});
