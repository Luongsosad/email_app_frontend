import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Star, Paperclip, GripVertical, Sparkles, Clock } from 'lucide-react'
import { formatDate, formatSnoozeTime, stripHtmlTags } from '@/lib/utils/utils'
import { cn } from '@/lib/utils/utils'
import { useState, useEffect } from 'react'
import { emailApi } from '@/lib/api'

function KanbanCard({ 
  email, 
  columnId,
  isSelected = false,
  onClick 
}) {
  const [summary, setSummary] = useState(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: email.id,
    data: {
      type: 'email',
      email,
      columnId,
    },
  })

  // Fetch summary when card mounts
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e) => {
    // Don't trigger onClick if clicking on drag handle
    if (e.target.closest('[data-drag-handle]')) {
      return
    }
    if (onClick) {
      onClick(email)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative w-full bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl shadow-md text-left transition-all duration-300',
        isDragging && 'shadow-2xl shadow-primary/30 rotate-2 scale-105',
        !isDragging && 'hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50 hover:scale-[1.02]',
        isSelected && 'ring-2 ring-primary border-primary shadow-lg shadow-primary/30',
        !email.isRead && 'bg-gradient-to-br from-accent/15 to-accent/5 border-accent/30'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className="absolute left-2 top-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical size={16} />
      </div>

      <button
        onClick={handleClick}
        className="w-full p-4 pl-8 text-left"
      >
      <div className="flex flex-col gap-2">
        {/* Header: Star and Sender */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {email.isStarred && (
              <Star 
                size={16} 
                className="text-primary fill-primary flex-shrink-0" 
              />
            )}
            <p className={cn(
              'text-sm font-medium truncate',
              !email.isRead ? 'text-foreground font-semibold' : 'text-muted-foreground'
            )}>
              {email.senderName || 'Unknown Sender'}
            </p>
          </div>
          <span className={cn(
            'text-xs whitespace-nowrap flex-shrink-0',
            !email.isRead ? 'text-foreground font-semibold' : 'text-muted-foreground'
          )}>
            {formatDate(new Date(email.timestamp))}
          </span>
        </div>

        {/* Subject */}
        <p className={cn(
          'text-sm font-medium line-clamp-2',
          !email.isRead ? 'text-foreground font-semibold' : 'text-foreground'
        )}>
          {email.subject || '(No Subject)'}
        </p>

        {/* Summary (if available) */}
        {summary && (
          <div className="flex items-start gap-1.5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-lg px-2.5 py-2 mt-1 shadow-sm">
            <Sparkles size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200 line-clamp-2">
              {summary}
            </p>
          </div>
        )}

        {/* Preview/Body snippet */}
        {email.preview && !summary && (
          <p className={cn(
            'text-xs line-clamp-3 text-muted-foreground',
            !email.isRead && 'text-foreground/80'
          )}>
            {stripHtmlTags(email.preview)}
          </p>
        )}

        {/* Attachments indicator */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Paperclip size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Snooze time indicator */}
        {email.snoozedUntil && (
          <div className="flex items-center gap-1.5 mt-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-800/60 rounded-md px-2 py-1.5">
            <Clock size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
              {formatSnoozeTime(new Date(email.snoozedUntil))}
            </span>
          </div>
        )}

        {/* Unread indicator */}
        {!email.isRead && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-br from-primary to-secondary rounded-full shadow-md shadow-primary/50" />
        )}
      </div>
      </button>
    </div>
  )
}

export default memo(KanbanCard)