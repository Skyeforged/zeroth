/**
 * Minimal raw-mode terminal UI helper (arrow keys / space / enter) for the interactive scripts.
 * Not unit-tested: it needs a real TTY. Keep the decision logic in the callers or in pure helpers.
 */
import readline from 'node:readline'

export interface KeyPress {
  /** Key name from Node's keypress parser: `up`, `down`, `space`, `return`, `escape`, `a`, ... */
  name: string
}

const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

export const style = {
  cursor: (text: string) => `${CYAN}${BOLD}${text}${RESET}`,
  dim: (text: string) => `${DIM}${text}${RESET}`,
  bold: (text: string) => `${BOLD}${text}${RESET}`,
}

/**
 * Draws `render()` and redraws it after every key until `onKey` returns `true`.
 * Ctrl+C restores the terminal and exits.
 */
export function interact(render: () => string[], onKey: (key: KeyPress) => boolean | void): Promise<void> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    readline.emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    process.stdout.write('\x1b[?25l') // hide cursor

    let drawn = 0
    const draw = () => {
      if (drawn > 0) process.stdout.write(`\x1b[${drawn}A\x1b[0J`)
      const lines = render()
      process.stdout.write(`${lines.join('\n')}\n`)
      drawn = lines.length
    }

    const finish = () => {
      stdin.off('keypress', handler)
      stdin.setRawMode(false)
      stdin.pause()
      process.stdout.write('\x1b[?25h') // show cursor
    }

    function handler(_: string | undefined, key: { name?: string; ctrl?: boolean } | undefined) {
      if (key?.ctrl && key.name === 'c') {
        finish()
        process.exit(130)
      }
      if (!key?.name) return
      if (onKey({ name: key.name }) === true) {
        finish()
        // Collapse the finished screen so the next one starts clean.
        if (drawn > 0) process.stdout.write(`\x1b[${drawn}A\x1b[0J`)
        resolve()
        return
      }
      draw()
    }

    stdin.on('keypress', handler)
    draw()
  })
}

/** Arrow-key list. Resolves with the chosen index, or `null` on Esc / q. */
export async function select(title: string, items: string[], initial = 0, hint = 'up/down move, enter select, q quit'): Promise<number | null> {
  let index = Math.min(Math.max(initial, 0), items.length - 1)
  let result: number | null = null
  await interact(
    () => [
      style.bold(title),
      ...items.map((item, i) => (i === index ? style.cursor(`> ${item}`) : `  ${item}`)),
      style.dim(hint),
    ],
    ({ name }) => {
      if (name === 'up') index = (index + items.length - 1) % items.length
      else if (name === 'down') index = (index + 1) % items.length
      else if (name === 'return') {
        result = index
        return true
      } else if (name === 'escape' || name === 'q') return true
    },
  )
  return result
}
