import { useEffect, useMemo, useState } from 'react'
import { GripVertical, Trash2, Plus, Pencil } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useKanbanColumns } from '../../hooks/use-kanban-columns'
import { useMailbox } from '../../hooks/use-mailbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

export default function KanbanSettings({ user }) {
  const userId = user?.id || user?.userId || null
  const {
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  } = useKanbanColumns(userId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null) // null = create, object = edit
  const [formTitle, setFormTitle] = useState('')
  const [formLabelId, setFormLabelId] = useState('')

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

  const handleAddColumn = () => {
    setEditingColumn(null)
    setFormTitle('')
    setFormLabelId('')
    setIsModalOpen(true)
  }

  const handleEditColumn = (column) => {
    setEditingColumn(column)
    setFormTitle(column.title || '')
    setFormLabelId(column.gmailLabelId || '')
    setIsModalOpen(true)
  }

  const handleSaveModal = async () => {
    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) {
      return
    }

    if (editingColumn) {
      // Edit existing
      await updateColumn(editingColumn.id, {
        title: trimmedTitle,
        gmailLabelId: formLabelId || null,
      })
    } else {
      // Create new
      await addColumn(trimmedTitle, formLabelId || null)
    }

    setIsModalOpen(false)
    setEditingColumn(null)
    setFormTitle('')
    setFormLabelId('')
  }

  const handleDeleteColumn = (id) => {
    // Prevent deleting built-in/default columns (Inbox, Snoozed, etc.)
    const column = columns.find((c) => c.id === id)
    if (column?.isDefault) return

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
        {columns.map((column) => {
          const mailboxLabel =
            availableLabels.find((mb) => mb.id === column.gmailLabelId)?.name ||
            (column.gmailLabelId || 'No Gmail label')

          return (
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

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{column.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Gmail label: {mailboxLabel}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Column ID: <span className="font-mono">{column.id}</span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => handleEditColumn(column)}
                title="Edit column"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              {!column.isDefault && (
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
          </div>
        )})}
      </div>

      <div className="flex items-center justify-end pt-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddColumn}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Column
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColumn ? 'Edit column' : 'Add new column'}
            </DialogTitle>
            <DialogDescription>
              Set the column name and optional Gmail label mapping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Column name
              </label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. In Review"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Gmail label (optional)
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                value={formLabelId}
                onChange={(e) => setFormLabelId(e.target.value)}
              >
                <option value="">No Gmail label</option>
                {availableLabels.map((mb) => (
                  <option key={mb.id} value={mb.id}>
                    {mb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveModal}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


