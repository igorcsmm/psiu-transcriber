#!/bin/bash

echo "🚀 Instalando FFmpeg e dependências..."

# Instalar FFmpeg via apt-get
apt-get update
apt-get install -y ffmpeg

echo "📦 Instalando dependências do backend..."
cd backend
npm install

echo "✅ Build concluído!"
