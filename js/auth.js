// ===== AUTHENTICATION MANAGEMENT =====

class AuthManager {
    constructor() {
        this.initializeAuth();
        this.setupEventListeners();
    }

    // Initialize authentication
    initializeAuth() {
        // Check if user is already logged in
        this.checkAuthStatus();
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Remember me functionality
        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe) {
            // Load saved credentials if remember me was checked
            this.loadSavedCredentials();
        }

        // Auto-logout after inactivity (30 minutes)
        this.setupAutoLogout();
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Show loading state
        this.showLoading(true);
        this.hideAlert();
        
        // Simulate network delay for better UX
        await this.delay(1000);
        
        try {
            // Check if dataStorage is available
            if (!window.dataStorage) {
                throw new Error('Système de stockage non disponible. Veuillez recharger la page.');
            }
            
            // Validate credentials
            if (this.validateCredentials(email, password)) {
                // Save login state
                this.saveLoginState(email, rememberMe);
                
                // Save credentials if remember me is checked
                if (rememberMe) {
                    this.saveCredentials(email, password);
                } else {
                    this.clearSavedCredentials();
                }
                
                // Show success message
                this.showSuccess('Connexion réussie ! Redirection en cours...');
                
                // Redirect to admin panel after delay
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
                
            } else {
                // Show error message
                this.showError('Email ou mot de passe incorrect. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        }
        
        this.showLoading(false);
    }

    // Validate credentials using Firestore
    async validateCredentials(email, password) {
        try {
            const db = firebase.firestore();
            const adminRef = db.collection('settings').doc('admin');
            const adminDoc = await adminRef.get();
            
            if (!adminDoc.exists) {
                // Create admin credentials if they don't exist
                await adminRef.set({
                    email: 'siakakeita272@gmail.com',
                    password: 'Keita1234.',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return email === 'siakakeita272@gmail.com' && password === 'Keita1234.';
            }
            
            const adminData = adminDoc.data();
            return email === adminData.email && password === adminData.password;
        } catch (error) {
            console.error('Error validating credentials:', error);
            return false;
        }
    }

    // Save login state
    saveLoginState(email, rememberMe) {
        const loginData = {
            email: email,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe,
            sessionId: this.generateSessionId()
        };
        
        if (rememberMe) {
            localStorage.setItem('downloadHub_auth', JSON.stringify(loginData));
        } else {
            sessionStorage.setItem('downloadHub_auth', JSON.stringify(loginData));
        }
        
        // Update last login in settings
        window.dataStorage.updateSettings({ lastLogin: new Date().toISOString() });
    }

    // Save credentials for remember me
    saveCredentials(email, password) {
        const credentials = {
            email: email,
            password: btoa(password), // Basic encoding (not secure for production)
            saved: true
        };
        localStorage.setItem('downloadHub_credentials', JSON.stringify(credentials));
    }

    // Load saved credentials
    loadSavedCredentials() {
        const saved = localStorage.getItem('downloadHub_credentials');
        if (saved) {
            const credentials = JSON.parse(saved);
            const emailField = document.getElementById('email');
            const passwordField = document.getElementById('password');
            const rememberMeField = document.getElementById('rememberMe');
            
            if (emailField && passwordField && rememberMeField) {
                emailField.value = credentials.email;
                passwordField.value = atob(credentials.password);
                rememberMeField.checked = true;
            }
        }
    }

    // Clear saved credentials
    clearSavedCredentials() {
        localStorage.removeItem('downloadHub_credentials');
    }

    // Check authentication status
    checkAuthStatus() {
        const sessionAuth = sessionStorage.getItem('downloadHub_auth');
        const localAuth = localStorage.getItem('downloadHub_auth');
        
        const authData = sessionAuth ? JSON.parse(sessionAuth) : 
                        localAuth ? JSON.parse(localAuth) : null;
        
        if (authData) {
            // Check if session is still valid (24 hours for remember me, 2 hours for session)
            const loginTime = new Date(authData.loginTime);
            const now = new Date();
            const maxAge = authData.rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
            
            if (now - loginTime > maxAge) {
                // Session expired
                this.logout();
                return false;
            }
            
            // Update admin email display if on admin page
            const adminEmailElement = document.getElementById('adminEmail');
            if (adminEmailElement) {
                adminEmailElement.textContent = authData.email;
            }
            
            return true;
        }
        
        // Redirect to login if on admin page and not authenticated
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'login.html';
        }
        
        return false;
    }

    // Handle logout
    handleLogout(event) {
        event.preventDefault();
        
        // Show confirmation dialog
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            this.logout();
        }
    }

    // Logout user
    logout() {
        // Clear auth data
        sessionStorage.removeItem('downloadHub_auth');
        localStorage.removeItem('downloadHub_auth');
        
        // Don't clear saved credentials if user wants to be remembered
        const credentials = localStorage.getItem('downloadHub_credentials');
        if (!credentials || !JSON.parse(credentials).saved) {
            this.clearSavedCredentials();
        }
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const passwordField = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    // Show loading state
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        
        if (show) {
            if (spinner) spinner.classList.remove('d-none');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connexion...';
            }
        } else {
            if (spinner) spinner.classList.add('d-none');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Se connecter';
            }
        }
    }

    // Show error message
    showError(message) {
        const alertElement = document.getElementById('loginAlert');
        const messageElement = document.getElementById('alertMessage');
        
        if (alertElement && messageElement) {
            messageElement.textContent = message;
            alertElement.classList.remove('d-none');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertElement.classList.add('d-none');
            }, 5000);
        }
    }

    // Show success message
    showSuccess(message) {
        const successElement = document.getElementById('loginSuccess');
        
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.remove('d-none');
        }
    }

    // Hide alert messages
    hideAlert() {
        const alertElement = document.getElementById('loginAlert');
        const successElement = document.getElementById('loginSuccess');
        
        if (alertElement) alertElement.classList.add('d-none');
        if (successElement) successElement.classList.add('d-none');
    }

    // Generate session ID
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Setup auto-logout after inactivity
    setupAutoLogout() {
        let inactivityTimer;
        const inactivityTime = 30 * 60 * 1000; // 30 minutes
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (this.isAuthenticated()) {
                    alert('Votre session a expiré en raison d\'inactivité. Vous allez être déconnecté.');
                    this.logout();
                }
            }, inactivityTime);
        };
        
        // Reset timer on user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Start the timer
        resetTimer();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.checkAuthStatus();
    }

    // Get current user info
    getCurrentUser() {
        const sessionAuth = sessionStorage.getItem('downloadHub_auth');
        const localAuth = localStorage.getItem('downloadHub_auth');
        
        const authData = sessionAuth ? JSON.parse(sessionAuth) : 
                        localAuth ? JSON.parse(localAuth) : null;
        
        return authData;
    }

    // Update password
    async updatePassword(currentPassword, newPassword) {
        const settings = window.dataStorage.getSettings();
        
        if (currentPassword !== settings.adminPassword) {
            throw new Error('Mot de passe actuel incorrect');
        }
        
        if (newPassword.length < 6) {
            throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
        }
        
        // Update password in settings
        window.dataStorage.updateSettings({ adminPassword: newPassword });
        
        // Update saved credentials if they exist
        const credentials = localStorage.getItem('downloadHub_credentials');
        if (credentials) {
            const credData = JSON.parse(credentials);
            credData.password = btoa(newPassword);
            localStorage.setItem('downloadHub_credentials', JSON.stringify(credData));
        }
        
        return true;
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Form validation
    validateForm() {
        const form = document.getElementById('loginForm');
        if (!form) return false;
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showError('Veuillez entrer une adresse email valide');
            return false;
        }
        
        // Password validation
        if (!password || password.length < 6) {
            this.showError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        
        return true;
    }

    // Security features
    detectSuspiciousActivity() {
        const attempts = localStorage.getItem('downloadHub_loginAttempts');
        const attemptsData = attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: null };
        
        const now = new Date();
        const lastAttempt = attemptsData.lastAttempt ? new Date(attemptsData.lastAttempt) : null;
        
        // Reset attempts if more than 1 hour has passed
        if (lastAttempt && (now - lastAttempt) > 60 * 60 * 1000) {
            attemptsData.count = 0;
        }
        
        attemptsData.count++;
        attemptsData.lastAttempt = now.toISOString();
        
        localStorage.setItem('downloadHub_loginAttempts', JSON.stringify(attemptsData));
        
        // Block if too many attempts
        if (attemptsData.count > 5) {
            this.showError('Trop de tentatives de connexion. Veuillez réessayer dans 1 heure.');
            return true;
        }
        
        return false;
    }

    // Clear login attempts on successful login
    clearLoginAttempts() {
        localStorage.removeItem('downloadHub_loginAttempts');
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Protect admin pages
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    });
}
