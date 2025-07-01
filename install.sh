#!/bin/bash

echo "🚀 Instalando Psiu By Neguin do Corte - Sistema de Transcrição"
echo "=============================================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "📥 Instalando Node.js..."
    
    # Para Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    # Para CentOS/RHEL
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    # Para macOS
    elif command -v brew &> /dev/null; then
        brew install node
    else
        echo "❌ Sistema operacional não suportado para instalação automática"
        echo "📖 Instale Node.js manualmente: https://nodejs.org/"
        exit 1
    fi
fi

echo "✅ Node.js $(node --version) encontrado"
echo "✅ npm $(npm --version) encontrado"

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# Voltar ao diretório raiz
cd ..

# Criar diretório de uploads se não existir
mkdir -p backend/uploads

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas chaves de API:"
echo "   - AssemblyAI: https://app.assemblyai.com/"
echo "   - OpenAI: https://platform.openai.com/"
echo ""
echo "2. Inicie o servidor:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. Acesse: http://localhost:5000"
echo ""
echo "📖 Para mais informações, leia o README.md"
echo ""

