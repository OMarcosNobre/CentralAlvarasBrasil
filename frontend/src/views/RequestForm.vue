<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Informações do Requerente</h1>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Dados Pessoais -->
      <div class="space-y-4">
        <div>
          <label class="block mb-2">Nome Completo</label>
          <input
            v-model="formData.nome"
            type="text"
            required
            class="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label class="block mb-2">Carteira OAB/CE</label>
          <input
            v-model="formData.oab"
            type="text"
            required
            class="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label class="block mb-2">CPF</label>
          <input
            v-model="cpfInput"
            type="text"
            required
            @input="formatCPF"
            @blur="validateCPF"
            class="w-full p-2 border rounded"
            :class="{'border-red-500': cpfError}"
            placeholder="000.000.000-00"
          />
          <p v-if="cpfError" class="mt-1 text-sm text-red-600">
            {{ cpfError }}
          </p>
        </div>

        <div>
          <label class="block mb-2">E-mail</label>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full p-2 border rounded"
          />
        </div>
        
        <!-- Honeypot Fields (invisíveis para usuários) -->
        <div class="hidden" aria-hidden="true" style="display: none;">
          <input
            v-model="honeypotFields.username"
            type="text"
            name="username"
            autocomplete="off"
            tabindex="-1"
          />
          <input
            v-model="honeypotFields.email"
            type="email"
            name="_email"
            autocomplete="off"
            tabindex="-1"
          />
          <input
            v-model="honeypotFields.website"
            type="url"
            name="website"
            autocomplete="off"
            tabindex="-1"
          />
        </div>
        
        <!-- Dados Bancários -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2">Banco</label>
            <select
              v-model="formData.banco"
              class="w-full p-2 border rounded"
            >
              <option value="Banco do Brasil">Banco do Brasil</option>
              <option value="Caixa Econômica Federal">Caixa Econômica</option>
            </select>
          </div>
          
          <div>
            <label class="block mb-2">Agência</label>
            <div class="flex gap-2">
              <input
                v-model="formData.agencia"
                type="text"
                required
                class="w-3/4 p-2 border rounded"
                placeholder="Número"
              />
              <input
                v-model="formData.agenciaDigito"
                type="text"
                required
                placeholder="Dígito"
                class="w-1/4 p-2 border rounded"
                maxlength="1"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block mb-2">Conta</label>
          <div class="flex gap-2">
            <input
              v-model="formData.conta"
              type="text"
              required
              class="w-3/4 p-2 border rounded"
              placeholder="Número"
            />
            <input
              v-model="formData.contaDigito"
              type="text"
              required
              placeholder="Dígito"
              class="w-1/4 p-2 border rounded"
              maxlength="1"
            />
          </div>
        </div>
        
        <!-- Número do documento específico -->
        <div v-if="requestType">
          <label class="block mb-2">
            Número do {{ requestType }}
          </label>
          <input
            v-model="formData.numeroSolicitacao"
            type="text"
            required
            class="w-full p-2 border rounded"
            :placeholder="`Digite o número do ${requestType}`"
          />
        </div>
        
        <!-- Upload de Documentos -->
        <div v-for="doc in documentos" :key="doc.id" class="space-y-2">
          <label class="block">{{ doc.label }}</label>
          <div>
            <input
              type="file"
              accept=".pdf"
              @change="(e) => handleFileUpload(e, doc.id)"
              required
              class="w-full p-2 border rounded"
            />
            <p class="text-sm text-gray-600 mt-1">Tamanho máximo: 4MB</p>
            <p v-if="fileErrors[doc.id]" class="text-sm text-red-600 mt-1">
              {{ fileErrors[doc.id] }}
            </p>
          </div>
        </div>
        
        <!-- Declaração -->
        <div class="flex items-center space-x-2">
          <input
            v-model="formData.declaracao"
            type="checkbox"
            required
            class="h-4 w-4"
          />
          <label>Declaro estar ciente das observações</label>
        </div>
        
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {{ isSubmitting ? 'Enviando...' : 'Continuar' }}
        </button>
      </div>
    </form>

    <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { submitRequest } from '@/services/api';

const route = useRoute();
const router = useRouter();
const isSubmitting = ref(false);
const error = ref(null);
const fileErrors = ref({});
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB em bytes
const cpfInput = ref('');
const cpfError = ref('');

// Campos honeypot
const honeypotFields = ref({
  username: '',
  email: '',
  website: ''
});

const requestType = computed(() => {
  const type = route.params.type;
  return {
    'alvara': 'Alvará',
    'rpv': 'RPV',
    'precatorio': 'Precatório'
  }[type];
});

const formData = ref({
  tipo: route.params.type,
  nome: '',
  oab: '',
  cpf: '',
  email: '',
  banco: 'Banco do Brasil',
  agencia: '',
  agenciaDigito: '',
  conta: '',
  contaDigito: '',
  numeroSolicitacao: '',
  declaracao: false,
  documentos: {}
});

const documentos = [
  { id: 'carteiraOAB', label: 'Carteira OAB' },
  { id: 'comprovanteResidencia', label: 'Comprovante de Residência' },
  { id: 'contratoSocial', label: 'Contrato Social (Pessoa Jurídica)' },
  { id: 'procuracaoAD', label: 'Procuração AD' },
  { id: 'declaracaoIRRF', label: 'Declaração Isenção IRRF' },
  { id: 'procuracao', label: 'Procuração' },
  { id: 'despachoJuiz', label: 'Despacho do Juiz' }
];

// Formata o CPF enquanto o usuário digita
const formatCPF = () => {
  // Remove tudo que não é número
  let value = cpfInput.value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  value = value.slice(0, 11);
  
  // Aplica a máscara XXX.XXX.XXX-XX
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  
  cpfInput.value = value;
  
  // Atualiza o formData
  formData.value.cpf = value;
};

// Valida o CPF
const validateCPF = () => {
  const cpf = cpfInput.value.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    cpfError.value = 'CPF deve ter 11 dígitos';
    return false;
  }
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    cpfError.value = 'CPF inválido';
    return false;
  }
  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit > 9) firstDigit = 0;
  
  if (firstDigit !== parseInt(cpf.charAt(9))) {
    cpfError.value = 'CPF inválido';
    return false;
  }
  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit > 9) secondDigit = 0;
  
  if (secondDigit !== parseInt(cpf.charAt(10))) {
    cpfError.value = 'CPF inválido';
    return false;
  }
  // CPF válido
  cpfError.value = '';
  return true;
};

const handleFileUpload = (event, docId) => {
  const file = event.target.files[0];
  fileErrors.value[docId] = null;

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      fileErrors.value[docId] = 'O arquivo excede o tamanho máximo de 4MB';
      event.target.value = '';
      return;
    }
    formData.value.documentos[docId] = file;
  }
};

// Atualiza o isFormValid para incluir a validação de CPF
const isFormValid = computed(() => {
  return formData.value.declaracao && 
         Object.keys(formData.value.documentos).length === documentos.length &&
         Object.keys(fileErrors.value).every(key => !fileErrors.value[key]) &&
         !cpfError.value && // Adiciona verificação do CPF
         cpfInput.value.length === 14; // XXX.XXX.XXX-XX = 14 caracteres
});

const handleSubmit = async () => {
  // Valida o CPF antes de enviar
  if (!validateCPF()) {
    error.value = 'Por favor, corrija o CPF antes de continuar';
    return;
  }

  // Verifica se algum campo honeypot foi preenchido
  if (Object.values(honeypotFields.value).some(value => value !== '')) {
    console.log('Bot detectado');
    error.value = 'Erro ao processar solicitação';
    return;
  }

  error.value = null;
  try {
    isSubmitting.value = true;
    
    const response = await submitRequest(formData.value);
    
    if (response.success && response.protocolo) {
      await router.push({
        name: 'success',
        params: { 
          protocolo: response.protocolo 
        }
      });
    } else {
      throw new Error('Resposta inválida do servidor');
    }
  } catch (err) {
    console.error('Erro ao enviar formulário:', err);
    error.value = err.message || 'Erro ao processar solicitação';
  } finally {
    isSubmitting.value = false;
  }
};
</script>