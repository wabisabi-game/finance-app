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

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <div className="md:pl-56">
      {/* PC：サイドバー */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 px-2 text-lg font-bold">マーケット道場</div>
        <nav className="flex flex-1 flex-col gap-1">
          {[...tabs, { to: '/settings', label: '設定', icon: 'settings' }].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                } ${t.to === '/settings' ? 'mt-auto' : ''}`
              }
            >
              <Icon name={t.icon} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="mx-auto max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pt-8 md:pb-12">
        <Outlet />
      </main>

      {/* スマホ：下部タブ */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon name={t.icon} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-4 flex min-h-11 items-center gap-2">
      {back && (
        <NavLink to={back} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800" aria-label="戻る">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </NavLink>
      )}
      <h1 className="flex-1 text-xl font-bold">{title}</h1>
      {right}
    </header>
  )
}
