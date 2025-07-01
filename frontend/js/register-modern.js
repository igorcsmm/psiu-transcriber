// ===== CADASTRO MODERNO - JAVASCRIPT =====

class RegisterManager {
    constructor() {
        this.form = document.getElementById('register-form');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirm-password');
        this.registerBtn = document.getElementById('register-btn');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordToggles();
    }

    setupEventListeners() {
        // Submissão do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Validação em tempo real
        this.nameInput.addEventListener('input', () => this.validateName());
        this.nameInput.addEventListener('blur', () => this.validateName());
        
        this.emailInput.addEventListener('input', () => this.validateEmail());
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        
        this.passwordInput.addEventListener('input', () => {
            this.validatePassword();
            this.updatePasswordStrength();
            this.validateConfirmPassword();
        });
        
        this.confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
        this.confirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
    }

    setupPasswordToggles() {
        // Toggle para senha
        const togglePassword = document.getElementById('toggle-password');
        togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility(this.passwordInput, togglePassword);
        });

        // Toggle para confirmar senha
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        toggleConfirmPassword.addEventListener('click', () => {
            this.togglePasswordVisibility(this.confirmPasswordInput, toggleConfirmPassword);
        });
    }

    togglePasswordVisibility(input, button) {
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    validateName() {
        const name = this.nameInput.value.trim();
        const isValid = name.length >= 2;
        
        this.updateFieldStatus('name', isValid, name.length > 0);
        
        if (name.length > 0 && !isValid) {
            this.showFieldError('name', 'O nome deve ter pelo menos 2 caracteres');
        } else {
            this.hideFieldError('name');
        }
        
        return isValid;
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        this.updateFieldStatus('email', isValid, email.length > 0);
        
        if (email.length > 0 && !isValid) {
            this.showFieldError('email', 'Por favor, insira um e-mail válido');
        } else {
            this.hideFieldError('email');
        }
        
        return isValid;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const isValid = password.length >= 6;
        
        this.updateFieldStatus('password', isValid, password.length > 0);
        
        if (password.length > 0 && !isValid) {
            this.showFieldError('password', 'A senha deve ter pelo menos 6 caracteres');
        } else {
            this.hideFieldError('password');
        }
        
        return isValid;
    }

    validateConfirmPassword() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const isValid = confirmPassword === password && confirmPassword.length > 0;
        
        this.updateFieldStatus('confirm-password', isValid, confirmPassword.length > 0);
        
        if (confirmPassword.length > 0 && !isValid) {
            this.showFieldError('confirm-password', 'As senhas não coincidem');
        } else {
            this.hideFieldError('confirm-password');
        }
        
        return isValid;
    }

    updatePasswordStrength() {
        const password = this.passwordInput.value;
        const strengthContainer = document.getElementById('password-strength');
        
        if (password.length === 0) {
            strengthContainer.classList.remove('show');
            return;
        }
        
        strengthContainer.classList.add('show');
        
        let strength = 0;
        let strengthText = '';
        let strengthClass = '';
        
        // Critérios de força
        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        if (strength <= 2) {
            strengthText = 'Fraca';
            strengthClass = 'strength-weak';
        } else if (strength <= 3) {
            strengthText = 'Média';
            strengthClass = 'strength-medium';
        } else {
            strengthText = 'Forte';
            strengthClass = 'strength-strong';
        }
        
        strengthContainer.innerHTML = `
            <div class="strength-text">Força da senha: ${strengthText}</div>
            <div class="strength-bar ${strengthClass}">
                <div class="strength-fill"></div>
            </div>
        `;
    }

    updateFieldStatus(fieldName, isValid, hasContent) {
        const statusElement = document.getElementById(`${fieldName}-status`);
        
        if (!hasContent) {
            statusElement.innerHTML = '';
            statusElement.className = 'input-status';
            return;
        }
        
        if (isValid) {
            statusElement.innerHTML = '<i class="fas fa-check"></i>';
            statusElement.className = 'input-status valid';
        } else {
            statusElement.innerHTML = '<i class="fas fa-times"></i>';
            statusElement.className = 'input-status invalid';
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    hideFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        errorElement.classList.remove('show');
    }

    async handleRegister() {
        // Validar todos os campos
        const isNameValid = this.validateName();
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        const isConfirmPasswordValid = this.validateConfirmPassword();
        
        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            this.showToast('error', 'Erro de Validação', 'Por favor, corrija os erros no formulário');
            return;
        }
        
        // Dados do formulário
        const formData = {
            name: this.nameInput.value.trim(),
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value
        };
        
        // Mostrar loading
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', 'Conta Criada!', 'Redirecionando para o login...');
                
                // Redirecionar após 2 segundos
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                
            } else {
                this.showToast('error', 'Erro no Cadastro', data.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showToast('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.registerBtn.classList.add('loading');
            this.registerBtn.disabled = true;
        } else {
            this.registerBtn.classList.remove('loading');
            this.registerBtn.disabled = false;
        }
    }

    showToast(type, title, message) {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        
        let icon = '';
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                icon = 'fas fa-exclamation-circle';
                break;
            case 'info':
                icon = 'fas fa-info-circle';
                break;
        }
        
        toast.innerHTML = `
            <i class="toast-icon ${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remover após 5 segundos
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 5000);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});

