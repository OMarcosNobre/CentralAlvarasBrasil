import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import RequestForm from '../views/RequestForm.vue';
import SuccessPage from '../views/SuccessPage.vue';
import StatusPage from '../views/StatusPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/request/:type',
    name: 'request',
    component: RequestForm,
    props: true
  },
  {
    path: '/success/:protocolo',
    name: 'success',
    component: SuccessPage,
    props: true
  },
  {
    path: '/status',
    name: 'status',
    component: StatusPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;