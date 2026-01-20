import { memo, useState, useEffect } from 'react'
import { Star, Paperclip, Loader2, MoreVertical, Inbox, Sparkles } from 'lucide-react'
import { formatDate, stripHtmlTags } from '@/lib/utils/utils'
import EmailContextMenu from './EmailContextMenu'
import { emailApi } from '@/lib/api'

// MailListItem component to handle individual email with summary
function MailListItem({ 
  email,
  isSelected,
  isUnread,
  onSelectEmail,
  onStarEmail,
  onMenuClick,
  onContextMenu
}) {
  const [summary, setSummary] = useState(null)

  // Fetch summary when item mounts
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await emailApi.getEmailSummary(email.id)
        if (response.success && response.data?.summary) {
          setSummary(response.data.summary)
        }
      } catch (err) {
        // Silently fail - summary is optional
      }
    }
    
    fetchSummary()
    
    // Listen for summary updates from other components
    const handleSummaryUpdate = (event) => {
      if (event.detail.emailId === email.id) {
        setSummary(event.detail.summary)
      }
    }
    
    window.addEventListener('emailSummaryUpdated', handleSummaryUpdate)
    
    return () => {
      window.removeEventListener('emailSummaryUpdated', handleSummaryUpdate)
    }
  }, [email.id])

  return (
    <button
      onClick={() => onSelectEmail(email)}
      onContextMenu={(e) => onContextMenu(e, email)}
      aria-label={`Open email from ${email.senderName || 'Unknown'}: ${email.subject || 'No subject'}`}
      aria-current={isSelected ? 'page' : undefined}
      className={`group w-full px-3 sm:px-4 py-3 sm:py-3.5 text-left transition-colors duration-200 active:bg-muted/80 min-h-[64px] touch-manipulation ${
        isSelected 
          ? 'bg-primary/15 border-l-4 border-primary shadow-sm' 
          : isUnread
          ? 'bg-accent/8 hover:bg-accent/12'
          : 'bg-background hover:bg-muted/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStarEmail(email.id, email.isStarred)
          }}
          className={`mt-0.5 flex-shrink-0 p-1.5 transition-colors duration-150 active:scale-95 touch-manipulation ${
            email.isStarred 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-primary/70'
          }`}
          title={email.isStarred ? 'Remove star' : 'Add star'}
          aria-label={email.isStarred ? 'Remove star' : 'Add star'}
        >
          <Star
            size={18}
            fill={email.isStarred ? 'currentColor' : 'none'}
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

          {/* Summary (if available) */}
          {summary && (
            <div className="flex items-start gap-1.5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-lg px-2.5 py-1.5 mt-1 shadow-sm">
              <Sparkles size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className={`text-xs line-clamp-3 ${
                isUnread 
                  ? 'text-amber-900 dark:text-amber-100' 
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                {summary}
              </p>
            </div>
          )}

          {/* Preview/Body snippet - only show if no summary */}
          {email.preview && !summary && (
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
          onClick={(e) => onMenuClick(e, email)}
          className={`mt-0.5 flex-shrink-0 transition-opacity duration-150 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center touch-manipulation md:opacity-0 ${
            isSelected ? 'opacity-100' : ''
          }`}
          title="More actions"
          aria-label="More actions"
        >
          <MoreVertical size={18} className="text-muted-foreground" />
        </button>
      </div>
    </button>
  )
}

const MemoizedMailListItem = memo(MailListItem)

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
    <div className={`w-96 md:w-96 max-md:w-full max-md:border-r-0 max-md:border-b bg-card border-r border-border flex flex-col overflow-hidden shadow-sm ${selectedEmail ? 'max-md:hidden' : ''}`}>
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
            {emails.map((email) => {
              const isSelected = selectedEmail?.id === email.id
              const isUnread = !email.isRead
              
              return (
                <MemoizedMailListItem
                  key={email.id}
                  email={email}
                  isSelected={isSelected}
                  isUnread={isUnread}
                  onSelectEmail={onSelectEmail}
                  onStarEmail={onStarEmail}
                  onMenuClick={handleMenuClick}
                  onContextMenu={handleContextMenu}
                />
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
