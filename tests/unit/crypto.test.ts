import { beforeAll, describe, expect, it } from 'vitest'
import { decrypt, encrypt, maskKey } from '@/lib/crypto'

const TEST_KEY = 'a'.repeat(64) // 64 hex chars

describe('crypto · AES-256-GCM', () => {
  beforeAll(() => {
    process.env.CRYPTO_KEY = TEST_KEY
  })

  it('round-trips a plaintext correctly', () => {
    const plaintext = 'sk-proj-1234567890abcdef'
    const payload = encrypt(plaintext)
    expect(payload.cipher).not.toContain(plaintext)
    expect(decrypt(payload)).toBe(plaintext)
  })

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const a = encrypt('same-value')
    const b = encrypt('same-value')
    expect(a.cipher).not.toBe(b.cipher)
    expect(a.iv).not.toBe(b.iv)
  })

  it('throws when auth tag is tampered', () => {
    const payload = encrypt('secret')
    const forged = { ...payload, tag: Buffer.from('x'.repeat(16)).toString('base64') }
    expect(() => decrypt(forged)).toThrow()
  })

  it('throws when CRYPTO_KEY is missing', () => {
    const prev = process.env.CRYPTO_KEY
    delete process.env.CRYPTO_KEY
    expect(() => encrypt('x')).toThrow(/CRYPTO_KEY/)
    process.env.CRYPTO_KEY = prev
  })

  it('throws when CRYPTO_KEY length is wrong', () => {
    const prev = process.env.CRYPTO_KEY
    process.env.CRYPTO_KEY = 'abc'
    expect(() => encrypt('x')).toThrow(/64/)
    process.env.CRYPTO_KEY = prev
  })
})

describe('crypto · maskKey', () => {
  it('masks all but the last 4 chars by default', () => {
    expect(maskKey('sk-proj-abcd1234')).toBe('************1234')
  })

  it('masks entirely when shorter than visible', () => {
    expect(maskKey('abc')).toBe('***')
  })
})
