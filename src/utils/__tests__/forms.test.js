import { describe, expect, it } from 'vitest'
import { authInputCls, authInputErrorCls, inputCls, inputErrorCls } from '../forms'

describe('form input classes', () => {
  it('provides normal and error styles for standard inputs', () => {
    expect(inputCls).toContain('border-edge')
    expect(inputCls).toContain('focus:ring-primary')
    expect(inputErrorCls).toContain('border-danger')
    expect(inputErrorCls).toContain('focus:ring-danger')
  })

  it('provides filled auth styles and distinct error feedback', () => {
    expect(authInputCls).toContain('bg-neutral-bg')
    expect(authInputCls).toContain('focus:bg-white')
    expect(authInputErrorCls).toContain('bg-danger-bg')
    expect(authInputErrorCls).toContain('border-danger')
    expect(authInputCls).not.toBe(authInputErrorCls)
  })
})
