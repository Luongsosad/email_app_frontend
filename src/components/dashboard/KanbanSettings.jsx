import { useEffect, useMemo } from 'react'
import { GripVertical, Trash2, Plus, Save } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useKanbanColumns } from '../../hooks/use-kanban-columns'
import { useMailbox } from '../../hooks/use-mailbox'

export default function KanbanSettings({ user }) {
  const userId = user?.id || user?.userId || null
  const {
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  } = useKanbanColumns(userId)

  const { mailboxes, fetchMailboxes } = useMailbox()

  // Load mailboxes on mount
  useEffect(() => {
    fetchMailboxes()
  }, [fetchMailboxes])

  const availableLabels = useMemo(() => {
    if (!mailboxes || mailboxes.length === 0) return []

    // Exclude some system folders that don't make sense as kanban states
    const excluded = new Set(['INBOX', 'TRASH', 'SPAM'])

    return mailboxes.filter((mb) => !excluded.has(mb.id))
  }, [mailboxes])

  const handleTitleChange = (id, title) => {
    updateColumn(id, { title })
  }

  const handleLabelChange = (id, gmailLabelId) => {
    updateColumn(id, { gmailLabelId: gmailLabelId || null })
  }

  const handleAddColumn = () => {
    addColumn('New Column', null)
  }

  const handleDeleteColumn = (id) => {
    // Prevent deleting inbox column
    if (id === 'inbox') return

    deleteColumn(id)
  }

  const moveColumn = (id, direction) => {
    const index = columns.findIndex((c) => c.id === id)
    if (index === -1) return

    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= columns.length) return

    const orderedIds = [...columns.map((c) => c.id)]
    const [moved] = orderedIds.splice(index, 1)
    orderedIds.splice(newIndex, 0, moved)

    reorderColumns(orderedIds)
  }

  // All changes are persisted immediately via useKanbanColumns.
  // The Save button is kept for UX feedback (no-op for now).
  const handleSave = () => {}

  return (
    <div className="p-6 border-t border-border space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Kanban Board Configuration
      </h3>

      <p className="text-sm text-muted-foreground">
        Customize your Kanban workflow. Map each column to a Gmail label so
        that dragging emails between columns will automatically update their
        labels.
      </p>

      <div className="space-y-3">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => moveColumn(column.id, -1)}
              title="Move up"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={column.title}
                  onChange={(e) =>
                    handleTitleChange(column.id, e.target.value)
                  }
                  placeholder="Column title"
                />
                <select
                  className="min-w-[180px] px-3 py-1 border border-border rounded-md bg-background text-sm"
                  value={column.gmailLabelId || ''}
                  onChange={(e) =>
                    handleLabelChange(column.id, e.target.value || null)
                  }
                >
                  <option value="">No Gmail label</option>
                  {availableLabels.map((mb) => (
                    <option key={mb.id} value={mb.id}>
                      {mb.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Column ID: <span className="font-mono">{column.id}</span>
              </p>
            </div>

            {column.id !== 'inbox' && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => handleDeleteColumn(column.id)}
                title="Delete column"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddColumn}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Column
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}


