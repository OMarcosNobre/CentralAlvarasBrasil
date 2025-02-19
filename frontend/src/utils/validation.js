// frontend/src/utils/validation.js

/**
 * Valida se um CPF é válido
 * @param {string} cpf - O CPF a ser validado (com ou sem formatação)
 * @returns {boolean} - Verdadeiro se o CPF for válido
 */
export const isValidCPF = (cpf) => {
    // Remove caracteres não numéricos
    const strCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (strCPF.length !== 11) return false;
    
    // Verifica CPFs com números iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(strCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(strCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit > 9) firstDigit = 0;
    if (firstDigit !== parseInt(strCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(strCPF.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit > 9) secondDigit = 0;
    if (secondDigit !== parseInt(strCPF.charAt(10))) return false;
    
    return true;
  };
  
  /**
   * Formata um CPF adicionando pontos e traço
   * @param {string} value - CPF sem formatação (apenas números)
   * @returns {string} - CPF formatado (XXX.XXX.XXX-XX)
   */
  export const formatCPF = (value) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const cpfLength = numbers.slice(0, 11);
    
    // Aplica a máscara XXX.XXX.XXX-XX
    return cpfLength.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  
  /**
   * Manipula entrada de CPF em tempo real
   * @param {string} value - Valor atual do input
   * @returns {string} - CPF formatado
   */
  export const handleCPFInput = (value) => {
    // Remove caracteres não numéricos
    let cleanValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    cleanValue = cleanValue.slice(0, 11);
    
    // Se vazio, retorna vazio
    if (!cleanValue) return '';
    
    // Formata conforme digitação
    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length <= 6) {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
    } else if (cleanValue.length <= 9) {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
    } else {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
    }
  };