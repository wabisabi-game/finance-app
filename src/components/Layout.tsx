import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const icons: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  quiz: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10',
  dictionary: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7M8 11h7',
  journal: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1-.5-2h-5L9 7 7 8 5 7l-2 4 2 1v2l-2 1 2 4 2-1 2 1 .5 2h5l.5-2 2-1 2 1 2-4-2-1z',
}

export function Icon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

const tabs = [
  { to: '/', label: 'ホーム', icon: 'home' },
  { to: '/quiz', label: 'クイズ', icon: 'quiz' },
  { to: '/dictionary', label: '辞書', icon: 'dictionary' },
  { to: '/journal', label: '日記', icon: 'journal' },
  { to: '/progress', label: '進捗', icon: 'progress' },
]

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    // 新しいブラウザでは scrollTo が Promise を返すため、effect の戻り値にしない
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="md:pl-60">
      {/* PC：サイドバー */}
      <aside className="border-line bg-surface fixed inset-y-0 left-0 hidden w-60 flex-col border-r p-5 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="bg-accent flex h-8 w-8 items-center justify-center rounded-xl text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 16l5-5 4 3 7-8" /></svg>
          </span>
          <span className="text-base font-bold tracking-wide">マーケット道場</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {[...tabs, { to: '/settings', label: '設定', icon: 'settings' }].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-accent-soft text-accent-ink' : 'text-sub hover:bg-raised hover:text-ink'
                } ${t.to === '/settings' ? 'mt-auto' : ''}`
              }
            >
              <Icon name={t.icon} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 画面が切り替わるたびに、ふわっと現れる */}
      <main key={pathname} className="animate-enter mx-auto max-w-2xl px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:pt-10 md:pb-16">
        <Outlet />
      </main>

      {/* スマホ：下部タブ */}
      <nav className="border-line bg-surface fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t px-2 pb-[env(safe-area-inset-bottom)] after:bg-surface after:absolute after:inset-x-0 after:top-full after:h-40 after:content-[''] md:hidden">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className="group flex min-h-16 flex-col items-center justify-center gap-0.5">
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ${isActive ? 'bg-accent-soft text-accent-ink' : 'text-sub group-active:bg-raised'}`}>
                  <Icon name={t.icon} />
                </span>
                <span className={`text-[11px] leading-none font-semibold ${isActive ? 'text-accent-ink' : 'text-sub'}`}>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-5 flex min-h-11 items-center gap-1">
      {back && (
        <NavLink to={back} className="text-sub hover:bg-raised -ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors" aria-label="戻る">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </NavLink>
      )}
      <h1 className="flex-1 text-2xl leading-tight font-bold">{title}</h1>
      {right}
    </header>
  )
}
