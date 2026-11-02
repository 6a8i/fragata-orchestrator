import { apiLogErrorMessage, filenameFromDisposition, isTagColor } from '@/modules/system/utils/system.util.ts'
import { describe, expect, it } from 'vitest'

describe('isTagColor', () => {
  it('accepts #rrggbb only', () => {
    expect(isTagColor('#c62828')).toBe(true)
    expect(isTagColor('#C62828')).toBe(true)
    expect(isTagColor('c62828')).toBe(false)
    expect(isTagColor('#c628')).toBe(false)
    expect(isTagColor('red')).toBe(false)
  })
})

describe('apiLogErrorMessage', () => {
  it('reads the message, then the code', () => {
    expect(apiLogErrorMessage({ message: 'no such VM', code: 1 })).toBe('no such VM')
    expect(apiLogErrorMessage({ code: 'ENOENT' })).toBe('ENOENT')
    expect(apiLogErrorMessage('boom')).toBe('boom')
    expect(apiLogErrorMessage(undefined)).toBeUndefined()
  })
})

describe('filenameFromDisposition', () => {
  it('reads the filename or falls back', () => {
    expect(filenameFromDisposition('attachment; filename="a.json.gz"', 'x')).toBe('a.json.gz')
    expect(filenameFromDisposition('attachment; filename=b.gz', 'x')).toBe('b.gz')
    expect(filenameFromDisposition(null, 'x')).toBe('x')
  })
})
