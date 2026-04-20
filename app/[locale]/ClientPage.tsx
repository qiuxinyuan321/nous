'use client'

import { Link } from '@/lib/i18n/navigation'
import { Seal } from '@/components/ink/Seal'
import { InkStroke } from '@/components/ink/InkStroke'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const FAQ_KEYS = ['byok', 'privacy', 'selfhost', 'free'] as const

export default function ClientPage({ ctaHref }: { ctaHref: string }) {
  const t = useTranslations()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  return (
    <main className="relative mx-auto max-w-5xl px-6">
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "backOut" }}
          className="absolute top-10 right-10 hidden md:block"
        >
          <Seal size="lg">思</Seal>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-serif-en text-ink-heavy text-center text-7xl leading-tight font-bold tracking-tight md:text-9xl drop-shadow-sm"
        >
          Nous
        </motion.h1>

        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-8 w-32"
        >
          <InkStroke variant="medium" />
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="font-serif-cn text-ink-heavy mt-12 text-center text-3xl md:text-4xl font-medium tracking-wide"
        >
          {t('marketing.hero.title')}
        </motion.p>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-ink-medium mt-6 max-w-2xl text-center text-lg md:text-xl font-light"
        >
          {t('marketing.hero.subtitle')}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-16 flex gap-6"
        >
          <Link
            href={ctaHref}
            className="group relative overflow-hidden rounded-full bg-ink-heavy px-8 py-4 text-paper-rice shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <span className="relative z-10 font-medium tracking-wider">{t('marketing.hero.cta')}</span>
            <div className="absolute inset-0 -z-0 h-full w-full bg-gradient-to-r from-cinnabar to-indigo-stone opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </Link>
          <a
            href="https://github.com/qiuxinyuan321/nous"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel text-ink-heavy hover:bg-ink-heavy/5 rounded-full px-8 py-4 transition-all hover:scale-105"
          >
            <span className="font-medium tracking-wider">GitHub</span>
          </a>
        </motion.div>
      </section>

      {/* ─── 三个卖点 ─── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24"
      >
        <div className="mb-16 text-center">
          <motion.h2 variants={itemVariants} className="font-serif-cn text-ink-heavy text-3xl font-bold">三件事</motion.h2>
          <motion.div variants={itemVariants} className="mx-auto mt-4 w-16">
            <InkStroke variant="thin" />
          </motion.div>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {(['capture', 'socratic', 'plan'] as const).map((key) => (
            <motion.article
              key={key}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-panel group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cinnabar/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-2xl"></div>
              <h3 className="font-serif-cn text-ink-heavy mb-4 text-2xl font-bold">
                {t(`marketing.features.${key}.title`)}
              </h3>
              <p className="text-ink-medium text-base leading-relaxed">
                {t(`marketing.features.${key}.desc`)}
              </p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* ─── 工作流 ─── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24"
      >
        <div className="mb-16 text-center">
          <motion.h2 variants={itemVariants} className="font-serif-cn text-ink-heavy text-3xl font-bold">{t('marketing.flow.title')}</motion.h2>
          <motion.div variants={itemVariants} className="mx-auto mt-4 w-16">
            <InkStroke variant="thin" />
          </motion.div>
        </div>
        <div className="mx-auto max-w-4xl">
          <ol className="relative border-l border-ink-light/20">
            {(['capture', 'refine', 'plan', 'focus', 'review'] as const).map((k, idx) => (
              <motion.li 
                key={k} 
                variants={itemVariants}
                className="mb-12 ml-10 group"
              >
                <span className="absolute -left-6 flex h-12 w-12 items-center justify-center rounded-full bg-paper-rice ring-8 ring-paper-rice transition-transform duration-300 group-hover:scale-110 shadow-md border border-ink-light/20">
                  <span className="font-serif-en text-lg text-ink-heavy font-bold">{idx + 1}</span>
                </span>
                <div className="glass-panel rounded-2xl p-8 transition-all duration-300 group-hover:translate-x-2 group-hover:shadow-lg">
                  <h3 className="font-serif-cn text-ink-heavy text-xl font-bold mb-3">
                    {t(`marketing.flow.steps.${k}.title`)}
                  </h3>
                  <p className="text-ink-medium text-base leading-relaxed">
                    {t(`marketing.flow.steps.${k}.desc`)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </motion.section>

      {/* ─── FAQ ─── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24"
      >
        <div className="mb-16 text-center">
          <motion.h2 variants={itemVariants} className="font-serif-cn text-ink-heavy text-3xl font-bold">{t('marketing.faq.title')}</motion.h2>
          <motion.div variants={itemVariants} className="mx-auto mt-4 w-16">
            <InkStroke variant="thin" />
          </motion.div>
        </div>
        <div className="mx-auto max-w-3xl space-y-6">
          {FAQ_KEYS.map((k) => (
            <motion.details
              key={k}
              variants={itemVariants}
              className="glass-panel group rounded-xl p-6 open:shadow-xl transition-all duration-300"
            >
              <summary className="font-serif-cn text-ink-heavy cursor-pointer list-none text-xl font-medium outline-none">
                <span className="flex items-center justify-between">
                  {t(`marketing.faq.items.${k}.q`)}
                  <span className="transition-transform duration-300 group-open:rotate-45 text-cinnabar text-2xl">+</span>
                </span>
              </summary>
              <div className="mt-6 text-ink-medium text-base leading-relaxed whitespace-pre-line border-t border-ink-light/20 pt-6">
                {t(`marketing.faq.items.${k}.a`)}
              </div>
            </motion.details>
          ))}
        </div>
      </motion.section>

      {/* ─── 自托管引导 ─── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24"
      >
        <motion.div variants={itemVariants} className="glass-panel relative overflow-hidden mx-auto max-w-4xl rounded-2xl p-12">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-br from-indigo-stone/20 to-transparent blur-3xl"></div>
          
          <p className="text-cinnabar text-sm font-bold tracking-widest uppercase mb-4">Self-hosted Open Source</p>
          <h2 className="font-serif-cn text-ink-heavy text-4xl font-bold">
            {t('marketing.selfhost.title')}
          </h2>
          <p className="text-ink-medium mt-6 text-lg leading-relaxed max-w-2xl">
            {t('marketing.selfhost.desc')}
          </p>
          <div className="mt-8 rounded-xl bg-[#0f172a] p-6 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <pre className="text-paper-rice overflow-x-auto font-mono text-sm leading-loose">
              <span className="text-green-400"># 克隆</span>{'\n'}
              <span className="text-blue-300">git</span> clone https://github.com/qiuxinyuan321/nous.git && <span className="text-blue-300">cd</span> nous{'\n\n'}
              <span className="text-green-400"># 配置</span>{'\n'}
              <span className="text-blue-300">cp</span> .env.example .env.prod{'\n'}
              <span className="text-blue-300">vim</span> .env.prod{'\n\n'}
              <span className="text-green-400"># 启动</span>{'\n'}
              <span className="text-blue-300">docker compose</span> -f docker/docker-compose.prod.yml up -d
            </pre>
          </div>
          <div className="mt-10 flex items-center gap-6">
            <a
              href="https://github.com/qiuxinyuan321/nous"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-stone text-base font-medium hover:text-cinnabar transition-colors flex items-center gap-2"
            >
              {t('marketing.selfhost.docs')} 
              <span className="text-xl">→</span>
            </a>
            <span className="rounded-full bg-ink-heavy/5 px-4 py-1 text-ink-medium text-sm border border-ink-light/20">MIT License</span>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── Footer ─── */}
      <div className="mx-auto mt-12 w-64 opacity-30">
        <InkStroke variant="thin" />
      </div>
      <footer className="text-ink-light pt-10 pb-16 text-center text-sm font-medium tracking-wide">
        · {t('common.appName')} · Open Source · {new Date().getFullYear()} ·
      </footer>
    </main>
  )
}
