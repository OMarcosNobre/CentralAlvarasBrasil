const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes');
const { testConnection } = require('./utils/emailSender');
require('dotenv').config();


const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB Atlas - Base alvaras');
    console.log('Database URL:', process.env.MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
  })
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB Atlas:', err);
    process.exit(1);
  });

// Teste de conexão com o servidor de email (apenas uma vez)
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  testConnection()
    .then(success => {
      if (success) {
        console.log('Servidor de email configurado com sucesso');
      } else {
        console.warn('Aviso: Configuração de email não está funcionando');
      }
    })
    .catch(error => {
      console.warn('Aviso: Erro ao configurar email -', error.message);
    });
} else {
  console.warn('Aviso: Credenciais de email não configuradas');
}

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware para upload de arquivos
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Rotas
app.use('/api', routes);

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Ambiente:', process.env.NODE_ENV);
});

module.exports = app;
