import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { cn } from '@/lib/utils/utils'

export default function KanbanColumn({
  columnId,
  title,
  emails = [],
  selectedEmail,
  onCardClick,
  loading = false,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  })

  const emailIds = useMemo(() => emails.map(email => email.id), [emails])

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-w-[300px] max-w-[350px] bg-muted/30 rounded-lg border border-border transition-colors',
        isOver && 'bg-primary/10 border-primary/50'
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border bg-card rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {emails.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : emails.length === 0 ? (
          <div className={cn(
            'flex items-center justify-center py-8 text-center rounded-lg border-2 border-dashed transition-colors',
            isOver ? 'border-primary/50 bg-primary/5' : 'border-transparent'
          )}>
            <p className="text-sm text-muted-foreground">
              {isOver ? 'Drop email here' : 'No emails'}
            </p>
          </div>
        ) : (
          <SortableContext items={emailIds} strategy={verticalListSortingStrategy}>
            {emails.map((email) => (
              <KanbanCard
                key={email.id}
                email={email}
                columnId={columnId}
                isSelected={selectedEmail?.id === email.id}
                onClick={onCardClick}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}

