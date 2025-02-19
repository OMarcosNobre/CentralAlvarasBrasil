import axios from 'axios';

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data'
  }
});

export default api;  // Essa linha é importante!

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
        console.log(`Anexando arquivo: ${key}`);
        form.append(key, file);
      }
    });

    console.log('Enviando requisição para:', api.defaults.baseURL);
    const response = await api.post('/requests', form);
    console.log('Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
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
    console.error('Erro ao consultar status:', error);
    throw error;
  }
};