// AssemblyAI Transcriber - Frontend JavaScript
class AssemblyAITranscriber {
    constructor() {
        this.apiConfigured = false;
        this.currentFile = null;
        this.currentTranscriptId = null;
        this.pollingInterval = null;
        this.transcriptionResult = null;
        this.gptConfigured = false;
        this.currentAssistant = null;
        this.chatHistory = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGPTEventListeners();
        this.setupDragAndDrop();
        this.checkApiStatus();
    }

    // Verificar status da API
    async checkApiStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.success && data.apiConfigured) {
                this.apiConfigured = true;
                this.showUploadSection();
            } else {
                this.showConfigSection();
            }
        } catch (error) {
            console.error('Erro ao verificar status da API:', error);
            this.showConfigSection();
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Configuração da API
        const toggleApiKey = document.getElementById('toggle-api-key');
        if (toggleApiKey) {
            console.log('Event listener adicionado para toggle-api-key');
            toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());
        }
        
        const saveConfig = document.getElementById('save-config');
        if (saveConfig) {
            console.log('Event listener adicionado para save-config');
            saveConfig.addEventListener('click', () => {
                console.log('Botão Salvar Configuração clicado!');
                this.saveConfig();
            });
        } else {
            console.log('Elemento save-config não encontrado!');
        }
        
        const testApi = document.getElementById('test-api');
        if (testApi) {
            console.log('Event listener adicionado para test-api');
            testApi.addEventListener('click', () => {
                console.log('Botão Testar API clicado!');
                this.testApi();
            });
        } else {
            console.log('Elemento test-api não encontrado!');
        }

        // Botão Dashboard
        const goToDashboard = document.getElementById('go-to-dashboard');
        if (goToDashboard) {
            goToDashboard.addEventListener('click', () => {
                // Verificar se o usuário está logado
                const token = localStorage.getItem('authToken');
                if (token) {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/login.html';
                }
            });
        }

        // Upload de arquivo
        const fileInput = document.getElementById('audio-file-input');
        const selectBtn = document.getElementById('select-file-btn');

        if (selectBtn && fileInput) {
            selectBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        }

        // Controles
        const changeApiBtn = document.getElementById('change-api-btn');
        if (changeApiBtn) {
            changeApiBtn.addEventListener('click', () => this.showConfigSection());
        }
        
        const changeFileBtn = document.getElementById('change-file-btn');
        if (changeFileBtn) {
            changeFileBtn.addEventListener('click', () => this.resetToUpload());
        }
        
        const startTranscription = document.getElementById('start-transcription');
        if (startTranscription) {
            startTranscription.addEventListener('click', () => this.startTranscription());
        }
        
        const newTranscriptionBtn = document.getElementById('new-transcription-btn');
        if (newTranscriptionBtn) {
            newTranscriptionBtn.addEventListener('click', () => this.resetToUpload());
        }

        // Ações de resultado
        const editTranscription = document.getElementById('edit-transcription');
        if (editTranscription) {
            editTranscription.addEventListener('click', () => this.editTranscription());
        }
        
        const copyTranscription = document.getElementById('copy-transcription');
        if (copyTranscription) {
            copyTranscription.addEventListener('click', () => this.copyTranscription());
        }
        
        const downloadTxt = document.getElementById('download-txt');
        if (downloadTxt) {
            downloadTxt.addEventListener('click', () => this.downloadTXT());
        }
        
        const downloadPdf = document.getElementById('download-pdf');
        if (downloadPdf) {
            downloadPdf.addEventListener('click', () => this.downloadPDF());
        }
    }

    // Configurar event listeners do GPT
    setupGPTEventListeners() {
        // Verificar se elementos existem antes de adicionar event listeners
        const openGptChat = document.getElementById('open-gpt-chat');
         // Event listeners
        const gptButton = document.getElementById('open-gpt-chat');
        if (gptButton) {
            gptButton.addEventListener('click', () => this.openGPTModal());
        }

        const closeModal = document.getElementById('close-gpt-chat');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeGPTModal());
        }

        // NOVO EVENT LISTENER PARA VALIDAR API - REFAZER DO ZERO
        this.setupValidateButton();

        const toggleApiKey = document.getElementById('toggle-api-key');
        if (toggleApiKey) {
            toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());
        }
        
        const openaiApiKey = document.getElementById('openai-api-key');
        if (openaiApiKey) {
            openaiApiKey.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleValidateClick();
                }
            });
        }
        
        const sendChatMessage = document.getElementById('send-message');
        if (sendChatMessage) {
            sendChatMessage.addEventListener('click', () => this.sendMessage());
        }
        
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Seletor de modelo GPT
        const gptModelSelect = document.getElementById('gpt-model-select');
        if (gptModelSelect) {
            gptModelSelect.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                console.log('Modelo selecionado:', this.selectedModel);
            });
        }
        
        // Botão Novo Chat
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        
        // Ações rápidas
        const translateText = document.getElementById('translate-text');
        if (translateText) {
            translateText.addEventListener('click', () => this.translateText());
        }
        
        const summarizeText = document.getElementById('summarize-text');
        if (summarizeText) {
            summarizeText.addEventListener('click', () => this.summarizeText());
        }
        
        const analyzeText = document.getElementById('analyze-text');
        if (analyzeText) {
            analyzeText.addEventListener('click', () => this.analyzeText());
        }
        
        // Fechar modal clicando fora
        const gptModal = document.getElementById('gpt-modal');
        if (gptModal) {
            gptModal.addEventListener('click', (e) => {
                if (e.target === gptModal) {
                    this.closeGPTModal();
                }
            });
        }
    }

    // Abrir modal GPT
    openGPTModal() {
        document.getElementById('gpt-modal').style.display = 'flex';
        
        if (!this.gptConfigured) {
            document.getElementById('gpt-config').style.display = 'block';
            document.getElementById('gpt-chat').style.display = 'none';
        } else {
            document.getElementById('gpt-config').style.display = 'none';
            document.getElementById('gpt-chat').style.display = 'block';
        }
    }

    // NOVO SISTEMA DE CHAT GPT - VERSÃO COMPLETA COM CONFIGURAÇÃO
    openGPTModal() {
        const modal = document.getElementById('gpt-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Sempre mostrar a configuração primeiro
            this.showConfigSection();
        }
    }

    closeGPTModal() {
        const modal = document.getElementById('gpt-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Mostrar seção de configuração
    showConfigSection() {
        const configSection = document.getElementById('gpt-config-section');
        const chatSection = document.getElementById('new-gpt-chat');
        
        if (configSection) configSection.style.display = 'block';
        if (chatSection) chatSection.style.display = 'none';
        
        // Focar no campo de API key
        setTimeout(() => {
            const apiKeyInput = document.getElementById('openai-api-key');
            if (apiKeyInput) {
                apiKeyInput.focus();
            }
        }, 100);
    }

    // Mostrar seção do chat
    // NOVA FUNÇÃO PARA CONFIGURAR O BOTÃO VALIDAR - REFAZER DO ZERO
    setupValidateButton() {
        // Usar setTimeout para garantir que o DOM esteja pronto
        setTimeout(() => {
            const validateBtn = document.getElementById('validate-api-key');
            console.log('Configurando botão validar:', validateBtn);
            
            if (validateBtn) {
                // Remover event listeners antigos
                validateBtn.replaceWith(validateBtn.cloneNode(true));
                
                // Pegar a nova referência após clonagem
                const newValidateBtn = document.getElementById('validate-api-key');
                
                // Adicionar novo event listener
                newValidateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Botão validar clicado!');
                    this.handleValidateClick();
                });
                
                console.log('Event listener adicionado com sucesso');
            } else {
                console.error('Botão validate-api-key não encontrado');
            }
        }, 100);
    }

    // NOVA FUNÇÃO PARA LIDAR COM O CLIQUE - REFAZER DO ZERO
    async handleValidateClick() {
        console.log('handleValidateClick executado');
        
        const apiKeyInput = document.getElementById('openai-api-key');
        const validateBtn = document.getElementById('validate-api-key');
        
        if (!apiKeyInput || !validateBtn) {
            console.error('Elementos não encontrados');
            return;
        }

        const apiKey = apiKeyInput.value.trim();
        console.log('Chave da API:', apiKey);

        // Validação básica
        if (!apiKey) {
            alert('Por favor, insira sua chave da API OpenAI');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            alert('Chave da API deve começar com "sk-"');
            return;
        }

        // Mostrar loading
        const originalText = validateBtn.innerHTML;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
        validateBtn.disabled = true;

        try {
            console.log('Iniciando validação...');
            
            // Fazer chamada real para o endpoint de configuração
            const response = await fetch('/api/gpt/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey: apiKey })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Validação concluída, mostrando chat...');
                
                // Salvar a chave
                this.apiKey = apiKey;
                this.gptConfigured = true;
                
                // Mostrar sucesso
                alert('API validada com sucesso!');
                
                // Mostrar o chat IMEDIATAMENTE
                this.showChatNow();
            } else {
                throw new Error(data.error || 'Erro na validação');
            }
            
        } catch (error) {
            console.error('Erro na validação:', error);
            alert('Erro ao validar a API. Verifique sua chave.');
        } finally {
            // Restaurar botão
            validateBtn.innerHTML = originalText;
            validateBtn.disabled = false;
        }
    }

    // NOVA FUNÇÃO PARA MOSTRAR O CHAT - REFAZER DO ZERO
    showChatNow() {
        console.log('showChatNow executado');
        
        const configSection = document.getElementById('gpt-config-section');
        const chatSection = document.getElementById('new-gpt-chat');
        
        console.log('Config section:', configSection);
        console.log('Chat section:', chatSection);
        
        if (configSection) {
            configSection.style.display = 'none';
            console.log('Config section ocultada');
        }
        
        if (chatSection) {
            chatSection.style.display = 'flex';
            chatSection.style.flexDirection = 'column';
            console.log('Chat section exibida');
        }
        
        // Definir modelo padrão
        const modelSelect = document.getElementById('gpt-model-select');
        if (modelSelect) {
            this.selectedModel = modelSelect.value || 'gpt-4o';
            console.log('Modelo padrão definido:', this.selectedModel);
        }
        
        // Adicionar mensagem de boas-vindas
        this.addWelcomeMessage();
        
        // Focar no campo de input
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
                console.log('Foco no campo de input');
            }
        }, 500);
    }

    showChatSection() {
        const configSection = document.getElementById('gpt-config-section');
        const chatSection = document.getElementById('new-gpt-chat');
        
        if (configSection) configSection.style.display = 'none';
        if (chatSection) chatSection.style.display = 'block';
        
        // Adicionar mensagem de boas-vindas
        this.addWelcomeMessage();
        
        // Focar no campo de input do chat
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
    }

    // Validar chave da API
    async validateApiKey() {
        const apiKeyInput = document.getElementById('openai-api-key');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showToast('Por favor, insira sua chave da API OpenAI', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showToast('Chave da API deve começar com "sk-"', 'error');
            return;
        }

        // Mostrar loading
        const validateBtn = document.getElementById('validate-api-key');
        const originalText = validateBtn.innerHTML;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
        validateBtn.disabled = true;

        try {
            // Simular validação da API (você pode integrar com API real aqui)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Salvar a chave (em produção, salve de forma segura)
            this.apiKey = apiKey;
            this.gptConfigured = true;
            
            this.showToast('API validada com sucesso!', 'success');
            
            // Mostrar o chat
            setTimeout(() => {
                this.showChatSection();
            }, 500);
            
        } catch (error) {
            console.error('Erro na validação:', error);
            this.showToast('Erro ao validar a API. Verifique sua chave.', 'error');
        } finally {
            validateBtn.innerHTML = originalText;
            validateBtn.disabled = false;
        }
    }

    // Adicionar mensagem de boas-vindas
    addWelcomeMessage() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Limpar mensagens existentes
        chatMessages.innerHTML = '';
        
        const currentTime = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const welcomeMessage = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        Olá! Sou seu assistente GPT.<br>
                        Como posso ajudar você hoje?
                    </div>
                    <div class="message-time">${currentTime}</div>
                </div>
            </div>
        `;
        
        chatMessages.innerHTML = welcomeMessage;
    }

    // Iniciar novo chat
    startNewChat() {
        // Limpar histórico de mensagens
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Limpar campo de input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = '';
        }
        
        // Adicionar nova mensagem de boas-vindas
        this.addWelcomeMessage();
        
        // Focar no campo de input
        setTimeout(() => {
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
        
        console.log('Novo chat iniciado');
    }

    // Toggle para mostrar/ocultar senha da API
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('openai-api-key');
        const toggleBtn = document.getElementById('toggle-api-key');
        const icon = toggleBtn.querySelector('i');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            apiKeyInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    // Função para adicionar mensagem ao chat (corrigindo o timestamp)
    addMessageToChat(type, text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        // Corrigir o timestamp - usar JavaScript para gerar o horário atual
        const currentTime = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${type === 'bot' ? 'fa-robot' : 'fa-user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${currentTime}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        
        // Scroll para a última mensagem
        const container = document.getElementById('chat-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Mostrar indicador de digitação
    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span>GPT está digitando</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingDiv);
        
        // Scroll para baixo
        const container = document.getElementById('chat-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Remover indicador de digitação
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Função principal para enviar mensagem
    // Carregar modelos
    async loadModels() {
        try {
            const response = await fetch('/api/gpt/models');
            const data = await response.json();

            if (data.success) {
                const select = document.getElementById('assistant-select');
                select.innerHTML = '';
                
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = `${model.name} - ${model.description}`;
                    select.appendChild(option);
                });
                
                // Selecionar GPT-4o como padrão
                select.value = 'gpt-4o';
                this.currentModel = 'gpt-4o';
                
                this.showToast(`${data.models.length} modelos carregados`, 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar modelos:', error);
            this.showToast('Erro ao carregar modelos', 'error');
        }
    }

    // Carregar assistentes (mantido para compatibilidade)
    async loadAssistants() {
        try {
            const response = await fetch('/api/gpt/assistants');
            const data = await response.json();

            if (data.success) {
                const select = document.getElementById('assistant-select');
                select.innerHTML = '<option value="">GPT Padrão (Chat Livre)</option>';
                
                data.assistants.forEach(assistant => {
                    const option = document.createElement('option');
                    option.value = assistant.id;
                    option.textContent = assistant.name;
                    select.appendChild(option);
                });
                
                this.showToast(`${data.assistants.length} assistentes carregados`, 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar assistentes:', error);
            this.showToast('Erro ao carregar assistentes', 'error');
        }
    }

    // Selecionar modelo
    selectModel() {
        const select = document.getElementById('assistant-select');
        const modelId = select.value;
        
        if (modelId) {
            this.currentModel = modelId;
            const modelName = select.options[select.selectedIndex].text.split(' - ')[0];
            this.showToast(`Modelo selecionado: ${modelName}`, 'info');
        } else {
            this.currentModel = 'gpt-4o';
            this.showToast('Usando GPT-4o (padrão)', 'info');
        }
        
        // Limpar histórico do chat ao trocar modelo
        this.chatHistory = [];
        document.getElementById('chat-messages').innerHTML = '';
        
        // Adicionar mensagem de boas-vindas
        this.addMessageToChat('assistant', `Olá! Agora estou usando o modelo ${this.currentModel}. Como posso ajudar você hoje?`);
    }

    // Selecionar assistente (mantido para compatibilidade)
    selectAssistant() {
        const select = document.getElementById('assistant-select');
        const assistantId = select.value;
        
        if (assistantId) {
            // Buscar detalhes do assistente
            this.currentAssistant = assistantId;
            this.showToast(`Assistente selecionado: ${select.options[select.selectedIndex].text}`, 'info');
        } else {
            this.currentAssistant = null;
            this.showToast('Usando GPT padrão', 'info');
        }
        
        // Limpar histórico do chat
        this.chatHistory = [];
        document.getElementById('chat-messages').innerHTML = '';
    }

    // Enviar mensagem
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Adicionar mensagem do usuário
        this.addMessageToChat('user', message);
        input.value = '';
        
        // Mostrar indicador de digitação
        this.showTypingIndicator();
        
        try {
            // Usar modelo selecionado ou assistente
            const endpoint = this.currentAssistant ? '/api/gpt/assistant-chat' : '/api/gpt/chat';
            const body = {
                message: message,
                context: this.transcriptionResult ? this.transcriptionResult.text : null
            };
            
            if (this.currentAssistant) {
                body.assistantId = this.currentAssistant;
            } else if (this.currentModel) {
                body.model = this.currentModel;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToChat('assistant', data.response);
                
                // Mostrar qual modelo foi usado
                if (data.model) {
                    console.log(`Resposta gerada pelo modelo: ${data.model}`);
                }
            } else {
                this.addMessageToChat('assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem.');
                this.showToast(data.error || 'Erro no chat', 'error');
            }
        } catch (error) {
            console.error('Erro no chat:', error);
            this.addMessageToChat('assistant', 'Erro de conexão. Tente novamente.');
        } finally {
            this.hideTypingIndicator();
            
            // CORREÇÃO: Garantir que o campo de input permaneça visível após enviar mensagem
            const chatInput = document.getElementById('chat-input');
            const sendButton = document.getElementById('send-message');
            const inputGroup = chatInput.parentElement;
            const chatInputContainer = inputGroup.parentElement;
            
            // Forçar visibilidade dos elementos
            chatInputContainer.style.display = 'block';
            inputGroup.style.display = 'flex';
            chatInput.style.display = 'block';
            sendButton.style.display = 'block';
            
            // Focar no campo de input para continuar a conversa
            chatInput.focus();
        }
    }

    // Adicionar mensagem ao chat
    addMessageToChat(sender, message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        messageDiv.innerHTML = `
            <div class="message-icon">
                <i class="${icon}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Mostrar indicador de digitação
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Esconder indicador de digitação
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Traduzir texto
    async translateText() {
        if (!this.transcriptionResult) {
            this.showToast('Nenhuma transcrição disponível para traduzir', 'error');
            return;
        }
        
        const language = prompt('Para qual idioma traduzir? (en, es, fr, de, it, ja, ko, zh):', 'en');
        if (!language) return;
        
        this.showLoading('Traduzindo...');
        
        try {
            const response = await fetch('/api/gpt/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: this.transcriptionResult.text,
                    targetLanguage: language
                })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToChat('assistant', `**Tradução para ${language.toUpperCase()}:**\n\n${data.translation}`);
                this.showToast('Texto traduzido com sucesso!', 'success');
            } else {
                this.showToast(data.error || 'Erro na tradução', 'error');
            }
        } catch (error) {
            console.error('Erro na tradução:', error);
            this.showToast('Erro na tradução', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Resumir texto
    async summarizeText() {
        if (!this.transcriptionResult) {
            this.showToast('Nenhuma transcrição disponível para resumir', 'error');
            return;
        }
        
        this.showLoading('Gerando resumo...');
        
        try {
            const response = await fetch('/api/gpt/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: this.transcriptionResult.text
                })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToChat('assistant', `**Resumo:**\n\n${data.summary}`);
                this.showToast('Resumo gerado com sucesso!', 'success');
            } else {
                this.showToast(data.error || 'Erro no resumo', 'error');
            }
        } catch (error) {
            console.error('Erro no resumo:', error);
            this.showToast('Erro no resumo', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Analisar texto
    async analyzeText() {
        if (!this.transcriptionResult) {
            this.showToast('Nenhuma transcrição disponível para analisar', 'error');
            return;
        }
        
        this.showLoading('Analisando...');
        
        try {
            const response = await fetch('/api/gpt/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: this.transcriptionResult.text
                })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToChat('assistant', `**Análise:**\n\n${data.analysis}`);
                this.showToast('Análise gerada com sucesso!', 'success');
            } else {
                this.showToast(data.error || 'Erro na análise', 'error');
            }
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showToast('Erro na análise', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Alternar visibilidade da chave da API
    toggleApiKeyVisibility() {
        const input = document.getElementById('api-key');
        const icon = document.getElementById('toggle-api-key').querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    // Salvar configuração da API
    async saveConfig() {
        const apiKey = document.getElementById('api-key').value.trim();

        if (!apiKey) {
            this.showToast('Por favor, insira sua chave da API AssemblyAI', 'error');
            return;
        }

        this.showLoading('Configurando API...');

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            const data = await response.json();

            if (data.success) {
                this.apiConfigured = true;
                this.showToast('API configurada com sucesso!', 'success');
                this.showUploadSection();
            } else {
                this.showToast(data.error || 'Erro ao configurar API', 'error');
            }
        } catch (error) {
            console.error('Erro ao configurar API:', error);
            this.showToast('Erro de conexão com o servidor', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Testar API
    async testApi() {
        const apiKey = document.getElementById('api-key').value.trim();

        if (!apiKey) {
            this.showToast('Por favor, insira sua chave da API primeiro', 'error');
            return;
        }

        this.showLoading('Testando conexão...');

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('✅ API testada com sucesso! Conexão funcionando.', 'success');
            } else {
                this.showToast('❌ ' + (data.error || 'Erro ao testar API'), 'error');
            }
        } catch (error) {
            console.error('Erro ao testar API:', error);
            this.showToast('❌ Erro de conexão com o servidor', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Mostrar seção de configuração
    showConfigSection() {
        document.getElementById('config-section').style.display = 'block';
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('file-info-section').style.display = 'none';
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
    }

    // Mostrar seção de upload
    showUploadSection() {
        document.getElementById('config-section').style.display = 'none';
        document.getElementById('upload-section').style.display = 'block';
        document.getElementById('file-info-section').style.display = 'none';
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
    }

    // Configurar drag and drop
    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        uploadArea.addEventListener('click', () => {
            document.getElementById('audio-file-input').click();
        });
    }

    // Processar seleção de arquivo
    handleFileSelect(file) {
        if (!file) return;

        // Validar tipo de arquivo
        // Formatos suportados - ATUALIZADO PARA INCLUIR VÍDEO
        const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/webm'];
        const validVideoTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska'];
        const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
        
        const isValidAudioType = validAudioTypes.some(type => file.type.includes(type));
        const isValidVideoType = validVideoTypes.some(type => file.type.includes(type));
        const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValidAudioType && !isValidVideoType && !isValidExtension) {
            this.showToast('Formato não suportado. Use MP3, WAV, M4A, OGG, FLAC, AAC, MP4, AVI, MOV, WMV, FLV, WebM ou MKV', 'error');
            return;
        }

        // Validar tamanho (5GB - LIMITE MÁXIMO DA ASSEMBLYAI)
        if (file.size > 5 * 1024 * 1024 * 1024) {
            this.showToast('Arquivo muito grande. Máximo 5GB (limite da AssemblyAI)', 'error');
            return;
        }

        // Verificar se é arquivo de vídeo
        const isVideo = isValidVideoType || ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );

        if (isVideo) {
            this.showToast('Arquivo de vídeo detectado. Será convertido para áudio automaticamente.', 'info');
        }

        this.currentFile = file;
        this.uploadFile(file);
    }

    // Upload de arquivo
    async uploadFile(file) {
        this.showLoading('Enviando arquivo...');
        this.showUploadProgress();

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.currentFile = data.file;
                this.hideLoading();
                this.hideUploadProgress();
                this.showFileInfo();
                this.showToast('Arquivo enviado com sucesso!', 'success');
            } else {
                throw new Error(data.error || 'Erro no upload');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            this.hideLoading();
            this.hideUploadProgress();
            this.showToast('Erro no upload: ' + error.message, 'error');
        }
    }

    // Mostrar progresso de upload
    showUploadProgress() {
        const progressSection = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressSection.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            progressText.textContent = `Enviando... ${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                progressText.textContent = 'Upload concluído!';
            }
        }, 100);
    }

    // Esconder progresso de upload
    hideUploadProgress() {
        document.getElementById('upload-progress').style.display = 'none';
    }

    // Mostrar informações do arquivo
    showFileInfo() {
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('file-info-section').style.display = 'block';
        
        // Atualizar informações
        document.getElementById('file-name').textContent = this.currentFile.originalName;
        document.getElementById('file-size').textContent = this.formatFileSize(this.currentFile.size);
        document.getElementById('file-type').textContent = this.currentFile.mimetype.split('/')[1].toUpperCase();
        
        // Scroll suave
        document.getElementById('file-info-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Iniciar transcrição
    async startTranscription() {
        if (!this.currentFile) {
            this.showToast('Nenhum arquivo selecionado', 'error');
            return;
        }

        // Coletar configurações
        const config = {
            speaker_labels: document.getElementById('speaker-labels').checked,
            punctuate: document.getElementById('auto-punctuation').checked,
            language_detection: document.getElementById('language-detection').checked,
            format_text: document.getElementById('format-text').checked,
            sentiment_analysis: document.getElementById('sentiment-analysis').checked,
            entity_detection: document.getElementById('entity-detection').checked,
            auto_chapters: document.getElementById('auto-chapters').checked
        };

        this.showLoading('Iniciando transcrição...');

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: this.currentFile.filename,
                    config: config
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentTranscriptId = data.transcriptId;
                this.hideLoading();
                this.showProcessingSection();
                this.startPolling();
                this.showToast('Transcrição iniciada com AssemblyAI!', 'success');
            } else {
                throw new Error(data.error || 'Erro ao iniciar transcrição');
            }
        } catch (error) {
            console.error('Erro na transcrição:', error);
            this.hideLoading();
            this.showToast('Erro na transcrição: ' + error.message, 'error');
        }
    }

    // Mostrar seção de processamento
    showProcessingSection() {
        document.getElementById('file-info-section').style.display = 'none';
        document.getElementById('processing-section').style.display = 'block';
        
        // Atualizar informações
        document.getElementById('processing-file-name').textContent = this.currentFile.originalName;
        document.getElementById('transcript-id').textContent = this.currentTranscriptId;
        
        // Scroll para seção de processamento
        document.getElementById('processing-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Iniciar polling do status
    startPolling() {
        this.pollingInterval = setInterval(async () => {
            await this.checkTranscriptionStatus();
        }, 3000); // Verificar a cada 3 segundos
    }

    // Parar polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Verificar status da transcrição
    async checkTranscriptionStatus() {
        if (!this.currentTranscriptId) return;

        try {
            const response = await fetch(`/api/status/${this.currentTranscriptId}`);
            const data = await response.json();

            if (data.success) {
                const status = data.status;
                document.getElementById('processing-current-status').textContent = data.progress;

                if (status === 'completed') {
                    this.stopPolling();
                    await this.getTranscriptionResult();
                } else if (status === 'error') {
                    this.stopPolling();
                    this.showToast('Erro na transcrição pela AssemblyAI', 'error');
                    this.resetToUpload();
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    }

    // Obter resultado da transcrição
    async getTranscriptionResult() {
        try {
            const response = await fetch(`/api/result/${this.currentTranscriptId}`);
            const data = await response.json();

            if (data.success) {
                this.transcriptionResult = data.result;
                this.showResults();
                this.showToast('Transcrição concluída com sucesso!', 'success');
            } else {
                throw new Error(data.error || 'Erro ao obter resultado');
            }
        } catch (error) {
            console.error('Erro ao obter resultado:', error);
            this.showToast('Erro ao obter resultado: ' + error.message, 'error');
        }
    }

    // Mostrar resultados
    showResults() {
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        // Atualizar informações
        document.getElementById('word-count').textContent = this.transcriptionResult.wordCount || '0';
        document.getElementById('char-count').textContent = this.transcriptionResult.characterCount || '0';
        document.getElementById('confidence-score').textContent = Math.round(this.transcriptionResult.confidence * 100) + '%';
        document.getElementById('language-detected').textContent = this.transcriptionResult.languageDetected || '-';
        
        // Mostrar texto transcrito
        const transcriptionText = document.getElementById('transcription-content');
        
        if (this.transcriptionResult.utterances && this.transcriptionResult.utterances.length > 0) {
            // Formato com falantes
            let formattedText = '';
            this.transcriptionResult.utterances.forEach(utterance => {
                if (utterance.speaker) {
                    formattedText += `<strong>Falante ${utterance.speaker}:</strong> `;
                }
                formattedText += utterance.text + '<br><br>';
            });
            transcriptionText.innerHTML = formattedText;
        } else {
            // Formato simples
            transcriptionText.textContent = this.transcriptionResult.text;
        }
        
        // Scroll para resultados
        document.getElementById('results-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Editar transcrição
    editTranscription() {
        const textElement = document.getElementById('transcription-content');
        const currentText = textElement.textContent || textElement.innerText;
        
        // Criar textarea para edição
        const textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.className = 'edit-textarea';
        textarea.style.width = '100%';
        textarea.style.minHeight = '300px';
        textarea.style.padding = '15px';
        textarea.style.border = '2px solid #007bff';
        textarea.style.borderRadius = '8px';
        textarea.style.fontSize = '14px';
        textarea.style.fontFamily = 'inherit';
        textarea.style.resize = 'vertical';
        
        // Criar botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'edit-actions';
        actionsDiv.style.marginTop = '15px';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '10px';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        saveBtn.onclick = () => this.saveEdit(textarea, textElement, actionsDiv);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-outline';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
        cancelBtn.onclick = () => this.cancelEdit(textElement, textarea, actionsDiv);
        
        actionsDiv.appendChild(saveBtn);
        actionsDiv.appendChild(cancelBtn);
        
        // Substituir texto por textarea
        textElement.style.display = 'none';
        textElement.parentNode.insertBefore(textarea, textElement.nextSibling);
        textElement.parentNode.insertBefore(actionsDiv, textarea.nextSibling);
        
        // Focar no textarea
        textarea.focus();
        
        this.showToast('Modo de edição ativado', 'info');
    }

    // Salvar edição
    saveEdit(textarea, textElement, actionsDiv) {
        const newText = textarea.value;
        textElement.textContent = newText;
        
        // Atualizar resultado
        this.transcriptionResult.text = newText;
        
        // Remover elementos de edição
        textarea.remove();
        actionsDiv.remove();
        textElement.style.display = 'block';
        
        this.showToast('Transcrição editada com sucesso!', 'success');
    }

    // Cancelar edição
    cancelEdit(textElement, textarea, actionsDiv) {
        textarea.remove();
        actionsDiv.remove();
        textElement.style.display = 'block';
        
        this.showToast('Edição cancelada', 'info');
    }

    // Copiar transcrição
    async copyTranscription() {
        const textElement = document.getElementById('transcription-content');
        const text = textElement.textContent || textElement.innerText;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Texto copiado para a área de transferência!', 'success');
        } catch (error) {
            console.error('Erro ao copiar:', error);
            this.showToast('Erro ao copiar texto', 'error');
        }
    }

    // Download TXT
    downloadTXT() {
        try {
            const textElement = document.getElementById('transcription-content');
            if (!textElement) {
                this.showToast('Nenhuma transcrição disponível para download', 'error');
                return;
            }
            
            const text = textElement.textContent || textElement.innerText;
            if (!text || text.trim() === '') {
                this.showToast('Nenhum texto para exportar', 'error');
                return;
            }
            
            // Apenas o conteúdo da transcrição, sem estatísticas ou cabeçalhos
            const content = text;
            
            // Criar e baixar arquivo
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const fileName = `transcricao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            this.showToast('Arquivo TXT baixado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar TXT:', error);
            this.showToast('Erro ao gerar arquivo TXT', 'error');
        }
    }

    // Download PDF
    downloadPDF() {
        try {
            const textElement = document.getElementById('transcription-content');
            if (!textElement) {
                this.showToast('Nenhuma transcrição disponível para download', 'error');
                return;
            }
            
            const text = textElement.textContent || textElement.innerText;
            if (!text || text.trim() === '') {
                this.showToast('Nenhum texto para exportar', 'error');
                return;
            }
            
            // Usar jsPDF para gerar e baixar o PDF diretamente
            try {
                // Verificar se jsPDF está disponível
                if (typeof window.jspdf === 'undefined') {
                    // Carregar jsPDF dinamicamente se não estiver disponível
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = () => {
                        this.generateAndDownloadPDF(text);
                    };
                    script.onerror = () => {
                        throw new Error('Não foi possível carregar a biblioteca jsPDF');
                    };
                    document.head.appendChild(script);
                } else {
                    this.generateAndDownloadPDF(text);
                }
            } catch (error) {
                console.error('Erro ao gerar PDF com jsPDF:', error);
                this.fallbackPDFMethod(text);
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.showToast('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }
    
    // Método para gerar e baixar PDF usando jsPDF
    generateAndDownloadPDF(text) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurar documento
            doc.setFont('helvetica');
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229); // Cor roxa similar ao tema
            doc.text('Transcrição - Psiu By Neguin do Corte', 20, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Adicionar texto com quebra de linha automática
            const splitText = doc.splitTextToSize(text, 170);
            doc.text(splitText, 20, 40);
            
            // Adicionar rodapé
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Gerado por Psiu By Neguin do Corte - Transcrição profissional com IA', 20, 280);
            
            // Gerar nome do arquivo com data/hora
            const fileName = `transcricao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            
            // Baixar o PDF
            doc.save(fileName);
            
            this.showToast('PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF com jsPDF:', error);
            this.fallbackPDFMethod(text);
        }
    }
    
    // Método alternativo caso jsPDF falhe
    fallbackPDFMethod(text) {
        try {
            // Criar um link para download de texto como alternativa
            const fileName = `transcricao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            this.showToast('Não foi possível gerar PDF. Baixando como TXT...', 'warning');
        } catch (error) {
            console.error('Erro no método alternativo:', error);
            this.showToast('Erro ao gerar arquivo: ' + error.message, 'error');
        }
    }


    // Mostrar toast de notificação
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Remover toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Formatar tamanho do arquivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Mostrar loading
    showLoading(message = 'Carregando...') {
        const loadingDiv = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingDiv && loadingText) {
            loadingText.textContent = message;
            loadingDiv.style.display = 'flex';
        }
    }

    // Esconder loading
    hideLoading() {
        const loadingDiv = document.getElementById('loading-overlay');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando AssemblyAITranscriber...');
    window.transcriber = new AssemblyAITranscriber();
    console.log('AssemblyAITranscriber inicializado:', window.transcriber);
});

