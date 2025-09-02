// ===== PWA MANAGER - GESTION DE L'APPLICATION PROGRESSIVE =====

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupNetworkStatus();
        this.setupPeriodicSync();
    }

    // Register Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[PWA] Service Worker registered:', registration);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    }
                });

                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event);
                });

            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        }
    }

    // Setup install prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('[PWA] Before install prompt fired');
            event.preventDefault();
            this.deferredPrompt = event;

            // Show install button
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', (event) => {
            console.log('[PWA] App installed');
            this.hideInstallButton();
            this.trackInstall();
        });
    }

    // Show install button
    showInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'btn btn-primary pwa-install-btn';
        installBtn.innerHTML = '<i class="fas fa-download me-2"></i>Installer l\'app';
        installBtn.onclick = () => this.installPWA();

        // Add to navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            navbar.appendChild(installBtn);
        }
    }

    // Hide install button
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // Install PWA
    async installPWA() {
        if (!this.deferredPrompt) return;

        try {
            const result = await this.deferredPrompt.prompt();
            console.log('[PWA] Install prompt result:', result);

            this.deferredPrompt = null;
            this.hideInstallButton();

        } catch (error) {
            console.error('[PWA] Install failed:', error);
        }
    }

    // Setup network status monitoring
    setupNetworkStatus() {
        window.addEventListener('online', () => {
            console.log('[PWA] Online');
            this.isOnline = true;
            this.showOnlineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('[PWA] Offline');
            this.isOnline = false;
            this.showOfflineStatus();
        });
    }

    // Show online status
    showOnlineStatus() {
        this.showStatusNotification('Connexion rétablie', 'success');
    }

    // Show offline status
    showOfflineStatus() {
        this.showStatusNotification('Mode hors ligne activé', 'warning');
    }

    // Show status notification
    showStatusNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} pwa-status-notification`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'wifi' : 'wifi-slash'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Setup periodic background sync
    setupPeriodicSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            // Request background sync permission
            navigator.serviceWorker.ready.then((registration) => {
                // Register for periodic sync if supported
                if ('periodicSync' in registration) {
                    registration.periodicSync.register('content-sync', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    }).then(() => {
                        console.log('[PWA] Periodic sync registered');
                    }).catch((error) => {
                        console.error('[PWA] Periodic sync registration failed:', error);
                    });
                }
            });
        }
    }

    // Sync offline data
    async syncOfflineData() {
        try {
            // Get offline actions from IndexedDB
            const offlineActions = await this.getOfflineActions();

            if (offlineActions.length > 0) {
                console.log('[PWA] Syncing offline actions:', offlineActions.length);

                // Process offline actions
                for (const action of offlineActions) {
                    await this.processOfflineAction(action);
                }

                // Clear processed actions
                await this.clearOfflineActions();
            }

        } catch (error) {
            console.error('[PWA] Offline sync failed:', error);
        }
    }

    // Get offline actions from storage
    async getOfflineActions() {
        return new Promise((resolve) => {
            const request = indexedDB.open('mr-dev-tech-offline', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('actions')) {
                    db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['actions'], 'readonly');
                const store = transaction.objectStore('actions');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    resolve(getAllRequest.result || []);
                };

                getAllRequest.onerror = () => {
                    resolve([]);
                };
            };

            request.onerror = () => {
                resolve([]);
            };
        });
    }

    // Process offline action
    async processOfflineAction(action) {
        try {
            switch (action.type) {
                case 'download':
                    await window.dataStorage.addActivity('download', action.message);
                    break;
                case 'search':
                    // Handle offline search if needed
                    break;
                default:
                    console.log('[PWA] Unknown offline action:', action.type);
            }
        } catch (error) {
            console.error('[PWA] Failed to process offline action:', error);
        }
    }

    // Clear offline actions
    async clearOfflineActions() {
        return new Promise((resolve) => {
            const request = indexedDB.open('mr-dev-tech-offline', 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['actions'], 'readwrite');
                const store = transaction.objectStore('actions');
                const clearRequest = store.clear();

                clearRequest.onsuccess = () => {
                    resolve();
                };

                clearRequest.onerror = () => {
                    resolve();
                };
            };

            request.onerror = () => {
                resolve();
            };
        });
    }

    // Handle service worker messages
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'CACHE_UPDATED':
                this.showUpdateNotification();
                break;
            case 'OFFLINE_READY':
                this.showOfflineReadyNotification();
                break;
            default:
                console.log('[PWA] Unknown message type:', type);
        }
    }

    // Show update notification
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info pwa-update-notification';
        notification.innerHTML = `
            <i class="fas fa-sync me-2"></i>
            Mise à jour disponible !
            <button class="btn btn-sm btn-primary ms-2" onclick="location.reload()">Actualiser</button>
        `;

        document.body.appendChild(notification);
    }

    // Show offline ready notification
    showOfflineReadyNotification() {
        this.showStatusNotification('Prêt pour le mode hors ligne', 'info');
    }

    // Track install event
    trackInstall() {
        if (window.dataStorage) {
            window.dataStorage.addActivity('install', 'Application installée');
        }
    }

    // Check if running as PWA
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    // Get network status
    getNetworkStatus() {
        return {
            online: this.isOnline,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
        };
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});
