// ===== GERENCIADOR DO DASHBOARD =====

class DashboardManager {
    constructor() {
        this.authManager = window.AuthManager;
        this.init();
    }

    async init() {
        // Verificar autenticação
        const isAuthenticated = await this.authManager.checkAuthStatus();
        
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.loadStats();
    }

    setupEventListeners() {
        // Menu do usuário
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });

        // Links do dropdown
        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        document.getElementById('profile-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.authManager.showToast('Funcionalidade em desenvolvimento', 'info');
        });

        document.getElementById('settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.authManager.showToast('Funcionalidade em desenvolvimento', 'info');
        });

        // Botões dos cards
        document.getElementById('open-gpt').addEventListener('click', () => {
            window.location.href = 'index.html#gpt';
        });

        document.getElementById('view-history').addEventListener('click', () => {
            this.authManager.showToast('Funcionalidade em desenvolvimento', 'info');
        });

        document.getElementById('open-settings').addEventListener('click', () => {
            window.location.href = 'index.html#config';
        });

        // Fechar toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.authManager.hideToast();
        });
    }

    loadUserData() {
        const user = this.authManager.user;
        
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
        // Em uma aplicação real, estes dados viriam do backend
        
        const stats = {
            totalTranscriptions: Math.floor(Math.random() * 50) + 1,
            totalMinutes: Math.floor(Math.random() * 500) + 10,
            gptConversations: Math.floor(Math.random() * 20) + 1,
            memberSince: this.formatMemberSince()
        };

        // Animar contadores
        this.animateCounter('total-transcriptions', stats.totalTranscriptions);
        this.animateCounter('total-minutes', stats.totalMinutes);
        this.animateCounter('gpt-conversations', stats.gptConversations);
        
        document.getElementById('member-since').textContent = stats.memberSince;
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const duration = 2000; // 2 segundos
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

    formatMemberSince() {
        // Simular data de cadastro baseada no usuário atual
        const user = this.authManager.user;
        if (user && user.createdAt) {
            const date = new Date(user.createdAt);
            return date.toLocaleDateString('pt-BR', { 
                month: 'short', 
                year: 'numeric' 
            });
        }
        
        // Fallback para data atual
        const now = new Date();
        return now.toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: 'numeric' 
        });
    }

    logout() {
        this.authManager.showToast('Fazendo logout...', 'info');
        
        setTimeout(() => {
            this.authManager.logout();
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});

