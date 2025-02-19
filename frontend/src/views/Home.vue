<template>
    <div class="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 class="text-4xl font-bold mb-8 text-gray-800">Boas-vindas</h1>
      
      <div class="grid gap-4 w-full max-w-md">
        <button
          v-for="option in requestOptions"
          :key="option.id"
          @click="navigate(option.route)"
          class="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ option.text }}
        </button>
        
        <button
          @click="navigate('/status')"
          class="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Consultar Status
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const requestOptions = [
    { id: 1, text: 'Solicitar Alvará', route: '/request/alvara' },
    { id: 2, text: 'Solicitar RPV', route: '/request/rpv' },
    { id: 3, text: 'Solicitar Precatório', route: '/request/precatorio' }
  ];
  
  const navigate = (route) => {
    router.push(route);
  };
  </script>