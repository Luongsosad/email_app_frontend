import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import KanbanColumn from './KanbanColumn'
import KanbanToolbar from './KanbanToolbar'
import { useKanbanStatus } from '../../hooks/use-kanban-status'
import { useKanbanColumns } from '../../hooks/use-kanban-columns'
import { useKanbanFilters } from '../../hooks/use-kanban-filters'
import { useToast } from '../../hooks/use-toast'
import { emailApi } from '../../lib/api'

export default function KanbanBoard({
  emails = [],
  selectedEmail,
  onSelectEmail,
  loading = false,
  user = null,
  onRefresh,
  onEmailMoved, // Callback to add email to array if missing
}) {
  const { toast } = useToast()
  
  const userId = user?.id || user?.userId || null

  const { columns: dynamicColumns, isLoaded: columnsLoaded } = useKanbanColumns(userId)
  
  const [columnsVersion, setColumnsVersion] = useState(0)
  
  useEffect(() => {
    const handleColumnsUpdate = () => {
      setColumnsVersion(prev => prev + 1)
    }
    
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('kanban_columns_config')) {
        handleColumnsUpdate()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('kanbanColumnsUpdated', handleColumnsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('kanbanColumnsUpdated', handleColumnsUpdate)
    }
  }, [])

  const { getEmailsByColumn, isLoaded, isSyncing, updateStatusOnBackend, statusMap, syncWithBackend, setEmailStatus } = useKanbanStatus(userId)

  // Sync statuses with backend when emails change (e.g. initial load or pagination)
  const lastSyncedIdsRef = useRef('')

  useEffect(() => {
    if (emails.length > 0) {
      const emailIds = emails.map(e => e.id)
      const idsKey = JSON.stringify(emailIds)
      
      if (lastSyncedIdsRef.current !== idsKey) {
        lastSyncedIdsRef.current = idsKey
        syncWithBackend(emailIds)
      }
    }
  }, [emails, syncWithBackend])

  const {
    sortBy,
    filters,
    hasActiveFilters,
    updateSort,
    updateFilter,
    clearFilters,
    procesEmails,
  } = useKanbanFilters()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const emailsByColumn = useMemo(() => {
    if (!isLoaded || !columnsLoaded) {
      const emptyColumns = {}
      if (columnsLoaded && dynamicColumns.length > 0) {
        dynamicColumns.forEach(col => {
          emptyColumns[col.id] = []
        })
      } else {
        emptyColumns.inbox = []
        emptyColumns.todo = []
        emptyColumns['in-progress'] = []
        emptyColumns.done = []
        emptyColumns.snoozed = []
      }
      return emptyColumns
    }
    
    const organizedByColumn = getEmailsByColumn(emails, dynamicColumns, statusMap)
    
    const processedByColumn = {}
    dynamicColumns.forEach(col => {
      processedByColumn[col.id] = procesEmails(organizedByColumn[col.id] || [])
    })
    
    return processedByColumn
  }, [emails, getEmailsByColumn, isLoaded, columnsLoaded, dynamicColumns, procesEmails, sortBy, filters, columnsVersion, statusMap])

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
    const validColumns = dynamicColumns.map(col => col.id)
    if (!validColumns.includes(destinationColumnId)) {
      return
    }

    if (destinationColumnId === 'snoozed') {
      try {
        const snoozeDate = new Date()
        snoozeDate.setHours(snoozeDate.getHours() + 6)
        
        // Optimistically update UI with status AND snoozedUntil time
        setEmailStatus(emailId, 'snoozed')
        
        // Update emails state to include snoozedUntil for display on card
        if (onEmailMoved) {
          // Trigger parent to update email with snoozedUntil
          onEmailMoved(emailId, snoozeDate)
        }
        
        toast({
          title: 'Email snoozed',
          description: 'Email will reappear in 6 hours',
        })

        const result = await emailApi.snoozeEmail(emailId, snoozeDate)
        if (!result.success) {
          // Revert on failure
          setEmailStatus(emailId, sourceColumnId)
          if (onEmailMoved) {
            onEmailMoved(emailId, null) // Clear snoozedUntil
          }
          toast({
            title: 'Error',
            description: result.error || 'Failed to snooze email',
            variant: 'destructive',
          })
        }
      } catch (error) {
        setEmailStatus(emailId, sourceColumnId)
        if (onEmailMoved) {
          onEmailMoved(emailId, null)
        }
        toast({
          title: 'Error',
          description: 'Failed to snooze email',
          variant: 'destructive',
        })
      }
      return
    }

    const sourceColumn = dynamicColumns.find(col => col.id === sourceColumnId)
    const destinationColumn = dynamicColumns.find(col => col.id === destinationColumnId)
    const oldGmailLabelId = sourceColumn?.gmailLabelId || null
    const newGmailLabelId = destinationColumn?.gmailLabelId || null

    const result = await updateStatusOnBackend(
      emailId, 
      destinationColumnId, 
      newGmailLabelId,
      oldGmailLabelId
    )
    
    if (result.success) {
      const emailInArray = emails.find(e => e.id === emailId)
      if (!emailInArray && onEmailMoved) {
        onEmailMoved(emailId)
      }
      
      toast({
        title: 'Email moved',
        description: `Email moved to ${destinationColumn?.title || destinationColumnId}`,
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to move email',
        variant: 'destructive',
      })
    }
  }, [updateStatusOnBackend, toast, onRefresh, dynamicColumns])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
        {(loading || isSyncing) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 animate-in fade-in-0">
            <div className="flex flex-col items-center gap-4 bg-card/95 border border-border rounded-2xl px-8 py-6 shadow-xl shadow-primary/20">
              <Loader2 size={36} className="animate-spin text-primary" />
              <span className="text-base font-semibold text-foreground">
                {loading ? 'Loading emails...' : 'Syncing statuses...'}
              </span>
            </div>
          </div>
        )}


        <KanbanToolbar
          sortBy={sortBy}
          onSortChange={updateSort}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />


        {columnsLoaded && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 sm:p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent touch-pan-x">
            <div className="flex gap-2 sm:gap-4 h-full min-w-max">
              {dynamicColumns.map((column) => (
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
        )}
      </div>
    </DndContext>
  )
}

