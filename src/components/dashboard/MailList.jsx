import { memo, useState } from 'react'
import { Star, Paperclip, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/utils'
import EmailContextMenu from './EmailContextMenu'

function MailList({ 
  emails, 
  selectedEmail, 
  onSelectEmail, 
  onStarEmail,
  onDelete,
  onArchive,
  onSpam,
  onMarkAsRead,
  onMarkAsUnread,
  loading
}) {
  const [contextMenu, setContextMenu] = useState(null)

  const handleContextMenu = (e, email) => {
    e.preventDefault()
    setContextMenu({
      email,
      position: { x: e.clientX, y: e.clientY }
    })
  }

  return (
    <div className="w-96 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Email List */}
      <div className="flex-1 overflow-y-auto">{loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
            <p>Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No emails found</p>
          </div>
        ) : (
          emails.map(email => (
            <button
              key={email.id}
              onClick={() => onSelectEmail(email)}
              onContextMenu={(e) => handleContextMenu(e, email)}
              className={`w-full px-4 py-3 border-b border-border text-left transition hover:bg-muted ${
                selectedEmail?.id === email.id ? 'bg-accent/10' : 'bg-background'
              } ${!email.isRead ? 'bg-accent/15' : ''}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onStarEmail(email.id, email.isStarred)
                  }}
                  className="mt-1 text-muted-foreground hover:text-primary transition"
                  title={email.isStarred ? 'Remove star' : 'Add star'}
                >
                  <Star
                    size={18}
                    fill={email.isStarred ? 'currentColor' : 'none'}
                    className={email.isStarred ? 'text-primary' : ''}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm truncate ${!email.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                      {email.senderName || 'Unknown Sender'}
                    </p>
                    <span className={`text-xs whitespace-nowrap ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {formatDate(new Date(email.timestamp))}
                    </span>
                  </div>

                  <p className={`text-sm truncate mt-1 ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {email.subject || '(No Subject)'}
                  </p>

                  <p className={`text-xs truncate mt-1 ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {email.preview || ''}
                  </p>

                  {email.attachments && email.attachments.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Paperclip size={14} className={!email.isRead ? 'text-foreground' : 'text-muted-foreground'} />
                      <span className={`text-xs ${!email.isRead ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                        {email.attachments.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <EmailContextMenu
          email={contextMenu.email}
          position={contextMenu.position}
          onStar={onStarEmail}
          onDelete={onDelete}
          onArchive={onArchive}
          onSpam={onSpam}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default memo(MailList)
