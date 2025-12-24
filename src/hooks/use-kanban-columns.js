import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_PREFIX = 'kanban_columns_config'

// Default columns used when user has no custom configuration yet
const DEFAULT_COLUMNS = [
  { id: 'inbox', title: 'Inbox', gmailLabelId: 'INBOX', order: 0 },
  { id: 'todo', title: 'To Do', gmailLabelId: 'STARRED', order: 1 },
  { id: 'in-progress', title: 'In Progress', gmailLabelId: null, order: 2 },
  { id: 'done', title: 'Done', gmailLabelId: null, order: 3 },
  { id: 'snoozed', title: 'Snoozed', gmailLabelId: 'SNOOZED', order: 4 },
]

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX
}

export function useKanbanColumns(userId = null) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Function to load columns from localStorage
  const loadColumns = useCallback(() => {
    try {
      const key = getStorageKey(userId)
      const stored = localStorage.getItem(key)

      if (stored) {
        const parsed = JSON.parse(stored)

        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure each column has required fields
          const normalized = parsed.map((col, index) => ({
            id: col.id || `col-${index}`,
            title: col.title || `Column ${index + 1}`,
            gmailLabelId: col.gmailLabelId || null,
            order: typeof col.order === 'number' ? col.order : index,
          }))

          setColumns(
            normalized.sort((a, b) => (a.order || 0) - (b.order || 0)),
          )
          setIsLoaded(true)
          return
        }
      }

      // Fallback to defaults if nothing stored
      setColumns(DEFAULT_COLUMNS)
    } catch (error) {
      console.error('Failed to load kanban columns:', error)
      setColumns(DEFAULT_COLUMNS)
    } finally {
      setIsLoaded(true)
    }
  }, [userId])

  // Load columns from localStorage on mount and when userId changes
  useEffect(() => {
    loadColumns()
  }, [loadColumns])

  // Listen for storage changes to reload columns
  useEffect(() => {
    const handleStorageChange = (e) => {
      const key = getStorageKey(userId)
      if (e.key === key || (e.key === null && e.newValue === null)) {
        // Reload columns when storage changes
        loadColumns()
      }
    }

    const handleCustomEvent = () => {
      // Reload columns when custom event is triggered
      loadColumns()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('kanbanColumnsUpdated', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('kanbanColumnsUpdated', handleCustomEvent)
    }
  }, [userId, loadColumns])

  // Save to localStorage
  const saveColumns = useCallback(
    (nextColumns) => {
      try {
        const key = getStorageKey(userId)
        setColumns(nextColumns)
        localStorage.setItem(key, JSON.stringify(nextColumns))
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('kanbanColumnsUpdated'))
      } catch (error) {
        console.error('Failed to save kanban columns:', error)
      }
    },
    [userId],
  )

  // Public helpers
  const getColumns = useCallback(
    () => columns.slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    [columns],
  )

  const getColumnById = useCallback(
    (columnId) => columns.find((col) => col.id === columnId) || null,
    [columns],
  )

  const addColumn = useCallback(
    (title, gmailLabelId = null) => {
      const nextId = `col-${Date.now()}`
      const maxOrder =
        columns.length > 0
          ? Math.max(...columns.map((c) => typeof c.order === 'number' ? c.order : 0))
          : 0

      const nextColumns = [
        ...columns,
        {
          id: nextId,
          title: title || 'New Column',
          gmailLabelId: gmailLabelId || null,
          order: maxOrder + 1,
        },
      ]

      saveColumns(nextColumns)
      return nextId
    },
    [columns, saveColumns],
  )

  const updateColumn = useCallback(
    (columnId, updates) => {
      const nextColumns = columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              ...updates,
              // Ensure order is a number
              order:
                typeof updates.order === 'number'
                  ? updates.order
                  : typeof col.order === 'number'
                  ? col.order
                  : 0,
            }
          : col,
      )

      saveColumns(nextColumns)
    },
    [columns, saveColumns],
  )

  const deleteColumn = useCallback(
    (columnId) => {
      // Never allow deleting inbox column
      if (columnId === 'inbox') {
        return false
      }

      const nextColumns = columns.filter((col) => col.id !== columnId)

      // Ensure at least one column remains
      if (nextColumns.length === 0) {
        return false
      }

      saveColumns(nextColumns)
      return true
    },
    [columns, saveColumns],
  )

  const reorderColumns = useCallback(
    (orderedIds) => {
      const idToColumn = new Map(columns.map((c) => [c.id, c]))

      const nextColumns = orderedIds
        .map((id, index) => {
          const col = idToColumn.get(id)
          if (!col) return null
          return { ...col, order: index }
        })
        .filter(Boolean)

      // Append any missing columns (if orderedIds didn't contain all)
      columns.forEach((col) => {
        if (!orderedIds.includes(col.id)) {
          nextColumns.push({
            ...col,
            order: nextColumns.length,
          })
        }
      })

      saveColumns(nextColumns)
    },
    [columns, saveColumns],
  )

  return {
    columns: getColumns(),
    isLoaded,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    getColumnById,
  }
}

export { DEFAULT_COLUMNS }


