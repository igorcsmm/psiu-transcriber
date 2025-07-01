# Psiu By Neguin do Corte - Sistema de Transcrição com Chat GPT

Sistema completo de transcrição de áudio/vídeo usando AssemblyAI com chat GPT integrado.

## 🚀 Funcionalidades

- **Transcrição de Áudio/Vídeo**: Suporte a MP3, WAV, M4A, MP4, AVI, MOV e mais
- **Chat GPT Integrado**: Converse com GPT-4o, GPT-4 ou GPT-3.5 Turbo
- **Interface Moderna**: Design responsivo e profissional
- **Sistema de Usuários**: Cadastro, login e dashboard
- **Processamento em Tempo Real**: Status de transcrição em tempo real

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **npm** (gerenciador de pacotes do Node.js)
- **Chave da API AssemblyAI** (gratuita em https://app.assemblyai.com/)
- **Chave da API OpenAI** (para o chat GPT)

## 🛠️ Instalação

### 1. Fazer Upload dos Arquivos

Faça upload de todos os arquivos para seu servidor, mantendo a estrutura de pastas:

```
projeto-completo/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── css/
│   │   ├── styles.css
│   │   └── chat-new.css
│   └── js/
│       ├── app.js
│       └── register-modern.js
└── README.md
```

### 2. Instalar Dependências

No diretório `backend/`, execute:

```bash
cd backend
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `.env` no diretório `backend/` se quiser configurar variáveis:

```env
PORT=5000
NODE_ENV=production
```

### 4. Iniciar o Servidor

```bash
cd backend
npm start
```

O servidor estará rodando em `http://localhost:5000`

## 🔧 Configuração

### 1. Configurar AssemblyAI

1. Acesse https://app.assemblyai.com/
2. Crie uma conta gratuita
3. Vá para "API Keys" no painel
4. Copie sua chave da API
5. Configure no sistema através da interface

### 2. Configurar OpenAI (Para Chat GPT)

1. Acesse https://platform.openai.com/
2. Faça login ou crie uma conta
3. Vá para "API Keys" no menu
4. Clique em "Create new secret key"
5. Copie a chave (formato: `sk-...`)
6. Configure no chat GPT através da interface

## 🌐 Deploy em Servidor

### Para VPS/Servidor Dedicado:

1. **Instalar Node.js no servidor:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Fazer upload dos arquivos**
3. **Instalar dependências:**
```bash
cd backend
npm install
```

4. **Usar PM2 para manter o servidor rodando:**
```bash
sudo npm install -g pm2
pm2 start server.js --name "psiu-transcriber"
pm2 startup
pm2 save
```

5. **Configurar Nginx (opcional):**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Para Heroku:

1. **Criar arquivo `Procfile` no diretório raiz:**
```
web: cd backend && npm start
```

2. **Modificar package.json para incluir script de build:**
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "cd backend && npm install"
  }
}
```

3. **Deploy:**
```bash
git init
git add .
git commit -m "Initial commit"
heroku create seu-app-name
git push heroku main
```

### Para Vercel:

1. **Criar arquivo `vercel.json` no diretório raiz:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

2. **Deploy:**
```bash
npm install -g vercel
vercel
```

## 📱 Como Usar

### 1. Acessar o Sistema
- Abra o navegador e acesse seu domínio
- Faça cadastro ou login

### 2. Configurar APIs
- Configure sua chave da AssemblyAI na página principal
- Para usar o chat GPT, configure sua chave da OpenAI

### 3. Transcrever Áudio/Vídeo
- Faça upload do arquivo (até 5GB)
- Aguarde o processamento
- Baixe o resultado em TXT ou JSON

### 4. Usar Chat GPT
- Clique em "Falar com GPT"
- Configure sua chave da OpenAI
- Escolha o modelo (GPT-4o, GPT-4, GPT-3.5)
- Converse normalmente

## 🔒 Segurança

- As chaves da API são armazenadas apenas localmente no navegador
- Não são enviadas para nossos servidores
- Conexão segura com AssemblyAI e OpenAI
- Senhas criptografadas com bcrypt

## 🆘 Solução de Problemas

### Erro "Cannot find module"
```bash
cd backend
npm install
```

### Erro de porta em uso
```bash
# Matar processo na porta 5000
sudo lsof -t -i tcp:5000 | xargs kill -9
```

### Erro de permissão
```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Verifique os logs do servidor: `pm2 logs`
- Verifique o console do navegador (F12)
- Teste as APIs individualmente

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

---

**Desenvolvido por Neguin do Corte** 🎯

