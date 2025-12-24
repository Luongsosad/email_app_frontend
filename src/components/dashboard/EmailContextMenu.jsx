import { memo } from 'react'
import { Star, Trash2, Archive, AlertCircle, Mail, MailOpen } from 'lucide-react'

function EmailContextMenu({ 
  email, 
  position, 
  onStar, 
  onDelete, 
  onArchive, 
  onSpam,
  onMarkAsRead,
  onMarkAsUnread,
  onClose 
}) {
  if (!position) return null

  const handleAction = (action) => {
    action()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-primary/10 py-1.5 min-w-[200px] animate-in fade-in-0 slide-in-from-top-2"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          onClick={() => handleAction(() => onStar(email.id, email.isStarred))}
          className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 flex items-center gap-3 text-sm transition-all duration-200 rounded-lg mx-1"
        >
          <Star size={16} fill={email.isStarred ? 'currentColor' : 'none'} className={email.isStarred ? 'text-primary' : ''} />
          <span className={email.isStarred ? 'text-primary font-medium' : ''}>{email.isStarred ? 'Remove star' : 'Add star'}</span>
        </button>

        {email.isRead ? (
          <button
            onClick={() => handleAction(() => onMarkAsUnread(email.id))}
            className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 flex items-center gap-3 text-sm transition-all duration-200 rounded-lg mx-1"
          >
            <Mail size={16} />
            Mark as unread
          </button>
        ) : (
          <button
            onClick={() => handleAction(() => onMarkAsRead(email.id))}
            className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 flex items-center gap-3 text-sm transition-all duration-200 rounded-lg mx-1"
          >
            <MailOpen size={16} />
            Mark as read
          </button>
        )}

        <div className="border-t border-border my-1.5 mx-2" />

        <button
          onClick={() => handleAction(() => onArchive(email.id))}
          className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 flex items-center gap-3 text-sm transition-all duration-200 rounded-lg mx-1"
        >
          <Archive size={16} />
          Archive
        </button>

        <button
          onClick={() => handleAction(() => onSpam(email.id))}
          className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-orange-500/5 flex items-center gap-3 text-sm text-orange-600 dark:text-orange-400 transition-all duration-200 rounded-lg mx-1"
        >
          <AlertCircle size={16} />
          Mark as spam
        </button>

        <button
          onClick={() => handleAction(() => onDelete(email.id))}
          className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 flex items-center gap-3 text-sm text-destructive transition-all duration-200 rounded-lg mx-1"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </>
  )
}

export default memo(EmailContextMenu)
