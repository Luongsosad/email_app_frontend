import { memo, useState } from 'react'
import { Star, Paperclip, Loader2, MoreVertical, Inbox } from 'lucide-react'
import { formatDate, stripHtmlTags } from '@/lib/utils/utils'
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

  const handleMenuClick = (e, email) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      email,
      position: { x: rect.left, y: rect.bottom + 5 }
    })
  }

  return (
    <div className="w-96 max-md:w-full max-md:border-r-0 max-md:border-b bg-card border-r border-border flex flex-col overflow-hidden shadow-sm">
      {/* Email List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted/60 to-muted/40 flex items-center justify-center mb-4 shadow-lg">
              <Inbox size={40} className="text-muted-foreground/60" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">No emails found</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Your inbox is empty. New emails will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {emails.map((email, index) => {
              const isSelected = selectedEmail?.id === email.id
              const isUnread = !email.isRead
              
              return (
                <button
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  onContextMenu={(e) => handleContextMenu(e, email)}
                  aria-label={`Open email from ${email.senderName || 'Unknown'}: ${email.subject || 'No subject'}`}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`group w-full px-4 py-3.5 text-left transition-all duration-300 active:scale-[0.99] ${
                    isSelected 
                      ? 'bg-gradient-to-r from-primary/15 to-primary/5 border-l-4 border-primary shadow-md shadow-primary/10' 
                      : isUnread
                      ? 'bg-gradient-to-r from-accent/8 to-accent/4 hover:from-accent/12 hover:to-accent/6'
                      : 'bg-background hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20'
                  }`}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStarEmail(email.id, email.isStarred)
                      }}
                      className={`mt-0.5 flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        email.isStarred 
                          ? 'text-primary' 
                          : 'text-muted-foreground hover:text-primary/70'
                      }`}
                      title={email.isStarred ? 'Remove star' : 'Add star'}
                    >
                      <Star
                        size={18}
                        fill={email.isStarred ? 'currentColor' : 'none'}
                        className="transition-all"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <p className={`text-sm truncate ${
                          isUnread 
                            ? 'font-semibold text-foreground' 
                            : 'font-medium text-muted-foreground'
                        }`}>
                          {email.senderName || 'Unknown Sender'}
                        </p>
                        <span className={`text-xs whitespace-nowrap flex-shrink-0 ${
                          isUnread 
                            ? 'font-semibold text-foreground' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatDate(new Date(email.timestamp))}
                        </span>
                      </div>

                      <p className={`text-sm truncate mb-1 ${
                        isUnread 
                          ? 'font-semibold text-foreground' 
                          : 'font-medium text-foreground'
                      }`}>
                        {email.subject || '(No Subject)'}
                      </p>

                      {email.preview && (
                        <p className={`text-xs line-clamp-2 mt-1 ${
                          isUnread 
                            ? 'text-foreground/80' 
                            : 'text-muted-foreground'
                        }`}>
                          {stripHtmlTags(email.preview)}
                        </p>
                      )}

                      {email.attachments && email.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Paperclip size={12} className={`${
                            isUnread 
                              ? 'text-foreground/70' 
                              : 'text-muted-foreground'
                          }`} />
                          <span className={`text-xs ${
                            isUnread 
                              ? 'text-foreground/70 font-medium' 
                              : 'text-muted-foreground'
                          }`}>
                            {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="mt-1.5 w-2.5 h-2.5 bg-gradient-to-br from-primary to-secondary rounded-full flex-shrink-0 shadow-md shadow-primary/40" />
                    )}

                    {/* Three dots menu button */}
                    <button
                      onClick={(e) => handleMenuClick(e, email)}
                      className={`mt-0.5 flex-shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 ${
                        isSelected ? 'opacity-100' : ''
                      }`}
                      title="More actions"
                    >
                      <MoreVertical size={18} className="text-muted-foreground" />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
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
