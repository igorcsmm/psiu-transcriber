# 🚀 Deploy no Render - Guia Passo a Passo

## 📋 **PRÉ-REQUISITOS:**
- Conta no GitHub (gratuita)
- Conta no Render (gratuita)

## 🔥 **MÉTODO 1: Deploy via GitHub (RECOMENDADO)**

### **Passo 1: Criar Repositório no GitHub**
1. Acesse: https://github.com/
2. Clique em "New repository"
3. Nome: `psiu-transcriber`
4. Marque "Public"
5. Clique "Create repository"

### **Passo 2: Upload dos Arquivos**
1. Na página do repositório criado
2. Clique "uploading an existing file"
3. Arraste TODOS os arquivos do projeto
4. Commit message: "Deploy inicial"
5. Clique "Commit changes"

### **Passo 3: Deploy no Render**
1. Acesse: https://render.com/
2. Clique "Get Started for Free"
3. Conecte com GitHub
4. Clique "New +"
5. Selecione "Web Service"
6. Conecte seu repositório `psiu-transcriber`
7. Configure:
   - **Name**: `psiu-transcriber`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
8. Clique "Create Web Service"

### **Passo 4: Aguardar Deploy**
- ⏱️ Deploy leva 2-5 minutos
- ✅ URL será gerada automaticamente
- 🌐 Formato: `https://psiu-transcriber.onrender.com`

## 🔥 **MÉTODO 2: Deploy Manual (Sem GitHub)**

### **Passo 1: Render Dashboard**
1. Acesse: https://render.com/
2. Faça login/cadastro
3. Clique "New +"
4. Selecione "Web Service"

### **Passo 2: Configuração Manual**
1. Selecione "Deploy from Git repository"
2. OU use "Connect a repository" se tiver GitHub
3. Configure:
   - **Name**: `psiu-transcriber`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

## ✅ **CONFIGURAÇÕES IMPORTANTES:**

### **Environment Variables (Opcional):**
- `NODE_ENV`: `production`
- `PORT`: `10000` (automático no Render)

### **Health Check:**
- Path: `/api/health`
- Enabled: ✅

## 🎯 **APÓS O DEPLOY:**

### **Seu sistema estará em:**
- 🌐 **URL**: `https://seu-app.onrender.com`
- 🔒 **HTTPS**: Automático
- 📱 **Mobile**: Responsivo
- ⚡ **CDN**: Global

### **Funcionalidades Disponíveis:**
- ✅ **Transcrição de áudio/vídeo**
- ✅ **Chat GPT integrado**
- ✅ **Sistema de usuários**
- ✅ **Upload até 5GB**
- ✅ **Interface moderna**

## 🔧 **CONFIGURAÇÃO DE APIs:**

Após deploy, configure:

### **1. AssemblyAI:**
- Acesse: https://app.assemblyai.com/
- Copie sua chave
- Configure no sistema

### **2. OpenAI:**
- Acesse: https://platform.openai.com/
- Copie sua chave
- Configure no chat GPT

## 🆘 **SOLUÇÃO DE PROBLEMAS:**

### **Build Failed:**
- Verifique se todos os arquivos foram enviados
- Confirme que `package.json` está na raiz
- Verifique logs no dashboard do Render

### **Deploy Lento:**
- Primeira vez demora mais (2-5 min)
- Próximos deploys são mais rápidos

### **Erro 503:**
- Aguarde alguns minutos
- Render pode estar inicializando

## 📞 **SUPORTE:**

Se tiver problemas:
1. Verifique logs no Render Dashboard
2. Teste localmente primeiro
3. Confirme que todas as dependências estão no `package.json`

---

**🎉 SEU SISTEMA FICARÁ ONLINE 24/7 GRATUITAMENTE!**

