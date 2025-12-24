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
        'flex flex-col h-full min-w-[300px] max-w-[350px] bg-gradient-to-b from-muted/40 to-muted/20 rounded-xl border border-border transition-all duration-300 shadow-md',
        isOver && 'bg-gradient-to-b from-primary/15 to-primary/5 border-primary/60 shadow-lg shadow-primary/20 scale-[1.02]'
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className={cn(
            'text-sm font-bold px-2.5 py-1 rounded-full transition-all duration-200',
            isOver 
              ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md shadow-primary/30'
              : 'text-muted-foreground bg-gradient-to-r from-muted to-muted/80'
          )}>
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
            'flex items-center justify-center py-8 text-center rounded-lg border-2 border-dashed transition-all duration-300',
            isOver ? 'border-primary/60 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md shadow-primary/10' : 'border-border/50'
          )}>
            <p className={cn(
              'text-sm transition-colors',
              isOver ? 'text-primary font-medium' : 'text-muted-foreground'
            )}>
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

