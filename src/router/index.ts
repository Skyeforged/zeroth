import { createRouter, createWebHashHistory } from 'vue-router'
import TrackerView from '../views/TrackerView.vue'

// Hash history: GitHub Pages cannot rewrite URLs, so deep links/refreshes must not hit the server.
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/tracker' },
    { path: '/tracker', name: 'tracker', component: TrackerView },
    {
      path: '/optimizer',
      name: 'optimizer',
      component: () => import('../views/OptimizerView.vue'),
    },
  ],
})

export default router
