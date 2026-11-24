// Google Analytics 4 (gtag.js). Pure DOM/browser code, no Vue imports.
//
// Enabled only when VITE_GA_MEASUREMENT_ID is set at build time (see docs/README.md, "Analytics").
// The app uses hash routing, so automatic page views are turned off and page views are sent
// manually on every route change (`trackPageView`), with the hash route as the page path.

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/

let measurementId: string | null = null

/** Loads gtag.js and configures GA4. Does nothing for an empty or malformed id. */
export function initAnalytics(id: string | undefined): void {
  if (measurementId || typeof window === 'undefined') return
  const trimmed = id?.trim() ?? ''
  if (!MEASUREMENT_ID_PATTERN.test(trimmed)) {
    if (trimmed) console.warn(`[analytics] Ignoring invalid GA measurement id: ${trimmed}`)
    return
  }
  measurementId = trimmed

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
}

/** Sends a page_view for a hash route such as `/essence/tracker`. No-op when analytics is off. */
export function trackPageView(routePath: string, title?: string): void {
  if (!measurementId || !window.gtag) return
  const { origin, pathname } = window.location
  window.gtag('event', 'page_view', {
    page_title: title ?? document.title,
    page_location: `${origin}${pathname}#${routePath}`,
    page_path: routePath,
  })
}

/** Sends a custom event. No-op when analytics is off. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!measurementId || !window.gtag) return
  window.gtag('event', name, params)
}
