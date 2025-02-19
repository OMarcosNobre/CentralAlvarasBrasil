const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

exports.generatePDF = async (data) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { height } = page.getSize();
    const fontSize = 12;
    let yOffset = height - 1;

    const writeText = (text, isBold = false) => {
      page.drawText(text, {
        x: 1,
        y: yOffset,
        size: fontSize,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      yOffset -= 20;
    };

    writeText('FORMULÁRIO DE SOLICITAÇÃO', true);
    writeText(`Protocolo: ${data.protocolo}`, true);
    writeText(`Data: ${new Date().toLocaleDateString()}`, true);
    writeText('');

    writeText('INFORMAÇÕES DO REQUERENTE', true);
    writeText(`Nome: ${data.nome}`);
    writeText(`OAB/CE: ${data.oab}`);
    writeText(`CPF: ${data.cpf}`);
    writeText(`E-mail: ${data.email}`);
    writeText('');

    writeText('DADOS BANCÁRIOS', true);
    writeText(`Banco: ${data.banco}`);
    writeText(`Agência: ${data.agencia}-${data.agenciaDigito}`);
    writeText(`Conta: ${data.conta}-${data.contaDigito}`);
    writeText('');

    writeText('DADOS DA SOLICITAÇÃO', true);
    writeText(`Tipo: ${data.tipo.toUpperCase()}`);
    writeText(`Número: ${data.numeroSolicitacao}`);

    return await pdfDoc.save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF');
  }
};

exports.mergePDFs = async (pdfBuffers) => {
  try {
    // Criar novo documento
    const mergedPdf = await PDFDocument.create();
    
    // Processar cada PDF
    for (const buffer of pdfBuffers) {
      try {
        if (!buffer) continue;
        
        // Carregar o PDF
        const pdf = await PDFDocument.load(buffer);
        
        // Copiar todas as páginas
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        // Adicionar páginas ao documento final com escala e margem
        pages.forEach(page => {
          const scaleFactor = 0.8; // Reduzir para 80% do tamanho original
          const { width, height } = page.getSize();
          const marginX = (width - width * scaleFactor) / 2;
          const marginY = (height - height * scaleFactor) / 2;
          
          page.scaleContent(scaleFactor, scaleFactor);
          page.translateContent(marginX, marginY);
          
          mergedPdf.addPage(page);
        });
      } catch (error) {
        console.warn('Erro ao processar PDF:', error);
      }
    }
    
    // Salvar o PDF final
    return await mergedPdf.save();
  } catch (error) {
    console.error('Erro ao mesclar PDFs:', error);
    throw new Error('Falha ao mesclar PDFs');
  }
};