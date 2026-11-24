import type { RouteRecordRaw } from 'vue-router'
import type { NavGroup } from '@/router/nav'

/** Essence feature pages, mounted under `/essence/`. */
export const essenceRoutes: RouteRecordRaw[] = [
  {
    path: '/essence/tracker',
    name: 'essence-tracker',
    component: () => import('./views/TrackerView.vue'),
  },
  {
    path: '/essence/optimizer',
    name: 'essence-optimizer',
    component: () => import('./views/OptimizerView.vue'),
  },
]

/** Sidebar and home-page entries for the Essence feature. */
export const essenceNav: NavGroup = {
  label: 'Essence',
  description: 'Track weapon essences and find the best Energy Alluvium to farm.',
  items: [
    { to: '/essence/tracker', label: 'Tracker' },
    { to: '/essence/optimizer', label: 'Farming Optimizer' },
  ],
}
