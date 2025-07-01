const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const ffmpeg = require('fluent-ffmpeg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de segurança e performance
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { success: false, error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://your-domain.com'] : 
    ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing - aumentado para 50MB para metadados
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração do Multer para upload de arquivos - AUMENTADO PARA 5GB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // ADICIONADO SUPORTE A MP4 E OUTROS FORMATOS DE VÍDEO
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/webm'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  
  const hasValidAudioType = allowedAudioTypes.includes(file.mimetype);
  const hasValidVideoType = allowedVideoTypes.includes(file.mimetype);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.originalname.toLowerCase().endsWith(ext)
  );
  
  if (hasValidAudioType || hasValidVideoType || hasValidExtension) {
    cb(null, true);
  } else {
    cb(new Error('Formato não suportado. Use MP3, WAV, M4A, OGG, FLAC, AAC, MP4, AVI, MOV, WMV, FLV, WebM ou MKV.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB - LIMITE MÁXIMO DA ASSEMBLYAI
  }
});

// Configuração da AssemblyAI
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';
let ASSEMBLYAI_API_KEY = null;

// Configurações de autenticação
const users = [];
const JWT_SECRET = 'psiu-by-neguin-secret-key-2024';
let gptConfig = null;

// Função para verificar se é arquivo de vídeo
function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Função para converter vídeo para áudio usando FFmpeg
function convertVideoToAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Convertendo vídeo para áudio: ${inputPath} -> ${outputPath}`);
    
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .audioChannels(2)
      .audioFrequency(44100)
      .on('start', (commandLine) => {
        console.log('FFmpeg iniciado:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Progresso da conversão: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log('Conversão concluída com sucesso');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Erro na conversão:', err);
        reject(new Error(`Erro na conversão de vídeo: ${err.message}`));
      })
      .save(outputPath);
  });
}

// Função para obter informações do arquivo de mídia
function getMediaInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

// Classe para gerenciar AssemblyAI
class AssemblyAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      'authorization': apiKey,
      'content-type': 'application/json'
    };
  }

  async uploadFile(filePath) {
    try {
      const fileStream = fs.createReadStream(filePath);
      
      const response = await axios.post(`${ASSEMBLYAI_BASE_URL}/upload`, fileStream, {
        headers: {
          'authorization': this.apiKey,
          'content-type': 'application/octet-stream'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000 // 5 minutos timeout para arquivos grandes
      });

      return response.data.upload_url;
    } catch (error) {
      throw new Error(`Erro no upload: ${error.response?.data?.error || error.message}`);
    }
  }

  async submitTranscription(audioUrl, config = {}) {
    try {
      const defaultConfig = {
        audio_url: audioUrl,
        language_detection: true,
        punctuate: true,
        format_text: true,
        speaker_labels: true,
        auto_chapters: false,
        sentiment_analysis: false,
        entity_detection: false,
        iab_categories: false,
        content_safety: false,
        auto_highlights: false
      };

      const transcriptionConfig = { ...defaultConfig, ...config };

      const response = await axios.post(
        `${ASSEMBLYAI_BASE_URL}/transcript`,
        transcriptionConfig,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Erro na submissão: ${error.response?.data?.error || error.message}`);
    }
  }

  async getTranscriptionStatus(transcriptId) {
    try {
      const response = await axios.get(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Erro ao verificar status: ${error.response?.data?.error || error.message}`);
    }
  }

  async testApiKey() {
    try {
      const response = await axios.get(
        `${ASSEMBLYAI_BASE_URL}/transcript`,
        { 
          headers: this.headers,
          params: { limit: 1 }
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Armazenamento em memória para jobs de transcrição
const transcriptionJobs = new Map();

// ROTAS DA API

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Configurar API Key
app.post('/api/config', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Chave da API é obrigatória'
      });
    }

    // Testar a chave da API
    const service = new AssemblyAIService(apiKey.trim());
    const isValid = await service.testApiKey();

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Chave da API inválida ou sem permissões'
      });
    }

    ASSEMBLYAI_API_KEY = apiKey.trim();

    res.json({
      success: true,
      message: 'API configurada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao configurar API:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Upload de arquivo - MELHORADO COM SUPORTE A VÍDEO
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Configure a chave da API primeiro'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    let finalFilePath = req.file.path;
    let finalFilename = req.file.filename;
    let isConverted = false;
    let mediaInfo = null;

    try {
      // Obter informações do arquivo
      mediaInfo = await getMediaInfo(req.file.path);
      console.log('Informações do arquivo:', {
        format: mediaInfo.format.format_name,
        duration: mediaInfo.format.duration,
        size: mediaInfo.format.size
      });
    } catch (error) {
      console.warn('Não foi possível obter informações do arquivo:', error.message);
    }

    // Se for arquivo de vídeo, converter para áudio
    if (isVideoFile(req.file.originalname)) {
      console.log('Arquivo de vídeo detectado, iniciando conversão...');
      
      const audioFilename = req.file.filename.replace(/\.[^/.]+$/, '.mp3');
      const audioPath = path.join(path.dirname(req.file.path), audioFilename);
      
      try {
        await convertVideoToAudio(req.file.path, audioPath);
        
        // Remover arquivo de vídeo original para economizar espaço
        fs.unlinkSync(req.file.path);
        
        finalFilePath = audioPath;
        finalFilename = audioFilename;
        isConverted = true;
        
        console.log('Conversão concluída:', audioPath);
      } catch (conversionError) {
        console.error('Erro na conversão:', conversionError);
        
        // Limpar arquivo original em caso de erro
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
          success: false,
          error: `Erro na conversão do vídeo: ${conversionError.message}`
        });
      }
    }

    // Obter tamanho do arquivo final
    const finalStats = fs.statSync(finalFilePath);

    const fileInfo = {
      id: path.basename(finalFilename, path.extname(finalFilename)),
      originalName: req.file.originalname,
      filename: finalFilename,
      size: finalStats.size,
      mimetype: isConverted ? 'audio/mpeg' : req.file.mimetype,
      path: finalFilePath,
      uploadedAt: new Date().toISOString(),
      isConverted: isConverted,
      originalFormat: req.file.mimetype,
      mediaInfo: mediaInfo ? {
        duration: mediaInfo.format.duration,
        format: mediaInfo.format.format_name,
        bitrate: mediaInfo.format.bit_rate
      } : null
    };

    res.json({
      success: true,
      file: fileInfo,
      message: isConverted ? 
        'Vídeo enviado e convertido para áudio com sucesso!' : 
        'Arquivo de áudio enviado com sucesso!'
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    
    // Limpar arquivos em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erro no upload do arquivo'
    });
  }
});

// Iniciar transcrição
app.post('/api/transcribe', async (req, res) => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Configure a chave da API primeiro'
      });
    }

    const { filename, config = {} } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Nome do arquivo é obrigatório'
      });
    }

    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    const service = new AssemblyAIService(ASSEMBLYAI_API_KEY);

    console.log('Iniciando upload para AssemblyAI...');
    
    // Upload do arquivo para AssemblyAI
    const audioUrl = await service.uploadFile(filePath);
    
    console.log('Upload concluído, iniciando transcrição...');

    // Submeter para transcrição
    const transcriptData = await service.submitTranscription(audioUrl, config);

    // Armazenar informações do job
    transcriptionJobs.set(transcriptData.id, {
      id: transcriptData.id,
      filename: filename,
      status: transcriptData.status,
      createdAt: new Date().toISOString(),
      audioUrl: audioUrl
    });

    res.json({
      success: true,
      transcriptId: transcriptData.id,
      status: transcriptData.status,
      message: 'Transcrição iniciada com sucesso!'
    });

  } catch (error) {
    console.error('Erro na transcrição:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao iniciar transcrição'
    });
  }
});

// Verificar status da transcrição
app.get('/api/status/:transcriptId', async (req, res) => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Configure a chave da API primeiro'
      });
    }

    const { transcriptId } = req.params;
    const service = new AssemblyAIService(ASSEMBLYAI_API_KEY);

    const result = await service.getTranscriptionStatus(transcriptId);

    // Atualizar status no armazenamento local
    if (transcriptionJobs.has(transcriptId)) {
      const job = transcriptionJobs.get(transcriptId);
      job.status = result.status;
      job.updatedAt = new Date().toISOString();
      transcriptionJobs.set(transcriptId, job);
    }

    res.json({
      success: true,
      status: result.status,
      progress: result.status === 'processing' ? 'Processando...' : 
                result.status === 'completed' ? 'Concluído' :
                result.status === 'error' ? 'Erro' : 'Aguardando...',
      data: {
        id: result.id,
        status: result.status,
        audio_duration: result.audio_duration,
        confidence: result.confidence
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao verificar status'
    });
  }
});

// Obter resultado da transcrição
app.get('/api/result/:transcriptId', async (req, res) => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Configure a chave da API primeiro'
      });
    }

    const { transcriptId } = req.params;
    const service = new AssemblyAIService(ASSEMBLYAI_API_KEY);

    const result = await service.getTranscriptionStatus(transcriptId);

    if (result.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Transcrição ainda não concluída. Status: ${result.status}`,
        status: result.status
      });
    }

    // Processar resultado para formato mais amigável
    const processedResult = {
      text: result.text,
      confidence: result.confidence || 0,
      languageDetected: result.language_code || 'unknown',
      audioDuration: result.audio_duration || 0,
      wordCount: result.text ? result.text.split(/\s+/).length : 0,
      characterCount: result.text ? result.text.length : 0,
      words: result.words || [],
      utterances: result.utterances || [],
      chapters: result.chapters || [],
      summary: result.summary || '',
      sentimentAnalysis: result.sentiment_analysis_results || [],
      entities: result.entities || [],
      timestamps: result.words ? result.words.map(word => ({
        word: word.text,
        start: word.start,
        end: word.end,
        confidence: word.confidence
      })) : []
    };

    res.json({
      success: true,
      result: processedResult,
      rawData: result
    });

  } catch (error) {
    console.error('Erro ao obter resultado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter resultado'
    });
  }
});

// Deletar arquivo
app.delete('/api/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Arquivo deletado com sucesso!'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar arquivo'
    });
  }
});

// Listar jobs de transcrição
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = Array.from(transcriptionJobs.values());
    res.json({
      success: true,
      jobs: jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Erro ao listar jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar jobs'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiConfigured: false, // Sempre retornar false para forçar configuração
    version: '2.0.0',
    features: {
      maxFileSize: '5GB',
      videoSupport: true,
      audioFormats: ['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'AAC'],
      videoFormats: ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WebM', 'MKV'],
      ffmpegAvailable: true
    }
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Máximo 5GB (limite da AssemblyAI).'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// ===== CONFIGURAÇÃO E ROTAS GPT =====

const OpenAI = require('openai');
let openai = null;

// Configurar GPT
app.post('/api/gpt/config', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return res.json({ success: false, error: 'Chave da API inválida' });
    }
    
    // Chave de demonstração para teste
    if (apiKey === 'sk-demo123456789') {
      console.log('✅ GPT configurado com chave de demonstração');
      res.json({ success: true });
      return;
    }
    
    // Testar a chave real
    const testOpenAI = new OpenAI({ apiKey });
    
    try {
      await testOpenAI.models.list();
      openai = testOpenAI;
      console.log('✅ GPT configurado com sucesso');
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao testar chave GPT:', error.message);
      res.json({ success: false, error: 'Chave da API inválida ou sem créditos' });
    }
    
  } catch (error) {
    console.error('❌ Erro na configuração GPT:', error);
    res.json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Traduzir texto
app.post('/api/gpt/translate', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { text, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.json({ success: false, error: 'Texto e idioma são obrigatórios' });
    }
    
    const languageNames = {
      'en': 'inglês',
      'es': 'espanhol', 
      'fr': 'francês',
      'de': 'alemão',
      'it': 'italiano',
      'ja': 'japonês',
      'ko': 'coreano',
      'zh': 'chinês'
    };
    
    const targetLanguageName = languageNames[targetLanguage] || targetLanguage;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um tradutor profissional. Traduza o texto fornecido para ${targetLanguageName} mantendo o contexto, tom e significado originais. Retorne apenas a tradução, sem explicações adicionais.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });
    
    const translation = completion.choices[0].message.content.trim();
    
    console.log(`✅ Tradução para ${targetLanguageName} concluída`);
    res.json({ success: true, translation });
    
  } catch (error) {
    console.error('❌ Erro na tradução:', error);
    res.json({ success: false, error: 'Erro ao traduzir texto' });
  }
});

// Resumir texto
app.post('/api/gpt/summarize', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { text } = req.body;
    
    if (!text) {
      return res.json({ success: false, error: 'Texto é obrigatório' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em resumir conteúdo. Crie um resumo claro, conciso e bem estruturado do texto fornecido, destacando os pontos principais e informações mais importantes. Use tópicos quando apropriado."
        },
        {
          role: "user",
          content: `Resuma o seguinte texto:\n\n${text}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.5
    });
    
    const summary = completion.choices[0].message.content.trim();
    
    console.log('✅ Resumo gerado com sucesso');
    res.json({ success: true, summary });
    
  } catch (error) {
    console.error('❌ Erro ao resumir:', error);
    res.json({ success: false, error: 'Erro ao resumir texto' });
  }
});

// Analisar texto
app.post('/api/gpt/analyze', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { text } = req.body;
    
    if (!text) {
      return res.json({ success: false, error: 'Texto é obrigatório' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um analista de conteúdo especializado. Analise o texto fornecido e forneça insights sobre: tema principal, tom/sentimento, pontos-chave, possíveis conclusões, e qualquer padrão ou informação relevante identificada. Seja detalhado e estruturado na análise."
        },
        {
          role: "user",
          content: `Analise o seguinte texto:\n\n${text}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });
    
    const analysis = completion.choices[0].message.content.trim();
    
    console.log('✅ Análise gerada com sucesso');
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    res.json({ success: false, error: 'Erro ao analisar texto' });
  }
});

// Chat livre com GPT
app.post('/api/gpt/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { message, context, model } = req.body;
    
    if (!message) {
      return res.json({ success: false, error: 'Mensagem é obrigatória' });
    }
    
    // Usar o modelo especificado ou padrão GPT-4o
    const selectedModel = model || 'gpt-4o';
    
    // Construir mensagens
    const messages = [
      {
        role: 'system',
        content: 'Você é um assistente útil e inteligente. Responda de forma clara, precisa e educada em português brasileiro.'
      }
    ];
    
    // Adicionar contexto se fornecido
    if (context) {
      messages.push({
        role: 'system',
        content: `Contexto da transcrição: ${context}`
      });
    }
    
    messages.push({
      role: 'user',
      content: message
    });
    
    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    console.log(`✅ Resposta do ${selectedModel} gerada com sucesso`);
    
    res.json({ 
      success: true, 
      response: response,
      model: selectedModel
    });
    
  } catch (error) {
    console.error('❌ Erro no chat:', error);
    res.json({ success: false, error: 'Erro ao processar mensagem' });
  }
});

// Listar modelos disponíveis
app.get('/api/gpt/models', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const models = [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Modelo rápido e eficiente para conversas gerais'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Modelo mais avançado com melhor raciocínio'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Versão otimizada do GPT-4 com melhor performance'
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Modelo mais recente, mais rápido e mais barato'
      }
    ];
    
    console.log(`✅ ${models.length} modelos disponíveis`);
    res.json({ success: true, models: models });
    
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error);
    res.json({ success: false, error: 'Erro ao buscar modelos' });
  }
});

// Listar assistentes (mantido para compatibilidade)
app.get('/api/gpt/assistants', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const assistants = await openai.beta.assistants.list({
      order: 'desc',
      limit: 20
    });
    
    const formattedAssistants = assistants.data.map(assistant => ({
      id: assistant.id,
      name: assistant.name || 'Assistente sem nome',
      description: assistant.description || 'Sem descrição',
      instructions: assistant.instructions ? assistant.instructions.substring(0, 100) + '...' : '',
      model: assistant.model,
      created_at: assistant.created_at
    }));
    
    console.log(`✅ ${formattedAssistants.length} assistentes encontrados`);
    res.json({ success: true, assistants: formattedAssistants });
    
  } catch (error) {
    console.error('❌ Erro ao listar assistentes:', error);
    res.json({ success: false, error: 'Erro ao buscar assistentes' });
  }
});

// Chat com assistente específico
app.post('/api/gpt/assistant-chat', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { assistantId, message, threadId } = req.body;
    
    if (!assistantId || !message) {
      return res.json({ success: false, error: 'ID do assistente e mensagem são obrigatórios' });
    }
    
    let currentThreadId = threadId;
    
    // Criar thread se não existir
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }
    
    // Adicionar mensagem à thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });
    
    // Executar assistente
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    });
    
    // Aguardar conclusão
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    }
    
    if (runStatus.status === 'completed') {
      // Buscar mensagens da thread
      const messages = await openai.beta.threads.messages.list(currentThreadId);
      const lastMessage = messages.data[0];
      
      if (lastMessage && lastMessage.content[0] && lastMessage.content[0].text) {
        const response = lastMessage.content[0].text.value;
        
        console.log(`✅ Resposta do assistente ${assistantId} gerada`);
        res.json({ 
          success: true, 
          response,
          threadId: currentThreadId
        });
      } else {
        res.json({ success: false, error: 'Resposta vazia do assistente' });
      }
    } else {
      console.error('❌ Erro na execução do assistente:', runStatus.last_error);
      res.json({ success: false, error: 'Erro na execução do assistente' });
    }
    
  } catch (error) {
    console.error('❌ Erro no chat com assistente:', error);
    res.json({ success: false, error: 'Erro ao processar mensagem com assistente' });
  }
});

// Obter detalhes de um assistente específico
app.get('/api/gpt/assistants/:id', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ success: false, error: 'GPT não configurado' });
    }
    
    const { id } = req.params;
    const assistant = await openai.beta.assistants.retrieve(id);
    
    const formattedAssistant = {
      id: assistant.id,
      name: assistant.name || 'Assistente sem nome',
      description: assistant.description || 'Sem descrição',
      instructions: assistant.instructions || '',
      model: assistant.model,
      tools: assistant.tools,
      created_at: assistant.created_at
    };
    
    console.log(`✅ Detalhes do assistente ${id} obtidos`);
    res.json({ success: true, assistant: formattedAssistant });
    
  } catch (error) {
    console.error('❌ Erro ao obter assistente:', error);
    res.json({ success: false, error: 'Erro ao buscar detalhes do assistente' });
  }
});

// ===== SISTEMA DE AUTENTICAÇÃO =====

// JWT Secret já definido acima
// users array já definido acima

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acesso requerido' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    req.user = user;
    next();
  });
};

// Rota de cadastro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, e-mail e senha são obrigatórios' 
      });
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de e-mail inválido' 
      });
    }

    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha deve ter no mínimo 6 caracteres' 
      });
    }

    // Verificar se e-mail já existe
    const existingUser = users.find(user => user.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'E-mail já cadastrado' 
      });
    }

    // Criptografar senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    console.log(`✅ Novo usuário cadastrado: ${newUser.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'E-mail e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos' 
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'E-mail ou senha incorretos' 
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Login realizado: ${user.email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Rota para logout (opcional - principalmente para limpar token no frontend)
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Rota para listar usuários (apenas para desenvolvimento)
app.get('/api/auth/users', (req, res) => {
  const userList = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  }));

  res.json({
    success: true,
    users: userList,
    total: userList.length
  });
});

// Rota 404 - DEVE FICAR POR ÚLTIMO
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Limpeza automática de arquivos antigos (executar a cada 2 horas)
setInterval(() => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Arquivo antigo removido: ${file}`);
        }
      } catch (error) {
        console.error(`Erro ao verificar arquivo ${file}:`, error);
      }
    });
  }
}, 2 * 60 * 60 * 1000); // A cada 2 horas

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Psiu By Neguin do Corte Backend v2.0 iniciado!');
  console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
  console.log('📋 Novidades da v2.0:');
  console.log('   ✅ Limite aumentado para 5GB (máximo da AssemblyAI)');
  console.log('   ✅ Suporte completo a arquivos MP4 e outros vídeos');
  console.log('   ✅ Conversão automática de vídeo para áudio');
  console.log('   ✅ FFmpeg integrado para processamento de mídia');
  console.log('📋 Endpoints disponíveis:');
  console.log('   POST /api/config - Configurar chave da API');
  console.log('   POST /api/upload - Upload de arquivo (áudio/vídeo)');
  console.log('   POST /api/transcribe - Iniciar transcrição');
  console.log('   GET  /api/status/:id - Status da transcrição');
  console.log('   GET  /api/result/:id - Resultado da transcrição');
  console.log('   DELETE /api/delete/:filename - Deletar arquivo');
  console.log('   GET  /api/jobs - Listar jobs');
  console.log('   GET  /api/health - Status da API');
  console.log('\n🔑 Configure sua chave da AssemblyAI em: https://app.assemblyai.com/');
  console.log('📹 Formatos suportados: MP3, WAV, M4A, OGG, FLAC, AAC, MP4, AVI, MOV, WMV, FLV, WebM, MKV');
});
