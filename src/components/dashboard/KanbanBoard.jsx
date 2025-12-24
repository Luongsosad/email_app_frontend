import { useMemo, useCallback, useEffect, useState } from 'react'
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
  
  // Get userId from user object if available
  const userId = user?.id || user?.userId || null

  // Use kanban columns hook to get dynamic columns
  const { columns: dynamicColumns, isLoaded: columnsLoaded } = useKanbanColumns(userId)
  
  // Force re-render when columns change (listen to storage events)
  const [columnsVersion, setColumnsVersion] = useState(0)
  
  useEffect(() => {
    const handleColumnsUpdate = () => {
      // Columns changed, force re-render
      setColumnsVersion(prev => prev + 1)
    }
    
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('kanban_columns_config')) {
        handleColumnsUpdate()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen to custom event for same-tab updates
    window.addEventListener('kanbanColumnsUpdated', handleColumnsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('kanbanColumnsUpdated', handleColumnsUpdate)
    }
  }, [])

  // Use kanban status hook to organize emails
  const { getEmailsByColumn, isLoaded, isSyncing, updateStatusOnBackend, statusMap } = useKanbanStatus(userId)

  // Use kanban filters hook for sorting and filtering
  const {
    sortBy,
    filters,
    hasActiveFilters,
    updateSort,
    updateFilter,
    clearFilters,
    procesEmails,
  } = useKanbanFilters()

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Organize emails into columns with sorting and filtering applied
  const emailsByColumn = useMemo(() => {
    if (!isLoaded || !columnsLoaded) {
      // Return empty columns structure based on dynamic columns
      const emptyColumns = {}
      if (columnsLoaded && dynamicColumns.length > 0) {
        dynamicColumns.forEach(col => {
          emptyColumns[col.id] = []
        })
      } else {
        // Fallback to default columns
        emptyColumns.inbox = []
        emptyColumns.todo = []
        emptyColumns['in-progress'] = []
        emptyColumns.done = []
        emptyColumns.snoozed = []
      }
      return emptyColumns
    }
    
    // First organize emails by column (pass dynamic columns for custom column support)
    // Pass statusMap directly to ensure we use the latest value
    const organizedByColumn = getEmailsByColumn(emails, dynamicColumns, statusMap)
    
    // Then apply sorting and filtering to each column
    const processedByColumn = {}
    // Ensure all dynamic columns are included, even if empty
    dynamicColumns.forEach(col => {
      processedByColumn[col.id] = procesEmails(organizedByColumn[col.id] || [])
    })
    
    return processedByColumn
  }, [emails, getEmailsByColumn, isLoaded, columnsLoaded, dynamicColumns, procesEmails, sortBy, filters, columnsVersion, statusMap])

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
    const validColumns = dynamicColumns.map(col => col.id)
    if (!validColumns.includes(destinationColumnId)) {
      return
    }

    // Special handling for SNOOZED column - automatically snooze for 6 hours
    if (destinationColumnId === 'snoozed') {
      const snoozeDate = new Date()
      snoozeDate.setHours(snoozeDate.getHours() + 6)
      
      try {
        // snoozeEmail API already sets status to SNOOZED, no need to call updateStatusOnBackend
        const result = await emailApi.snoozeEmail(emailId, snoozeDate.toISOString())
        if (result.success) {
          toast({
            title: 'Email snoozed',
            description: 'Email will reappear in 6 hours',
          })
          // Refresh the email list to reflect the change
          if (onRefresh) {
            onRefresh()
          }
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to snooze email',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to snooze email',
          variant: 'destructive',
        })
      }
      return
    }

    // Get source and destination column configs for Gmail label sync
    const sourceColumn = dynamicColumns.find(col => col.id === sourceColumnId)
    const destinationColumn = dynamicColumns.find(col => col.id === destinationColumnId)
    const oldGmailLabelId = sourceColumn?.gmailLabelId || null
    const newGmailLabelId = destinationColumn?.gmailLabelId || null

    // Update status on backend for other columns
    const result = await updateStatusOnBackend(
      emailId, 
      destinationColumnId, 
      newGmailLabelId,
      oldGmailLabelId
    )
    
    if (result.success) {
      // Check if email is in emails array, if not, fetch it
      const emailInArray = emails.find(e => e.id === emailId)
      if (!emailInArray && onEmailMoved) {
        onEmailMoved(emailId)
      }
      
      toast({
        title: 'Email moved',
        description: `Email moved to ${destinationColumn?.title || destinationColumnId}`,
      })
      // UI is already updated via optimistic update in updateStatusOnBackend
      // No need to refresh from server
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
        {/* Loading overlay when syncing statuses - centered and larger */}
        {(loading || isSyncing) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in-0">
            <div className="flex flex-col items-center gap-4 bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-8 py-6 shadow-2xl shadow-primary/20">
              <Loader2 size={36} className="animate-spin text-primary" />
              <span className="text-base font-semibold text-foreground">
                {loading ? 'Loading emails...' : 'Syncing statuses...'}
              </span>
            </div>
          </div>
        )}

        {/* Sorting and Filtering Toolbar */}
        <KanbanToolbar
          sortBy={sortBy}
          onSortChange={updateSort}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Kanban Board Container */}
        {columnsLoaded && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="flex gap-4 h-full min-w-max">
              {dynamicColumns.map((column, index) => (
                <div
                  key={column.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-in fade-in-0 slide-in-from-left-4"
                >
                  <KanbanColumn
                    columnId={column.id}
                    title={column.title}
                    emails={emailsByColumn[column.id] || []}
                    selectedEmail={selectedEmail}
                    onCardClick={onSelectEmail}
                    loading={loading && !isLoaded}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DndContext>
  )
}

