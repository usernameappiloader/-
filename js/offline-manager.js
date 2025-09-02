// ===== OFFLINE MANAGER - GESTION DU MODE HORS LIGNE =====

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.dbName = 'mr-dev-tech-offline';
        this.dbVersion = 1;
        this.cachedData = new Map();
        this.init();
    }

    async init() {
        this.setupNetworkListeners();
        await this.initializeIndexedDB();
        this.setupOfflineUI();
        this.loadCachedData();
    }

    // Setup network status listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('[Offline] Online');
            this.isOnline = true;
            this.handleReconnection();
        });

        window.addEventListener('offline', () => {
            console.log('[Offline] Offline');
            this.isOnline = false;
            this.showOfflineMode();
        });
    }

    // Initialize IndexedDB for offline storage
    initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('[Offline] IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('[Offline] IndexedDB initialized');
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create stores for different data types
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('downloads')) {
                    db.createObjectStore('downloads', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('actions')) {
                    db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains('userPreferences')) {
                    db.createObjectStore('userPreferences', { keyPath: 'key' });
                }

                console.log('[Offline] IndexedDB stores created');
            };
        });
    }

    // Setup offline UI elements
    setupOfflineUI() {
        this.createOfflineIndicator();
        this.createOfflineMessage();
    }

    // Create offline indicator
    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>Hors ligne</span>
        `;

        document.body.appendChild(indicator);
        this.updateOfflineIndicator();
    }

    // Update offline indicator visibility
    updateOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (!this.isOnline) {
                indicator.classList.add('visible');
            } else {
                indicator.classList.remove('visible');
            }
        }
    }

    // Create offline message overlay
    createOfflineMessage() {
        const overlay = document.createElement('div');
        overlay.id = 'offline-overlay';
        overlay.className = 'offline-overlay';
        overlay.innerHTML = `
            <div class="offline-message">
                <i class="fas fa-wifi-slash offline-icon"></i>
                <h3>Mode hors ligne</h3>
                <p>Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.</p>
                <div class="offline-features">
                    <div class="feature">
                        <i class="fas fa-check text-success"></i>
                        <span>Navigation dans les applications mises en cache</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-check text-success"></i>
                        <span>Recherche dans les données locales</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-clock text-warning"></i>
                        <span>Téléchargements synchronisés à la reconnexion</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.style.display='none'">
                    Continuer hors ligne
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    // Show offline mode
    showOfflineMode() {
        this.updateOfflineIndicator();

        // Show offline overlay only once per session
        const overlayShown = sessionStorage.getItem('offline-overlay-shown');
        if (!overlayShown) {
            const overlay = document.getElementById('offline-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                sessionStorage.setItem('offline-overlay-shown', 'true');
            }
        }

        // Switch to offline data
        this.enableOfflineMode();
    }

    // Handle reconnection
    async handleReconnection() {
        console.log('[Offline] Reconnecting...');
        this.updateOfflineIndicator();

        // Hide offline overlay
        const overlay = document.getElementById('offline-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        // Sync offline data
        await this.syncOfflineData();

        // Reload fresh data
        if (window.downloadHub) {
            await window.downloadHub.loadInitialData();
        }

        // Show reconnection notification
        this.showReconnectionNotification();
    }

    // Enable offline mode
    enableOfflineMode() {
        console.log('[Offline] Enabling offline mode');

        // Use cached data for display
        if (window.downloadHub) {
            this.displayCachedData();
        }
    }

    // Load cached data from IndexedDB
    async loadCachedData() {
        try {
            const categories = await this.getFromIndexedDB('categories');
            const downloads = await this.getFromIndexedDB('downloads');

            this.cachedData.set('categories', categories || []);
            this.cachedData.set('downloads', downloads || []);

            console.log('[Offline] Cached data loaded:', {
                categories: categories?.length || 0,
                downloads: downloads?.length || 0
            });

        } catch (error) {
            console.error('[Offline] Failed to load cached data:', error);
        }
    }

    // Cache data to IndexedDB
    async cacheData(type, data) {
        try {
            await this.saveToIndexedDB(type, data);
            this.cachedData.set(type, data);

            console.log(`[Offline] ${type} cached:`, data.length, 'items');

        } catch (error) {
            console.error(`[Offline] Failed to cache ${type}:`, error);
        }
    }

    // Display cached data
    displayCachedData() {
        const cachedCategories = this.cachedData.get('categories') || [];
        const cachedDownloads = this.cachedData.get('downloads') || [];

        // Update categories display
        if (cachedCategories.length > 0) {
            this.displayCachedCategories(cachedCategories);
        }

        // Update downloads display
        if (cachedDownloads.length > 0) {
            this.displayCachedDownloads(cachedDownloads);
        }

        // Update stats
        this.updateCachedStats(cachedCategories, cachedDownloads);
    }

    // Display cached categories
    displayCachedCategories(categories) {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (categories.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>Aucune catégorie en cache</p></div>';
            return;
        }

        categories.forEach(category => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            col.innerHTML = `
                <div class="category-card offline-category">
                    <i class="${category.icon || 'fas fa-folder'}"></i>
                    <h5>${category.name}</h5>
                    <p>${category.description}</p>
                    <div class="offline-badge">
                        <i class="fas fa-database"></i>
                        Cache
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    }

    // Display cached downloads
    displayCachedDownloads(downloads) {
        const container = document.getElementById('downloadsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (downloads.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>Aucune application en cache</p></div>';
            return;
        }

        downloads.forEach((download, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            const imageHtml = download.image ?
                `<img src="${download.image}" alt="${download.name}" loading="lazy">` :
                `<div class="download-card-image-placeholder"><i class="fas fa-image"></i></div>`;

            col.innerHTML = `
                <div class="download-card offline-download" style="animation-delay: ${index * 0.1}s">
                    <div class="download-card-image">${imageHtml}</div>
                    <div class="download-card-body">
                        <h5 class="download-card-title">${download.name}</h5>
                        <p class="download-card-description">${download.description}</p>
                        <div class="download-card-meta">
                            <span><i class="fas fa-tag me-1"></i>${download.category}</span>
                            <span><i class="fas fa-download me-1"></i>${download.downloads || 0}</span>
                        </div>
                        <div class="download-card-footer">
                            <small class="text-muted"><i class="fas fa-calendar me-1"></i>${this.formatDate(download.dateAdded)}</small>
                            <button class="btn download-btn offline-btn" onclick="window.offlineManager.handleOfflineDownload('${download.id}')">
                                <i class="fas fa-database me-2"></i>Hors ligne
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    }

    // Update cached stats
    updateCachedStats(categories, downloads) {
        const totalApps = downloads.length;
        const totalCategories = categories.length;
        const totalDownloads = downloads.reduce((sum, d) => sum + (d.downloads || 0), 0);

        // Update stat elements
        const totalAppsEl = document.getElementById('totalApps');
        const totalDownloadsEl = document.getElementById('totalDownloads');
        const totalCategoriesEl = document.getElementById('totalCategories');

        if (totalAppsEl) totalAppsEl.textContent = totalApps;
        if (totalDownloadsEl) totalDownloadsEl.textContent = this.formatNumber(totalDownloads);
        if (totalCategoriesEl) totalCategoriesEl.textContent = totalCategories;
    }

    // Handle offline download action
    handleOfflineDownload(downloadId) {
        // Store the action for later sync
        this.storeOfflineAction('download', `Téléchargement hors ligne de ${downloadId}`);

        // Show feedback
        this.showOfflineActionFeedback('Téléchargement enregistré pour synchronisation');
    }

    // Store offline action
    async storeOfflineAction(type, message) {
        const action = {
            type,
            message,
            timestamp: new Date().toISOString(),
            synced: false
        };

        try {
            await this.saveToIndexedDB('actions', action);
            console.log('[Offline] Action stored:', action);
        } catch (error) {
            console.error('[Offline] Failed to store action:', error);
        }
    }

    // Sync offline data when back online
    async syncOfflineData() {
        try {
            const actions = await this.getFromIndexedDB('actions');
            const unsyncedActions = actions.filter(action => !action.synced);

            if (unsyncedActions.length > 0) {
                console.log('[Offline] Syncing actions:', unsyncedActions.length);

                for (const action of unsyncedActions) {
                    await this.syncAction(action);
                    action.synced = true;
                    await this.saveToIndexedDB('actions', action);
                }

                this.showSyncCompleteNotification(unsyncedActions.length);
            }

        } catch (error) {
            console.error('[Offline] Sync failed:', error);
        }
    }

    // Sync individual action
    async syncAction(action) {
        try {
            switch (action.type) {
                case 'download':
                    if (window.dataStorage) {
                        await window.dataStorage.addActivity('download', action.message);
                    }
                    break;
                default:
                    console.log('[Offline] Unknown action type:', action.type);
            }
        } catch (error) {
            console.error('[Offline] Failed to sync action:', error);
        }
    }

    // Show offline action feedback
    showOfflineActionFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'offline-feedback';
        feedback.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    // Show sync complete notification
    showSyncCompleteNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync"></i>
            <span>${count} action(s) synchronisée(s)</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Show reconnection notification
    showReconnectionNotification() {
        const notification = document.createElement('div');
        notification.className = 'reconnect-notification';
        notification.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>Connexion rétablie - Synchronisation en cours...</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // IndexedDB helper methods
    saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Utility methods
    formatNumber(num) {
        return String(num || 0);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    // Get offline status
    getOfflineStatus() {
        return {
            isOnline: this.isOnline,
            cachedCategories: this.cachedData.get('categories')?.length || 0,
            cachedDownloads: this.cachedData.get('downloads')?.length || 0,
            hasPendingActions: false // Could be implemented to check for unsynced actions
        };
    }
}

// Initialize Offline Manager
document.addEventListener('DOMContentLoaded', () => {
    window.offlineManager = new OfflineManager();
});
