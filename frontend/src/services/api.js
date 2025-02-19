import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const submitRequest = async (formData) => {
  try {
    console.log('Preparando dados para envio...');
    const form = new FormData();
    
    // Adicionar dados do formulário
    Object.keys(formData).forEach(key => {
      if (key !== 'documentos') {
        form.append(key, formData[key]);
      }
    });
    
    // Adicionar documentos
    Object.entries(formData.documentos).forEach(([key, file]) => {
      if (file) {
        form.append(key, file);
      }
    });

    console.log('Enviando requisição para o servidor...');
    const response = await api.post('/requests', form);

    console.log('Resposta do servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

export const checkStatus = async (protocolo, cpf) => {
  try {
    const response = await api.get('/status', {
      params: { protocolo, cpf }
    });
    return response.data;
    } catch (error) {
    // Traduzindo mensagens específicas
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('Protocolo não encontrado');
        case 400:
          throw new Error('Dados inválidos');
        case 500:
          throw new Error('Erro interno do servidor');
        default:
          throw new Error('Ocorreu um erro na consulta');
      }
    }
    throw new Error('Erro ao conectar com o servidor');
    }
};