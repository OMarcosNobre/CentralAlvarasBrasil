const Request = require('../models/Request');
const { generateProtocol } = require('../utils/protocolGenerator');
const { generatePDF, mergePDFs } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/emailSender');
const fs = require('fs');
const path = require('path');

exports.findByProtocol = async (protocolo) => {
  try {
    const request = await Request.findOne({ protocolo: protocolo });
    return request;
  } catch (error) {
    console.error('Erro ao buscar solicitação por protocolo:', error);
    throw error;
  }
};

exports.createRequest = async (req, res) => {
  try {
    console.log('Iniciando processamento da solicitação');
    const protocolo = await generateProtocol();
    console.log('Protocolo gerado:', protocolo);

    const formPDFData = await generatePDF({ ...req.body, protocolo });
    console.log('PDF do formulário gerado');

    const pdfsToMerge = [formPDFData];
    if (req.files) {
      for (const fileArray of Object.values(req.files)) {
        const file = fileArray[0];
        if (file?.buffer && file.mimetype === 'application/pdf') {
          console.log(`Adicionando arquivo`);
          pdfsToMerge.push(file.buffer);
        }
      }
    }

    console.log(`Mesclando ${pdfsToMerge.length} PDFs...`);
    const finalPDFData = await mergePDFs(pdfsToMerge);
    console.log('PDFs mesclados com sucesso');

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const pdfFileName = `${protocolo}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);
    fs.writeFileSync(pdfPath, finalPDFData);
    console.log('Arquivo PDF salvo:', pdfPath);

    const request = new Request({ 
      ...req.body, 
      protocolo, 
      status: 'Em andamento', 
      documentoPDFPath: pdfPath 
    });
    await request.save();
    console.log('Solicitação salva no banco de dados');

    // Enviar email com o PDF
    try {
      // Email para o solicitante
      await sendEmail(
        req.body.email,
        `Solicitação ${request.tipo.toUpperCase()} - Protocolo: ${request.protocolo}`,
        `Prezado(a) ${request.nome},

Sua solicitação foi recebida com sucesso.

Informações da solicitação:
- Protocolo: ${request.protocolo}
- Tipo: ${request.tipo.toUpperCase()}
- Data: ${new Date().toLocaleDateString('pt-BR')}

Em caso de dúvidas, entre em contato conosco informando o número do protocolo.

Atenciosamente,
Central de Alvarás OAB/CE`,
        [
          {
            filename: `solicitacao-${request.protocolo}.pdf`,
            content: finalPDFData
          }
        ]
      );
      console.log('Email enviado com sucesso para solicitante:', req.body.email);

      // Email para o administrador
      await sendEmail(
        'omarcosnobre@gmail.com',
        `Nova Solicitação Recebida - ${request.tipo.toUpperCase()} - Protocolo: ${request.protocolo}`,
        `Nova solicitação recebida:

Informações do Solicitante:
- Nome: ${request.nome}
- Email: ${req.body.email}
- OAB: ${request.oab}
- CPF: ${request.cpf}

Informações da Solicitação:
- Protocolo: ${request.protocolo}
- Tipo: ${request.tipo.toUpperCase()}
- Data: ${new Date().toLocaleDateString('pt-BR')}

O documento completo segue em anexo.`,
        [
          {
            filename: `solicitacao-${request.protocolo}.pdf`,
            content: finalPDFData
          }
        ]
      );
      console.log('Email enviado com sucesso para administrador: omarcosnobre@gmail.com');

    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não interrompe o fluxo se o email falhar
    }

    res.status(201).json({ success: true, protocolo });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar solicitação', 
      details: error.message 
    });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const request = await Request.findOne({ protocolo: req.query.protocolo, cpf: req.query.cpf });
    if (!request) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    res.json({ success: true, status: request.status, tipo: request.tipo, dataCriacao: request.dataCriacao });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao consultar status' });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find({}, { documentoPDFPath: 0 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar solicitações' });
  }
};

exports.getRequestByProtocol = async (req, res) => {
  try {
    const request = await Request.findOne({ protocolo: req.params.protocolo });
    if (!request) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar solicitação' });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const request = await Request.findOne({ protocolo: req.params.protocolo });
    if (!request) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    if (request.status === 'Em andamento') return res.status(400).json({ success: false, message: 'A solicitação ainda não foi concluída' });
    if (!fs.existsSync(request.documentoPDFPath)) return res.status(404).json({ success: false, message: 'Arquivo PDF não encontrado' });
    res.download(request.documentoPDFPath, `solicitacao-${req.params.protocolo}.pdf`);
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    res.status(500).json({ success: false, message: 'Erro ao baixar arquivo' });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({ protocolo: req.params.protocolo });
    if (!request) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    if (request.documentoPDFPath && fs.existsSync(request.documentoPDFPath)) fs.unlinkSync(request.documentoPDFPath);
    res.json({ success: true, message: 'Solicitação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir solicitação:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir solicitação' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const request = await Request.findOneAndUpdate(
      { protocolo: req.params.protocolo },
      { status: req.body.status },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
  }
};