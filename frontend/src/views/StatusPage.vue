<template>
  <div class="max-w-md mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Consulta de Status</h1>
    
    <form @submit.prevent="validateAndSubmit" class="space-y-4">
      <!-- Campo real de protocolo -->
      <div>
        <label class="block mb-2">Protocolo</label>
        <input
          v-model="upperProtocolo"
          type="text"
          required
          maxlength="6"
          class="w-full p-2 border rounded uppercase"
          placeholder="Digite o protocolo"
        />
      </div>
      
      <!-- Campo real de CPF -->
      <div>
        <label class="block mb-2">CPF</label>
        <input
          v-model="formattedCpf"
          type="text"
          required
          maxlength="14"
          class="w-full p-2 border rounded"
          :class="{'border-red-500': cpfError}"
          placeholder="000.000.000-00"
          @input="handleCpfInput"
          @blur="validateCpf"
        />
        <p v-if="cpfError" class="mt-1 text-red-500 text-sm">
          CPF inválido
        </p>
      </div>

      <!-- Honeypot - campo oculto -->
      <div class="hidden" aria-hidden="true" style="display: none;">
        <input
          v-model="honeypot"
          type="text"
          name="username"
          autocomplete="off"
          tabindex="-1"
        />
      </div>
      
      <button
        type="submit"
        :disabled="isLoading || cpfError"
        class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {{ isLoading ? 'Consultando...' : 'Consultar' }}
      </button>
    </form>
    
    <div v-if="result" class="mt-6 p-4 rounded" :class="resultClass">
      <div v-if="status === 'success'">
        <h2 class="font-bold mb-2">Informações da Solicitação</h2>
        <p>Status: {{ result.status }}</p>
        <p>Tipo: {{ formatTipo(result.tipo) }}</p>
        <p>Data: {{ formatDate(result.dataCriacao) }}</p>
      </div>
      <p v-else class="text-center">{{ result.message }}</p>
    </div>
    
    <div class="mt-6 text-center">
      <router-link
        to="/"
        class="text-blue-600 hover:text-blue-800 transition-colors"
      >
        Voltar para a página inicial
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { checkStatus } from '@/services/api';

const protocolo = ref('');
const cpf = ref('');
const formattedCpf = ref('');
const result = ref(null);
const status = ref(null);
const isLoading = ref(false);
const honeypot = ref('');
const cpfError = ref(false);

const upperProtocolo = computed({
  get: () => protocolo.value,
  set: (value) => protocolo.value = value.toUpperCase()
});

const resultClass = computed(() => {
  if (!status.value) return '';
  return status.value === 'success'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
});

const formatTipo = (tipo) => {
  const tipos = {
    'alvara': 'Alvará',
    'rpv': 'RPV',
    'precatorio': 'Precatório'
  };
  return tipos[tipo] || tipo;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isValidCpf = (cpf) => {
  // Remove caracteres não numéricos
  const strCPF = cpf.replace(/\D/g, '');
  
  if (strCPF.length !== 11) return false;
  
  // Verifica CPFs com números iguais
  if (/^(\d)\1{10}$/.test(strCPF)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(strCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(strCPF.charAt(9))) return false;
  
  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(strCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(strCPF.charAt(10))) return false;
  
  return true;
};

const formatCpf = (value) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const cpfLength = numbers.slice(0, 11);
  
  // Aplica a máscara
  return cpfLength.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const validateCpf = () => {
  if (cpf.value) {
    cpfError.value = !isValidCpf(cpf.value);
  } else {
    cpfError.value = false;
  }
};

const handleCpfInput = (event) => {
  // Pega o valor atual do input
  let value = event.target.value;
  
  // Remove caracteres não numéricos
  value = value.replace(/\D/g, '');
  
  // Atualiza o CPF formatado
  formattedCpf.value = value ? formatCpf(value) : '';
  
  // Atualiza o valor do CPF sem formatação para envio
  cpf.value = value;
  
  // Valida o CPF sempre que houver mudança
  validateCpf();
};

const validateAndSubmit = async () => {
  // Valida o CPF antes de enviar
  validateCpf();
  if (cpfError.value) {
    return;
  }

  // Verifica se o honeypot está preenchido
  if (honeypot.value) {
    console.log('Bot detectado');
    result.value = { message: 'Erro ao processar solicitação' };
    status.value = 'error';
    return;
  }

  try {
    isLoading.value = true;
    // Formata o CPF antes de enviar para a API
    const formattedCpfForApi = formatCpf(cpf.value);
    const response = await checkStatus(protocolo.value, formattedCpfForApi);
    result.value = response;
    status.value = 'success';
  } catch (error) {
    result.value = error;
    status.value = 'error';
  } finally {
    isLoading.value = false;
  }
};
</script>