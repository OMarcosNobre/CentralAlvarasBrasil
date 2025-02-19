const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  protocolo: {
    type: String,
    required: true,
    unique: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['alvara', 'rpv', 'precatorio']
  },
  nome: {
    type: String,
    required: true
  },
  cpf: {
    type: String,
    required: true
  },
  oab: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  banco: {
    type: String,
    required: true,
    enum: ['Banco do Brasil', 'Caixa Econômica Federal']
  },
  agencia: {
    type: String,
    required: true
  },
  agenciaDigito: {
    type: String,
    required: true
  },
  conta: {
    type: String,
    required: true
  },
  contaDigito: {
    type: String,
    required: true
  },
  numeroSolicitacao: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'Em andamento'
  },
  documentoPDFPath: {
    type: String,
    required: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Request', RequestSchema);