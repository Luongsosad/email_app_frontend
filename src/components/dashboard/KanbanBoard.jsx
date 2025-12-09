import { useMemo, useCallback } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import KanbanColumn from './KanbanColumn'
import { useKanbanStatus } from '../../hooks/use-kanban-status'
import { useToast } from '../../hooks/use-toast'

const COLUMNS = [
  { id: 'inbox', title: 'Inbox' },
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
  { id: 'snoozed', title: 'Snoozed' },
]

export default function KanbanBoard({
  emails = [],
  selectedEmail,
  onSelectEmail,
  loading = false,
  user = null,
}) {
  const { toast } = useToast()
  
  // Get userId from user object if available
  const userId = user?.id || user?.userId || null

  // Use kanban status hook to organize emails
  const { getEmailsByColumn, isLoaded, isSyncing, updateStatusOnBackend } = useKanbanStatus(userId)

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Organize emails into columns
  const emailsByColumn = useMemo(() => {
    if (!isLoaded) {
      return {
        'inbox': [],
        'todo': [],
        'in-progress': [],
        'done': [],
        'snoozed': [],
      }
    }
    return getEmailsByColumn(emails)
  }, [emails, getEmailsByColumn, isLoaded])

  // Handle drag end event
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const emailId = active.id
    const sourceColumnId = active.data.current?.columnId
    const destinationColumnId = over.id

    // If dropped in the same column, do nothing
    if (sourceColumnId === destinationColumnId) {
      return
    }

    // Validate that destination is a valid column
    const validColumns = COLUMNS.map(col => col.id)
    if (!validColumns.includes(destinationColumnId)) {
      return
    }

    // Update status on backend
    const result = await updateStatusOnBackend(emailId, destinationColumnId)
    
    if (result.success) {
      toast({
        title: 'Email moved',
        description: `Email moved to ${COLUMNS.find(col => col.id === destinationColumnId)?.title || destinationColumnId}`,
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to move email',
        variant: 'destructive',
      })
    }
  }, [updateStatusOnBackend, toast])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
        {/* Loading overlay when syncing statuses - centered and larger */}
        {(loading || isSyncing) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 bg-card border border-border rounded-lg px-8 py-6 shadow-xl">
              <Loader2 size={32} className="animate-spin text-primary" />
              <span className="text-base font-medium text-foreground">
                {loading ? 'Loading emails...' : 'Syncing statuses...'}
              </span>
            </div>
          </div>
        )}

        {/* Kanban Board Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                columnId={column.id}
                title={column.title}
                emails={emailsByColumn[column.id] || []}
                selectedEmail={selectedEmail}
                onCardClick={onSelectEmail}
                loading={loading && !isLoaded}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  )
}

