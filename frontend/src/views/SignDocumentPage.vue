<!-- frontend\src\views\SignDocumentPage.vue -->
<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Revisar e Assinar Documento</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Preview do PDF -->
      <div class="border rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-4">Visualizar Documento</h2>
        <div class="aspect-[-] bg-gray-100 relative mb-2">
          <!-- Usar object ao invés de embed para melhor compatibilidade -->
          <object
            v-if="pdfUrl"
            :data="pdfUrl"
            type="application/pdf"
            class="w-full h-full"
          >
            <div class="flex items-center justify-center h-full">
              <p class="text-gray-500">
                Não foi possível exibir o PDF. 
                <a :href="pdfUrl" target="_blank" class="text-blue-600 hover:underline">
                  Clique aqui para abrir em nova aba
                </a>
              </p>
            </div>
          </object>
          <div v-else class="flex items-center justify-center h-full">
            <span class="text-gray-400">Carregando documento...</span>
          </div>
        </div>
        <button
          @click="openPdfInNewTab"
          class="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          :disabled="!pdfUrl"
        >
          <span class="mr-1">Abrir em nova aba</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>

      <!-- Área de Assinatura -->
      <div class="border rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-4">Assinar Documento</h2>
        <div class="space-y-4">
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-sm text-yellow-800">
              Por favor, confira todos os dados antes de prosseguir com a assinatura.
            </p>
          </div>

          <!-- Status do Componente -->
          <div v-if="!isWebPkiReady" class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-800">
              Inicializando componente de assinatura digital...
              <a 
                v-if="showInstallLink"
                href="https://get.webpkiplugin.com/"
                target="_blank"
                class="underline"
              >
                Clique aqui para instalar
              </a>
            </p>
          </div>

          <!-- Seleção de Certificado -->
          <div class="space-y-2">
            <label class="block font-medium">Certificado Digital</label>
            <select
              id="certificateSelect"
              v-model="selectedCertificate"
              class="w-full p-2 border rounded"
              :disabled="!isWebPkiReady || isLoading"
            >
              <option value="">Selecione um certificado...</option>
              <option 
                v-for="cert in certificates" 
                :key="cert.thumbprint"
                :value="cert.thumbprint"
              >
                {{ cert.subjectName }} ({{ cert.issuerName }})
              </option>
            </select>
          </div>

          <!-- Botão de Assinar -->
          <button
            @click="signDocument"
            :disabled="!isWebPkiReady || !selectedCertificate || isLoading"
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span v-if="!isLoading">Assinar Documento</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mensagem de Erro -->
    <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tempId = route.params.tempId;

// Estados
const pdfUrl = ref('');
const webPki = ref(null);
const certificates = ref([]);
const selectedCertificate = ref('');
const isLoading = ref(false);
const error = ref(null);
const isWebPkiReady = ref(false);
const showInstallLink = ref(false);

let installCheckTimeout;

onMounted(async () => {
  try {
    // Verificar se Web PKI está disponível
    if (typeof LacunaWebPKI === 'undefined') {
      throw new Error('Componente Web PKI não encontrado');
    }

    // Inicializar Web PKI
    webPki.value = new LacunaWebPKI();
    
    // Configurar timeout para mostrar link de instalação
    installCheckTimeout = setTimeout(() => {
      if (!isWebPkiReady.value) {
        showInstallLink.value = true;
      }
    }, 5000);

    await initWebPki();
    await loadDocument();
  } catch (err) {
    handleError(err);
  }
});

onUnmounted(() => {
  if (installCheckTimeout) {
    clearTimeout(installCheckTimeout);
  }
  
  if (webPki.value) {
    try {
      webPki.value.shutdown();
    } catch (err) {
      console.error('Erro ao finalizar Web PKI:', err);
    }
  }

  // Limpar URL do PDF
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

const initWebPki = async () => {
  try {
    await webPki.value.init({
      ready: async () => {
        isWebPkiReady.value = true;
        await loadCertificates();
      },
      notInstalled: () => {
        showInstallLink.value = true;
        throw new Error('Componente de assinatura digital não instalado');
      },
      defaultError: handleError
    });
  } catch (err) {
    handleError(err);
  }
};

const loadDocument = async () => {
  try {
    // Definir a URL da API primeiro
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    console.log('Iniciando carregamento do documento:', tempId);
    const response = await fetch(`${apiUrl}/documents/${tempId}/preview`);
    console.log('Resposta recebida:', response.status, response.headers.get('content-type'));
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar documento: ${response.status}`);
    }

    // Criar Blob do PDF
    const blob = await response.blob();
    
    // Criar URL do Blob
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value); // Limpar URL anterior
    }
    pdfUrl.value = URL.createObjectURL(blob);
    
    console.log('PDF URL criada:', pdfUrl.value);
  } catch (err) {
    console.error('Erro ao carregar documento:', err);
    error.value = 'Não foi possível carregar o documento. ' + err.message;
  }
};

// Limpar URL do Blob quando o componente for destruído
onUnmounted(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

const loadCertificates = async () => {
  try {
    const certList = await webPki.value.listCertificates();
    certificates.value = certList.map(cert => ({
      thumbprint: cert.thumbprint,
      subjectName: cert.subjectName,
      issuerName: cert.issuerName
    }));
  } catch (err) {
    handleError('Erro ao carregar certificados: ' + err.message);
  }
};

const openPdfInNewTab = () => {
  if (pdfUrl.value) {
    window.open(pdfUrl.value, '_blank');
  }
};

const signDocument = async () => {
  if (!selectedCertificate.value || !isWebPkiReady.value) return;
  
  isLoading.value = true;
  error.value = null;

  try {
    const tokenResponse = await fetch(`/api/documents/${tempId}/sign-token`);
    if (!tokenResponse.ok) throw new Error('Erro ao obter token de assinatura');
    const { token } = await tokenResponse.json();

    const signature = await webPki.value.signWithRestPki({
      certificateThumbprint: selectedCertificate.value,
      token
    });

    const signResponse = await fetch(`/api/documents/${tempId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signature })
    });

    if (!signResponse.ok) throw new Error('Erro ao processar assinatura');
    
    const { protocolo } = await signResponse.json();
    
    router.push({
      name: 'success',
      params: { protocolo }
    });
  } catch (err) {
    handleError(err);
  } finally {
    isLoading.value = false;
  }
};

const handleError = (err) => {
  console.error('Erro:', err);
  error.value = typeof err === 'string' ? err : err.message || 'Ocorreu um erro ao processar sua solicitação';
};
</script>

 

<style scoped>
/* Estilos para garantir que o PDF seja exibido corretamente */
.aspect-[3-4] {
  height: 600px; /* ou outra altura fixa/dinâmica */
}

object {
  width: 100%;
  height: 100%;
  display: block;
}
</style>