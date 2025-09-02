// ===== NOTIFICATION MANAGER - GESTION DES NOTIFICATIONS PUSH =====

class NotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.subscription = null;
        this.vapidPublicKey = null; // Will be fetched from server
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.log('[Notifications] Not supported in this browser');
            return;
        }

        await this.fetchVapidPublicKey();
        this.setupNotificationUI();
        this.checkPermissionStatus();
        this.loadUserPreferences();
        this.loadSubscription();
    }

    async fetchVapidPublicKey() {
        try {
            const response = await fetch('/api/vapid-public-key');
            const data = await response.json();
            this.vapidPublicKey = data.publicKey;
        } catch (error) {
            console.error('[Notifications] Failed to fetch VAPID public key:', error);
        }
    }

    // Setup notification UI elements
    setupNotificationUI() {
        this.createNotificationButton();
        this.createNotificationSettings();
    }

    // Create notification permission button
    createNotificationButton() {
        const button = document.createElement('button');
        button.id = 'notification-btn';
        button.className = 'btn btn-outline-primary notification-btn';
        button.innerHTML = '<i class="fas fa-bell"></i>';
        button.onclick = () => this.requestPermission();

        // Add to navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            navbar.appendChild(button);
        }

        this.updateNotificationButton();
    }

    // Update notification button based on permission status
    updateNotificationButton() {
        const button = document.getElementById('notification-btn');
        if (!button) return;

        if (Notification.permission === 'granted') {
            button.innerHTML = '<i class="fas fa-bell"></i>';
            button.classList.add('active');
            button.onclick = () => this.showNotificationSettings();
        } else if (Notification.permission === 'denied') {
            button.innerHTML = '<i class="fas fa-bell-slash"></i>';
            button.classList.add('denied');
            button.disabled = true;
        } else {
            button.innerHTML = '<i class="fas fa-bell"></i>';
            button.classList.remove('active', 'denied');
            button.disabled = false;
            button.onclick = () => this.requestPermission();
        }
    }

    // Request notification permission
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('[Notifications] Permission granted');
                await this.registerPushSubscription();
                this.showWelcomeNotification();
            } else {
                console.log('[Notifications] Permission denied');
            }

            this.updateNotificationButton();

        } catch (error) {
            console.error('[Notifications] Permission request failed:', error);
        }
    }

    // Register push subscription
    async registerPushSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            this.subscription = subscription;
            console.log('[Notifications] Push subscription registered:', subscription);

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);

        } catch (error) {
            console.error('[Notifications] Push subscription failed:', error);
        }
    }

    // Send subscription to server
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }
            console.log('[Notifications] Subscription sent to server');
        } catch (error) {
            console.error('[Notifications] Error sending subscription to server:', error);
        }
    }

    // Load subscription from localStorage (optional)
    loadSubscription() {
        const stored = localStorage.getItem('push-subscription');
        if (stored) {
            this.subscription = JSON.parse(stored);
        }
    }

    // Show welcome notification
    showWelcomeNotification() {
        const options = {
            body: 'Bienvenue sur MR.DEV-TECH ! Vous recevrez des notifications pour les nouvelles applications.',
            icon: '/images/icon.png',
            badge: '/images/icon.png',
            vibrate: [200, 100, 200],
            data: {
                url: '/'
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Explorer',
                    icon: '/images/icon.png'
                }
            ]
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification('MR.DEV-TECH', options);
            });
        }
    }

    // Create notification settings modal
    createNotificationSettings() {
        const modal = document.createElement('div');
        modal.id = 'notification-settings-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Paramètres de notifications</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="notification-settings">
                            <div class="setting-item">
                                <label class="form-check-label">
                                    <input type="checkbox" id="notify-new-apps" class="form-check-input">
                                    Nouvelles applications
                                </label>
                            </div>
                            <div class="setting-item">
                                <label class="form-check-label">
                                    <input type="checkbox" id="notify-updates" class="form-check-input">
                                    Mises à jour d'applications
                                </label>
                            </div>
                            <div class="setting-item">
                                <label class="form-check-label">
                                    <input type="checkbox" id="notify-promotions" class="form-check-input">
                                    Promotions et offres
                                </label>
                            </div>
                            <div class="setting-item">
                                <label class="form-check-label">
                                    <input type="checkbox" id="notify-weekly" class="form-check-input">
                                    Résumé hebdomadaire
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-primary" onclick="window.notificationManager.saveSettings()">Enregistrer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Show notification settings
    showNotificationSettings() {
        const modal = document.getElementById('notification-settings-modal');
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    // Load user preferences
    loadUserPreferences() {
        const preferences = JSON.parse(localStorage.getItem('notification-preferences') || '{}');

        // Set checkbox states
        const checkboxes = ['notify-new-apps', 'notify-updates', 'notify-promotions', 'notify-weekly'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = preferences[id] !== false; // Default to true
            }
        });
    }

    // Save notification settings
    saveSettings() {
        const preferences = {};
        const checkboxes = ['notify-new-apps', 'notify-updates', 'notify-promotions', 'notify-weekly'];

        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                preferences[id] = checkbox.checked;
            }
        });

        localStorage.setItem('notification-preferences', JSON.stringify(preferences));

        // Hide modal
        const modal = document.getElementById('notification-settings-modal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }

        this.showSettingsSavedNotification();
    }

    // Show settings saved notification
    showSettingsSavedNotification() {
        const notification = document.createElement('div');
        notification.className = 'settings-saved-notification';
        notification.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Paramètres enregistrés</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    // Check permission status
    checkPermissionStatus() {
        if (!('Notification' in window)) {
            console.log('[Notifications] This browser does not support notifications');
            return;
        }

        console.log('[Notifications] Permission status:', Notification.permission);
        this.updateNotificationButton();
    }

    // Send notification (for testing or manual triggers)
    sendNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            const defaultOptions = {
                body: 'Notification de MR.DEV-TECH',
                icon: '/images/icon.png',
                badge: '/images/icon.png',
                vibrate: [200, 100, 200],
                ...options
            };

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title, defaultOptions);
                });
            } else {
                new Notification(title, defaultOptions);
            }
        }
    }

    // Handle notification actions
    handleNotificationAction(action, data) {
        switch (action) {
            case 'explore':
                window.location.href = data?.url || '/';
                break;
            case 'view':
                if (data?.url) {
                    window.open(data.url, '_blank');
                }
                break;
            default:
                console.log('[Notifications] Unknown action:', action);
        }
    }

    // Utility: Convert VAPID key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Utility: Convert ArrayBuffer to base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Get notification status
    getNotificationStatus() {
        return {
            supported: this.isSupported,
            permission: Notification.permission,
            subscribed: !!this.subscription,
            preferences: JSON.parse(localStorage.getItem('notification-preferences') || '{}')
        };
    }

    // Test notification (for development)
    testNotification() {
        this.sendNotification('Test Notification', {
            body: 'Ceci est une notification de test',
            actions: [
                { action: 'explore', title: 'Explorer' },
                { action: 'dismiss', title: 'Ignorer' }
            ]
        });
    }
}

// Initialize Notification Manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});
