'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { signIn } from '@/lib/auth'

const emailSchema = z.object({
  email: z.email('请输入有效的邮箱地址'),
  callbackUrl: z.string().optional(),
})

const credentialsSchema = z.object({
  email: z.email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
  callbackUrl: z.string().optional(),
})

export type LoginActionState = {
  ok: boolean
  error: string | null
}

export async function sendMagicLink(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = emailSchema.safeParse({
    email: formData.get('email'),
    callbackUrl: formData.get('callbackUrl'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '请检查输入' }
  }

  try {
    await signIn('nodemailer', {
      email: parsed.data.email,
      redirectTo: parsed.data.callbackUrl || '/inbox',
    })
    return { ok: true, error: null }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: '发送失败，请稍后再试' }
    }
    throw error
  }
}

export async function signInWithPassword(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    callbackUrl: formData.get('callbackUrl'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '请检查输入' }
  }

  const redirectUrl = parsed.data.callbackUrl || '/inbox'

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: '邮箱或密码错误' }
    }
    throw error
  }

  redirect(redirectUrl)
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn('github', { redirectTo: callbackUrl || '/inbox' })
}
