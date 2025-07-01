// ===== LOGIN MODERNO - JAVASCRIPT =====

class LoginManager {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Toggle de senha
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Validação em tempo real
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail());
            emailInput.addEventListener('input', () => this.clearError('email'));
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('blur', () => this.validatePassword());
            passwordInput.addEventListener('input', () => this.clearError('password'));
        }
    }

    // Verificar se já está logado
    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.verifyToken(token);
        }
    }

    // Verificar token válido
    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showToast('Você já está logado! Redirecionando...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                }
            }
        } catch (error) {
            console.log('Token inválido ou expirado');
            localStorage.removeItem('authToken');
        }
    }

    // Validar e-mail
    validateEmail() {
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showFieldError('email', 'E-mail é obrigatório');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'E-mail inválido');
            return false;
        }
        
        this.showFieldSuccess('email');
        return true;
    }

    // Validar senha
    validatePassword() {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('passwordError');
        const password = passwordInput.value;
        
        if (!password) {
            this.showFieldError('password', 'Senha é obrigatória');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', 'Senha deve ter pelo menos 6 caracteres');
            return false;
        }
        
        this.showFieldSuccess('password');
        return true;
    }

    // Mostrar erro no campo
    showFieldError(fieldName, message) {
        const formGroup = document.getElementById(fieldName).closest('.form-group');
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    // Mostrar sucesso no campo
    showFieldSuccess(fieldName) {
        const formGroup = document.getElementById(fieldName).closest('.form-group');
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        errorElement.classList.remove('show');
    }

    // Limpar erro do campo
    clearError(fieldName) {
        const formGroup = document.getElementById(fieldName).closest('.form-group');
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        formGroup.classList.remove('error');
        errorElement.classList.remove('show');
    }

    // Toggle visibilidade da senha
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    // Processar login
    async handleLogin(event) {
        event.preventDefault();
        
        // Validar campos
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        
        if (!emailValid || !passwordValid) {
            this.showToast('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        // Mostrar loading
        this.setLoading(true);

        // Obter dados do formulário
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Salvar token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                if (rememberMe) {
                    localStorage.setItem('rememberLogin', 'true');
                }

                this.showToast('Login realizado com sucesso!', 'success');
                
                // Redirecionar após delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } else {
                this.showToast(data.message || 'Erro ao fazer login', 'error');
            }

        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    // Controlar estado de loading
    setLoading(loading) {
        const loginButton = document.getElementById('loginButton');
        
        if (loading) {
            loginButton.classList.add('loading');
            loginButton.disabled = true;
        } else {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
        }
    }

    // Mostrar toast de notificação
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        // Configurar ícone e classe
        toast.classList.remove('error');
        if (type === 'error') {
            toast.classList.add('error');
            toastIcon.className = 'toast-icon fas fa-exclamation-circle';
        } else {
            toastIcon.className = 'toast-icon fas fa-check-circle';
        }
        
        // Configurar mensagem
        toastMessage.textContent = message;
        
        // Mostrar toast
        toast.classList.add('show');
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    // Esconder toast
    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }
}

// Função global para esconder toast
function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Adicionar animações extras
document.addEventListener('DOMContentLoaded', () => {
    // Animação de entrada dos elementos
    const elements = document.querySelectorAll('.form-group, .login-button, .divider, .register-link');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 * (index + 1));
    });
});

