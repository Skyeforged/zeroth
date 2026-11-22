import { describe, expect, it } from 'vitest'
import { poolStatus } from '../lib/slot2-input'

const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']

describe('poolStatus', () => {
  it('shows progress or done', () => {
    expect(poolStatus([])).toBe('0/8')
    expect(poolStatus(options.slice(0, 8))).toBe('done')
  })
})
