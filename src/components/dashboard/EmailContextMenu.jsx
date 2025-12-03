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
        className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          onClick={() => handleAction(() => onStar(email.id, email.isStarred))}
          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm"
        >
          <Star size={16} fill={email.isStarred ? 'currentColor' : 'none'} />
          {email.isStarred ? 'Remove star' : 'Add star'}
        </button>

        {email.isRead ? (
          <button
            onClick={() => handleAction(() => onMarkAsUnread(email.id))}
            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm"
          >
            <Mail size={16} />
            Mark as unread
          </button>
        ) : (
          <button
            onClick={() => handleAction(() => onMarkAsRead(email.id))}
            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm"
          >
            <MailOpen size={16} />
            Mark as read
          </button>
        )}

        <div className="border-t border-border my-1" />

        <button
          onClick={() => handleAction(() => onArchive(email.id))}
          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm"
        >
          <Archive size={16} />
          Archive
        </button>

        <button
          onClick={() => handleAction(() => onSpam(email.id))}
          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm text-orange-600"
        >
          <AlertCircle size={16} />
          Mark as spam
        </button>

        <button
          onClick={() => handleAction(() => onDelete(email.id))}
          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-sm text-destructive"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </>
  )
}

export default memo(EmailContextMenu)
