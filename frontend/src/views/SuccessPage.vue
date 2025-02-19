<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div class="text-green-500 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 class="text-2xl font-bold mb-4">Solicitação Enviada com Sucesso!</h1>
      
      <p class="text-gray-600 mb-6">
        Seu número de protocolo é:
        <span class="block text-2xl font-mono font-bold text-gray-800 mt-2">
          {{ protocolo }}
        </span>
      </p>
      
      <div class="space-y-4">
        <button
          @click="downloadPDF"
          class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          :disabled="isDownloading"
        >
          <svg 
            v-if="!isDownloading" 
            class="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <svg 
            v-else 
            class="w-5 h-5 animate-spin" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ isDownloading ? 'Baixando...' : 'Baixar Documentação' }}</span>
        </button>

        <router-link
          to="/"
          class="block text-blue-600 hover:text-blue-800 transition-colors mt-4"
        >
          Voltar para a página inicial
        </router-link>
      </div>

      <div 
        v-if="error" 
        class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';

const route = useRoute();
const router = useRouter();
const error = ref(null);
const isDownloading = ref(false);
const protocolo = route.params.protocolo;

const downloadPDF = async () => {
  if (isDownloading.value) return;
  
  isDownloading.value = true;
  error.value = null;

  try {
    // Usar URL completa
    const response = await api.get(`/requests/${protocolo}/download`, {
      responseType: 'blob'
    });

    // Criar blob e fazer download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solicitacao-${protocolo}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    error.value = 'Erro ao baixar o PDF. Por favor, tente novamente.';
  } finally {
    isDownloading.value = false;
  }
};

onMounted(() => {
  if (!protocolo) {
    router.push('/');
  }
});
</script>