import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM · 用户 API Key 加密存储
 * ------------------------------------
 * 存储三元组: { cipher, iv, tag }
 * 主密钥 CRYPTO_KEY 必须是 64 字符 hex (32 bytes)，
 * 可通过 `openssl rand -hex 32` 生成，写入环境变量。
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12 // GCM 推荐 96 bits

function getMasterKey(): Buffer {
  const hex = process.env.CRYPTO_KEY
  if (!hex) {
    throw new Error('CRYPTO_KEY 环境变量未设置（需要 64 位 hex）')
  }
  if (hex.length !== KEY_LENGTH * 2 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('CRYPTO_KEY 必须是 64 位 hex 字符串')
  }
  return Buffer.from(hex, 'hex')
}

export interface EncryptedPayload {
  cipher: string
  iv: string
  tag: string
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    cipher: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getMasterKey()
  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.cipher, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

/** 预览用：脱敏展示 API Key 尾部 */
export function maskKey(plaintext: string, visible = 4): string {
  if (plaintext.length <= visible) return '*'.repeat(plaintext.length)
  return '*'.repeat(plaintext.length - visible) + plaintext.slice(-visible)
}
