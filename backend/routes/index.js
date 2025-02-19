const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const checkHoneypot = require('../middlewares/honeypotMiddleware');
const fs = require('fs');
const path = require('path');

// Configuração dos campos de upload
const uploadFields = [
  { name: 'carteiraOAB', maxCount: 1 },
  { name: 'comprovanteResidencia', maxCount: 1 },
  { name: 'contratoSocial', maxCount: 1 },
  { name: 'procuracaoAD', maxCount: 1 },
  { name: 'declaracaoIRRF', maxCount: 1 },
  { name: 'procuracao', maxCount: 1 },
  { name: 'despachoJuiz', maxCount: 1 }
];

// Adicione o checkHoneypot na rota de status
router.get('/status', checkHoneypot, requestController.checkStatus);

// Rota para criar uma nova solicitação
router.post('/requests', (req, res, next) => {
  req.upload.fields(uploadFields)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, requestController.createRequest);

// Rota para verificar status
router.get('/status', requestController.checkStatus);

// Rota para baixar o PDF
router.get('/requests/:protocolo/download', async (req, res) => {
  try {
    const request = await requestController.findByProtocol(req.params.protocolo);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    const filePath = request.documentoPDFPath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=solicitacao-${request.protocolo}.pdf`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao baixar arquivo'
    });
  }
});

module.exports = router;