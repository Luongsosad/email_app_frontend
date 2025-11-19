import { Mail, LogOut, Settings } from 'lucide-react'
import { FOLDER_LABELS } from '@/lib/constants/constants'

export default function Sidebar({
  selectedFolder,
  onFolderSelect,
  unreadCounts,
  user,
  onLogout,
  onCompose,
  onSettings,
}) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl text-primary-foreground font-bold">📧</span>
          </div>
          <span className="text-xl font-bold text-foreground">MailBox</span>
        </div>
      </div>

      {/* Compose Button */}
      <button
        onClick={onCompose}
        className="m-4 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
      >
        <span>✏️</span> Compose
      </button>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {Object.entries(FOLDER_LABELS).map(([key, config]) => {
          const Icon = config.icon
          const count = unreadCounts[key]
          
          return (
            <button
              key={key}
              onClick={() => onFolderSelect(key)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                selectedFolder === key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon size={20} />
              <span className="flex-1 text-left">{config.label}</span>
              {count > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4 space-y-2">
        <div className="px-2 py-2 truncate">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
        </div>
        
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-foreground transition"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-muted-foreground hover:text-destructive transition"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
