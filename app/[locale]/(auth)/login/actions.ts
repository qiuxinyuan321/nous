'use server'

import { AuthError } from 'next-auth'
import { z } from 'zod'
import { signIn } from '@/lib/auth'

const schema = z.object({
  email: z.email('请输入有效的邮箱地址'),
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
  const parsed = schema.safeParse({
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
    // signIn 正常会抛 NEXT_REDIRECT，走不到这里
    return { ok: true, error: null }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: '发送失败，请稍后再试' }
    }
    // NEXT_REDIRECT 必须 re-throw
    throw error
  }
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn('github', { redirectTo: callbackUrl || '/inbox' })
}
