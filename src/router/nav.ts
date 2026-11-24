import { essenceNav } from '@/features/essence/routes'

export interface NavItem {
  to: string
  label: string
}

/** One feature: a sidebar group and a card on the home page. */
export interface NavGroup {
  label: string
  description: string
  items: NavItem[]
}

// Add new features here; the sidebar and the home page render whatever is listed.
export const navGroups: NavGroup[] = [essenceNav]
