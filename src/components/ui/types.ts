/** Colour intent shared by UiButton, UiTag and UiMessage. Maps to the global `.tone-*` classes in main.css. */
export type Severity = 'primary' | 'secondary' | 'info' | 'success' | 'warn' | 'danger'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}
