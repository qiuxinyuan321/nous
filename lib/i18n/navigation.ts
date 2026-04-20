import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * 类型安全的 Link / redirect / useRouter 等导航 API。
 * 使用方式: import { Link, useRouter } from '@/lib/i18n/navigation'
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
