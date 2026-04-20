import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 合并 Tailwind 类名，去重冲突 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 截断字符串 */
export function truncate(str: string, max = 80): string {
  return str.length <= max ? str : str.slice(0, max) + '…'
}

/** 简单防抖 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 300,
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}
