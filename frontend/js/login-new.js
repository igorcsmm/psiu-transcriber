// ===== LOGIN MODERNO - JAVASCRIPT =====

class LoginManager {
    constructor() {
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('login-form');
        form.addEventListener('submit', (e) => this.handleLogin(e));

        // Toggle password visibility
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // Input validation on blur
        document.getElementById('email').addEventListener('blur', () => {
            this.validateEmail();
        });

        document.getElementById('password').addEventListener('blur', () => {
            this.validatePassword();
        });

        // Clear errors on input
        document.getElementById('email').addEventListener('input', () => {
            this.clearError('email');
        });

        document.getElementById('password').addEventListener('input', () => {
            this.clearError('password');
        });

        // Toast close
        document.getElementById('toast-close').addEventListener('click', () => {
            this.hideToast();
        });

        // Auto-hide toast after 5 seconds
        this.toastTimeout = null;
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLoading) return;

        // Clear previous errors
        this.clearAllErrors();

        // Get form data
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        // Validate inputs
        if (!this.validateInputs(credentials)) {
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            // Make login request
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));

                // Show success message
                this.showToast('Login realizado com sucesso! Redirecionando...', 'success');

                // Redirect to dashboard after delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            } else {
                // Show error message
                this.showToast(data.error || 'Erro ao fazer login', 'error');
            }

        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validateInputs(credentials) {
        let isValid = true;

        // Validate email
        if (!credentials.email) {
            this.showError('email', 'E-mail é obrigatório');
            isValid = false;
        } else if (!this.isValidEmail(credentials.email)) {
            this.showError('email', 'Formato de e-mail inválido');
            isValid = false;
        }

        // Validate password
        if (!credentials.password) {
            this.showError('password', 'Senha é obrigatória');
            isValid = false;
        } else if (credentials.password.length < 6) {
            this.showError('password', 'Senha deve ter no mínimo 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    validateEmail() {
        const email = document.getElementById('email').value.trim();
        if (email && !this.isValidEmail(email)) {
            this.showError('email', 'Formato de e-mail inválido');
            return false;
        }
        this.clearError('email');
        return true;
    }

    validatePassword() {
        const password = document.getElementById('password').value;
        if (password && password.length < 6) {
            this.showError('password', 'Senha deve ter no mínimo 6 caracteres');
            return false;
        }
        this.clearError('password');
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.style.borderColor = '#ef4444';
        inputElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    }

    clearError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        errorElement.classList.remove('show');
        inputElement.style.borderColor = '#e5e7eb';
        inputElement.style.boxShadow = 'none';
    }

    clearAllErrors() {
        this.clearError('email');
        this.clearError('password');
    }

    setLoading(loading) {
        this.isLoading = loading;
        const loginBtn = document.getElementById('login-btn');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (loading) {
            loginBtn.classList.add('loading');
            loadingOverlay.classList.add('show');
        } else {
            loginBtn.classList.remove('loading');
            loadingOverlay.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        // Set message
        toastMessage.textContent = message;
        
        // Set icon based on type
        toastIcon.className = 'toast-icon';
        switch (type) {
            case 'success':
                toastIcon.classList.add('fas', 'fa-check-circle');
                break;
            case 'error':
                toastIcon.classList.add('fas', 'fa-exclamation-circle');
                break;
            case 'info':
            default:
                toastIcon.classList.add('fas', 'fa-info-circle');
                break;
        }
        
        // Set toast type
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Auto-hide after 5 seconds
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
        
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toastTimeout = null;
        }
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            // User is already logged in, redirect to dashboard
            this.showToast('Você já está logado. Redirecionando...', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    }

    // Utility method to check if user is authenticated
    static isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        return !!(token && userData);
    }

    // Utility method to get user data
    static getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Utility method to logout
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Export for use in other modules
window.LoginManager = LoginManager;

