// ===== DASHBOARD MODERNO - JAVASCRIPT =====

class DashboardManager {
    constructor() {
        this.sidebarOpen = false;
        this.init();
    }

    async init() {
        // Verificar autenticação
        const isAuthenticated = this.checkAuthStatus();
        
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.loadStats();
        this.setupResponsive();
    }

    // Verificar status de autenticação
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            return false;
        }

        try {
            this.user = JSON.parse(userData);
            return true;
        } catch (error) {
            console.error('Erro ao parsear dados do usuário:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            return false;
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        sidebarToggle?.addEventListener('click', () => {
            this.sidebarOpen = !this.sidebarOpen;
            sidebar.classList.toggle('open', this.sidebarOpen);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation links
        document.getElementById('nav-transcribe').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });

        document.getElementById('nav-gpt').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html#gpt';
        });

        document.getElementById('nav-history').addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('Funcionalidade em desenvolvimento', 'info');
        });

        document.getElementById('nav-settings').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html#config';
        });

        // Quick actions
        document.getElementById('action-upload').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('action-gpt').addEventListener('click', () => {
            window.location.href = 'index.html#gpt';
        });

        document.getElementById('action-history').addEventListener('click', () => {
            this.showToast('Funcionalidade em desenvolvimento', 'info');
        });

        // Toast close
        document.querySelector('.toast-close')?.addEventListener('click', () => {
            this.hideToast();
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            
            if (window.innerWidth <= 1024 && 
                this.sidebarOpen && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                this.sidebarOpen = false;
                sidebar.classList.remove('open');
            }
        });
    }

    setupResponsive() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                this.sidebarOpen = false;
                document.querySelector('.sidebar').classList.remove('open');
            }
        });
    }

    loadUserData() {
        const user = this.user;
        
        if (user) {
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-email').textContent = user.email;
            
            // Gerar avatar com iniciais
            const initials = user.name.split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            const avatar = document.getElementById('user-avatar');
            avatar.innerHTML = initials;
        }
    }

    loadStats() {
        // Simular carregamento de estatísticas
        const stats = {
            totalTranscriptions: Math.floor(Math.random() * 50) + 1,
            totalMinutes: Math.floor(Math.random() * 500) + 10,
            gptConversations: Math.floor(Math.random() * 20) + 1
        };

        // Animar contadores
        this.animateCounter('total-transcriptions', stats.totalTranscriptions);
        this.animateCounter('total-minutes', stats.totalMinutes);
        this.animateCounter('gpt-conversations', stats.gptConversations);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const duration = 2000;
        const startTime = Date.now();
        const startValue = 0;

        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue;
            }
        };

        requestAnimationFrame(updateCounter);
    }

    logout() {
        this.showToast('Fazendo logout...', 'info');
        
        setTimeout(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('rememberLogin');
            window.location.href = 'login.html';
        }, 1000);
    }

    // Métodos para toast
    showToast(message, type = 'info') {
        // Implementação simples de toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon fas fa-info-circle"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    hideToast() {
        const toasts = document.querySelectorAll('.toast');
        toasts.forEach(toast => toast.remove());
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});

