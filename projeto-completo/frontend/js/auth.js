// ===== GERENCIADOR DE AUTENTICAÇÃO =====

class AuthManager {
    constructor() {
        this.apiUrl = window.location.origin;
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // ===== UTILITÁRIOS =====
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');
        
        // Remover classes anteriores
        toast.classList.remove('success', 'error', 'info', 'show');
        
        // Definir ícone baseado no tipo
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = `toast-icon ${icons[type]}`;
        messageEl.textContent = message;
        toast.classList.add(type);
        
        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Esconder automaticamente após 5 segundos
        setTimeout(() => this.hideToast(), 5000);
    }
    
    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }
    
    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
    
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    validatePassword(password) {
        return password.length >= 6;
    }
    
    getPasswordStrength(password) {
        if (password.length === 0) return { strength: 'none', text: 'Digite uma senha' };
        if (password.length < 6) return { strength: 'weak', text: 'Senha muito fraca' };
        
        let score = 0;
        
        // Critérios de força
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return { strength: 'weak', text: 'Senha fraca' };
        if (score <= 3) return { strength: 'medium', text: 'Senha média' };
        return { strength: 'strong', text: 'Senha forte' };
    }
    
    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }
    
    showFieldError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    // ===== AUTENTICAÇÃO =====
    
    async register(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro no cadastro');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    async login(credentials) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro no login');
            }
            
            // Salvar token e dados do usuário
            this.token = data.token;
            this.user = data.user;
            
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    async verifyToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                this.logout();
                return false;
            }
            
            const data = await response.json();
            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
    
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // ===== INICIALIZAÇÃO DAS PÁGINAS =====
    
    initRegisterPage() {
        const form = document.getElementById('register-form');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('toggle-password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        
        // Toggle de visibilidade da senha
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
        
        // Verificação de força da senha
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const { strength, text } = this.getPasswordStrength(password);
            
            strengthFill.className = `strength-fill ${strength}`;
            strengthText.textContent = text;
        });
        
        // Submissão do formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            this.clearErrors();
            
            const formData = new FormData(form);
            const userData = {
                name: formData.get('name').trim(),
                email: formData.get('email').trim(),
                password: formData.get('password')
            };
            
            // Validações frontend
            let hasErrors = false;
            
            if (!userData.name) {
                this.showFieldError('name', 'Nome é obrigatório');
                hasErrors = true;
            }
            
            if (!userData.email) {
                this.showFieldError('email', 'E-mail é obrigatório');
                hasErrors = true;
            } else if (!this.validateEmail(userData.email)) {
                this.showFieldError('email', 'Formato de e-mail inválido');
                hasErrors = true;
            }
            
            if (!userData.password) {
                this.showFieldError('password', 'Senha é obrigatória');
                hasErrors = true;
            } else if (!this.validatePassword(userData.password)) {
                this.showFieldError('password', 'Senha deve ter no mínimo 6 caracteres');
                hasErrors = true;
            }
            
            if (hasErrors) return;
            
            // Enviar dados
            this.showLoading(true);
            
            try {
                await this.register(userData);
                
                this.showToast('Conta criada com sucesso! Redirecionando para login...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally {
                this.showLoading(false);
            }
        });
        
        // Fechar toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast();
        });
    }
    
    initLoginPage() {
        const form = document.getElementById('login-form');
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        // Toggle de visibilidade da senha
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
        
        // Submissão do formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            this.clearErrors();
            
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email').trim(),
                password: formData.get('password')
            };
            
            // Validações frontend
            let hasErrors = false;
            
            if (!credentials.email) {
                this.showFieldError('email', 'E-mail é obrigatório');
                hasErrors = true;
            } else if (!this.validateEmail(credentials.email)) {
                this.showFieldError('email', 'Formato de e-mail inválido');
                hasErrors = true;
            }
            
            if (!credentials.password) {
                this.showFieldError('password', 'Senha é obrigatória');
                hasErrors = true;
            }
            
            if (hasErrors) return;
            
            // Fazer login
            this.showLoading(true);
            
            try {
                await this.login(credentials);
                
                this.showToast(`Bem-vindo, ${this.user.name}! Redirecionando...`, 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally {
                this.showLoading(false);
            }
        });
        
        // Fechar toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast();
        });
    }
    
    // Verificar se usuário já está logado
    async checkAuthStatus() {
        if (this.isAuthenticated()) {
            const isValid = await this.verifyToken();
            if (isValid) {
                // Redirecionar para dashboard se já estiver logado
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('register.html')) {
                    window.location.href = 'dashboard.html';
                }
                return true;
            }
        }
        return false;
    }
}

// Instância global
window.AuthManager = new AuthManager();

