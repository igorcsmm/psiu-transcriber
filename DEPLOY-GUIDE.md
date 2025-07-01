# 🚀 Guia Rápido de Deploy

## 📦 Opções de Deploy

### 1. 🖥️ Servidor VPS/Dedicado (Recomendado)

```bash
# 1. Fazer upload dos arquivos
scp -r projeto-completo/ usuario@seu-servidor.com:/var/www/

# 2. Conectar ao servidor
ssh usuario@seu-servidor.com

# 3. Navegar para o diretório
cd /var/www/projeto-completo

# 4. Executar instalação automática
chmod +x install.sh
./install.sh

# 5. Iniciar com PM2 (recomendado)
sudo npm install -g pm2
cd backend
pm2 start server.js --name "psiu-transcriber"
pm2 startup
pm2 save
```

### 2. 🌐 Heroku (Gratuito/Pago)

```bash
# 1. Instalar Heroku CLI
# 2. Fazer login
heroku login

# 3. Criar app
heroku create seu-app-name

# 4. Deploy
git init
git add .
git commit -m "Deploy inicial"
git push heroku main
```

### 3. ⚡ Vercel (Gratuito)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Seguir instruções na tela
```

### 4. 🐳 Docker (Qualquer servidor)

```bash
# 1. Build da imagem
docker build -t psiu-transcriber .

# 2. Executar container
docker run -d -p 5000:5000 --name psiu-transcriber psiu-transcriber

# OU usar docker-compose
docker-compose up -d
```

### 5. 📱 Netlify (Frontend apenas)

1. Faça upload da pasta `frontend/` no Netlify
2. Configure build settings:
   - Build command: (deixe vazio)
   - Publish directory: `frontend`

**Nota**: Para Netlify, você precisará de um backend separado.

## 🔧 Configurações Importantes

### Variáveis de Ambiente

Crie arquivo `.env` no diretório `backend/`:

```env
PORT=5000
NODE_ENV=production
```

### Nginx (Para VPS)

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Verificação de Deploy

Após o deploy, teste:

1. **Página principal**: `https://seu-dominio.com/`
2. **API Health**: `https://seu-dominio.com/api/health`
3. **Cadastro**: `https://seu-dominio.com/register.html`
4. **Login**: `https://seu-dominio.com/login.html`
5. **Dashboard**: `https://seu-dominio.com/dashboard.html`

## 🆘 Solução de Problemas

### Erro de Porta
```bash
# Verificar processos na porta 5000
sudo lsof -i :5000
# Matar processo se necessário
sudo kill -9 PID
```

### Erro de Permissões
```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Logs do PM2
```bash
pm2 logs psiu-transcriber
pm2 restart psiu-transcriber
```

### Logs do Docker
```bash
docker logs psiu-transcriber
docker restart psiu-transcriber
```

## 📞 Suporte

- Verifique os logs do servidor
- Teste as APIs individualmente
- Verifique as chaves da API (AssemblyAI e OpenAI)
- Confirme que as portas estão abertas no firewall

