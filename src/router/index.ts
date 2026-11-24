import { createRouter, createWebHashHistory } from 'vue-router'
import { essenceRoutes } from '@/features/essence/routes'
import HomeView from '@/views/HomeView.vue'

// Hash history: GitHub Pages cannot rewrite URLs, so deep links/refreshes must not hit the server.
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    ...essenceRoutes,
    // Old paths (/tracker, /optimizer) and anything unknown go home.
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
