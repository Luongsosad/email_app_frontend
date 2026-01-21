import { Mail, LogOut, Settings, Loader2 } from 'lucide-react'
import { FOLDER_LABELS } from '@/lib/constants/constants'

export default function Sidebar({
  selectedFolder,
  onFolderSelect,
  unreadCounts,
  user,
  onLogout,
  onCompose,
  onSettings,
  mailboxes,
  loading,
}) {

  const labelToFolderMap = {
    'INBOX': 'inbox',
    'SENT': 'sent',
    'DRAFT': 'drafts',
    'SPAM': 'spam',
    'TRASH': 'trash',
    'CHAT': 'chat',
    'STARRED': 'starred',
    'IMPORTANT': 'important',
    'UNREAD': 'unread',
  }


  const getFolderData = () => {
    const folderData = []
    
    if (mailboxes && mailboxes.length > 0) {

      mailboxes.forEach(mailbox => {
        const folderKey = labelToFolderMap[mailbox.id] || mailbox.id.toLowerCase()
        const config = FOLDER_LABELS[folderKey]
        
        if (config) {
          folderData.push({
            key: mailbox.id,
            label: mailbox.name,
            icon: config.icon,
            unreadCount: mailbox.unreadCount || 0,
          })
        }
      })
      

      const snoozedConfig = FOLDER_LABELS['snoozed']
      folderData.push({
        key: 'snoozed',
        label: snoozedConfig.label,
        icon: snoozedConfig.icon,
        unreadCount: 0,
      })
    } else {

      Object.entries(FOLDER_LABELS).forEach(([key, config]) => {
        folderData.push({
          key: key,
          label: config.label,
          icon: config.icon,
          unreadCount: unreadCounts[key] || 0,
        })
      })
    }

    return folderData
  }

  const folders = getFolderData()

  return (
    <div className="w-64 md:w-64 max-md:w-full max-md:h-auto max-md:border-r-0 max-md:border-b bg-card border-r border-border flex flex-col overflow-hidden shadow-lg">

      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 md:transition-transform md:duration-200 md:hover:scale-105">
            <span className="text-xl text-primary-foreground font-bold">📧</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-gradient tracking-tight">MailBox</span>
        </div>
      </div>


      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <button
          onClick={onCompose}
          className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 sm:py-2.5 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 active:scale-[0.98] transition-colors duration-200 flex items-center justify-center gap-2 shadow-md shadow-primary/20 min-h-[44px] touch-manipulation"
        >
          <span className="text-base">✏️</span>
          <span>Compose</span>
        </button>
      </div>


      <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading folders...</p>
            </div>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Mail size={32} className="text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground text-center">No folders available</p>
          </div>
        ) : (
          folders.map((folder) => {
            const Icon = folder.icon
            const count = folder.unreadCount
            const isSelected = selectedFolder === folder.key
            
            return (
              <button
                key={folder.key}
                onClick={() => onFolderSelect(folder.key)}
                aria-label={`Select ${folder.label} folder`}
                aria-current={isSelected ? 'page' : undefined}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-colors duration-200 min-h-[44px] touch-manipulation ${
                  isSelected
                    ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold shadow-sm shadow-primary/10 border-l-4 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted/70'
                }`}
              >
                <Icon size={18} className={isSelected ? 'text-primary flex-shrink-0' : 'flex-shrink-0'} />
                <span className="flex-1 text-left text-sm truncate">{folder.label}</span>
                {count > 0 && (
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center transition-colors duration-150 flex-shrink-0 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm' 
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })
        )}
      </nav>


      <div className="border-t border-border bg-gradient-to-t from-muted/40 to-muted/20 px-3 sm:px-4 py-3 space-y-1.5">
        <div className="px-2 py-2 rounded-lg bg-background/80 border border-border/50 shadow-sm">
          <p className="text-xs text-muted-foreground mb-0.5">Signed in as</p>
          <p className="text-sm font-medium text-foreground truncate">{user?.email || 'Unknown'}</p>
        </div>
        
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-200 active:bg-muted/80 min-h-[44px] touch-manipulation"
        >
          <Settings size={18} className="flex-shrink-0" />
          <span className="text-sm">Settings</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 active:bg-destructive/20 min-h-[44px] touch-manipulation"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
