import { useState, useEffect, useCallback } from 'react'
import { kanbanApi } from '../lib/api'

const STORAGE_KEY_PREFIX = 'kanban_columns_config'

// Default columns used as a fallback when user has no data yet
// or when backend is not reachable.
const DEFAULT_COLUMNS = [
  { id: 'inbox', title: 'Inbox', gmailLabelId: 'INBOX', order: 0, isDefault: true },
  { id: 'todo', title: 'To Do', gmailLabelId: 'STARRED', order: 1, isDefault: true },
  { id: 'in-progress', title: 'In Progress', gmailLabelId: null, order: 2, isDefault: true },
  { id: 'done', title: 'Done', gmailLabelId: null, order: 3, isDefault: true },
  // Snoozed is a virtual column that is driven by snooze feature, not DB
  { id: 'snoozed', title: 'Snoozed', gmailLabelId: 'SNOOZED', order: 4, isDefault: true },
]

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX
}

// Merge backend columns with any locally stored extra metadata (currently gmailLabelId)
function mergeWithLocalMetadata(userId, backendColumns) {
  try {
    const key = getStorageKey(userId)
    const stored = localStorage.getItem(key)
    if (!stored) {
      return backendColumns
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return backendColumns
    }

    const metaById = new Map(parsed.map((c) => [String(c.id), c]))
    return backendColumns.map((col) => {
      const meta = metaById.get(String(col.id))
      return {
        ...col,
        gmailLabelId: meta?.gmailLabelId ?? col.gmailLabelId ?? null,
      }
    })
  } catch (error) {
    console.error('Failed to merge kanban column metadata from localStorage:', error)
    return backendColumns
  }
}

// Persist only extra metadata locally (currently gmailLabelId)
function persistLocalMetadata(userId, columns) {
  try {
    const key = getStorageKey(userId)
    const payload = columns.map((col) => ({
      id: col.id,
      gmailLabelId: col.gmailLabelId ?? null,
    }))
    localStorage.setItem(key, JSON.stringify(payload))
    window.dispatchEvent(new Event('kanbanColumnsUpdated'))
  } catch (error) {
    console.error('Failed to save kanban columns metadata:', error)
  }
}

export function useKanbanColumns(userId = null) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadColumnsFromBackend = useCallback(async () => {
    // If there is no user, fall back to defaults/local only
    if (!userId) {
      setColumns(DEFAULT_COLUMNS)
      setIsLoaded(true)
      return
    }

    try {
      const result = await kanbanApi.fetchKanbanColumns()
      if (result.success && result.data?.columns) {
        const backendColumns = result.data.columns
          .map((c, index) => ({
            id: String(c.id),
            title: c.name || `Column ${index + 1}`,
            gmailLabelId: c.gmailLabelId ?? null,
            order: typeof c.order === 'number' ? c.order : index,
            isDefault: !!c.isDefault,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))

        // Merge with any existing local Gmail label mapping
        let merged = mergeWithLocalMetadata(userId, backendColumns)

        // Ensure we always have the virtual Snoozed column at the end
        const hasSnoozed = merged.some((c) => c.id === 'snoozed')
        if (!hasSnoozed) {
          merged = [
            ...merged,
            DEFAULT_COLUMNS.find((c) => c.id === 'snoozed'),
          ].filter(Boolean)
        }

        setColumns(merged)
      } else {
        // Backend available nhưng không trả dữ liệu hợp lệ -> fallback
        console.warn('Kanban columns API returned no data, falling back to defaults')
        setColumns(DEFAULT_COLUMNS)
      }
    } catch (error) {
      console.error('Failed to load kanban columns from backend:', error)
      setColumns(DEFAULT_COLUMNS)
    } finally {
      setIsLoaded(true)
    }
  }, [userId])

  // Initial load from backend
  useEffect(() => {
    loadColumnsFromBackend()
  }, [loadColumnsFromBackend])

  // Lắng nghe event custom để reload khi nơi khác thay đổi cột
  useEffect(() => {
    const handleCustomEvent = () => {
      loadColumnsFromBackend()
    }

    window.addEventListener('kanbanColumnsUpdated', handleCustomEvent)

    return () => {
      window.removeEventListener('kanbanColumnsUpdated', handleCustomEvent)
    }
  }, [loadColumnsFromBackend])

  // Helper: sort columns for public exposure
  const getColumns = useCallback(
    () => columns.slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    [columns],
  )

  const getColumnById = useCallback(
    (columnId) => columns.find((col) => String(col.id) === String(columnId)) || null,
    [columns],
  )

  const addColumn = useCallback(
    async (title, gmailLabelId = null) => {
      // Virtual column (no user) -> local only
      if (!userId) {
        const maxOrder =
          columns.length > 0
            ? Math.max(
                ...columns.map((c) =>
                  typeof c.order === 'number' ? c.order : 0,
                ),
              )
            : 0

        const nextId = `col-${Date.now()}`
        const nextColumns = [
          ...columns,
          {
            id: nextId,
            title: title || 'New Column',
            gmailLabelId: gmailLabelId || null,
            order: maxOrder + 1,
            isDefault: false,
          },
        ]

        setColumns(nextColumns)
        persistLocalMetadata(userId, nextColumns)
        return nextId
      }

      // Real user -> tạo trên backend
      setIsSaving(true)
      try {
        const maxOrder =
          columns.length > 0
            ? Math.max(
                ...columns
                  .filter((c) => c.id !== 'snoozed')
                  .map((c) =>
                    typeof c.order === 'number' ? c.order : 0,
                  ),
              )
            : 0

        const result = await kanbanApi.createKanbanColumn({
          name: title || 'New Column',
          order: maxOrder + 1,
        })

        if (result.success && result.data) {
          // Reload full list to keep consistent with server
          await loadColumnsFromBackend()

          // Try to find created id from response
          const createdId = result.data.id ?? result.data.column?.id
          if (createdId != null) {
            // Persist gmailLabelId mapping locally if provided
            if (gmailLabelId) {
              setColumns((current) => {
                const updated = current.map((c) =>
                  String(c.id) === String(createdId)
                    ? { ...c, gmailLabelId }
                    : c,
                )
                persistLocalMetadata(userId, updated)
                return updated
              })
            }
            return String(createdId)
          }
        }

        // Nếu backend không trả id rõ ràng, chỉ cần reload là được
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [columns, userId, loadColumnsFromBackend],
  )

  const updateColumn = useCallback(
    async (columnId, updates) => {
      // Snoozed là cột ảo -> chỉ lưu local metadata
      if (String(columnId) === 'snoozed') {
        setColumns((current) => {
          const next = current.map((col) =>
            String(col.id) === 'snoozed'
              ? {
                  ...col,
                  ...updates,
                  order:
                    typeof updates.order === 'number'
                      ? updates.order
                      : typeof col.order === 'number'
                      ? col.order
                      : 0,
                }
              : col,
          )
          persistLocalMetadata(userId, next)
          return next
        })
        return
      }

      // Không có user -> mọi thứ ở local
      if (!userId) {
        setColumns((current) => {
          const next = current.map((col) =>
            String(col.id) === String(columnId)
              ? {
                  ...col,
                  ...updates,
                  order:
                    typeof updates.order === 'number'
                      ? updates.order
                      : typeof col.order === 'number'
                      ? col.order
                      : 0,
                }
              : col,
          )
          persistLocalMetadata(userId, next)
          return next
        })
        return
      }

      setIsSaving(true)
      try {
        const payload = {}
        if (typeof updates.title === 'string') {
          payload.name = updates.title
        }
        if (typeof updates.order === 'number') {
          payload.order = updates.order
        }

        if (Object.keys(payload).length > 0) {
          await kanbanApi.updateKanbanColumn(columnId, payload)
        }

        // Gmail label mapping chỉ lưu local
        setColumns((current) => {
          const next = current.map((col) =>
            String(col.id) === String(columnId)
              ? {
                  ...col,
                  ...updates,
                  order:
                    typeof updates.order === 'number'
                      ? updates.order
                      : typeof col.order === 'number'
                      ? col.order
                      : 0,
                }
              : col,
          )
          persistLocalMetadata(userId, next)
          return next
        })
      } finally {
        setIsSaving(false)
      }
    },
    [userId],
  )

  const deleteColumn = useCallback(
    async (columnId) => {
      // Không bao giờ xóa cột Snoozed (ảo)
      if (String(columnId) === 'snoozed') {
        return false
      }

      // Không có user -> local only
      if (!userId) {
        const nextColumns = columns.filter(
          (col) => String(col.id) !== String(columnId),
        )

        if (nextColumns.length === 0) {
          return false
        }

        setColumns(nextColumns)
        persistLocalMetadata(userId, nextColumns)
        return true
      }

      setIsSaving(true)
      try {
        await kanbanApi.deleteKanbanColumn(columnId)
        await loadColumnsFromBackend()
        return true
      } catch (error) {
        console.error('Failed to delete kanban column:', error)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [columns, userId, loadColumnsFromBackend],
  )

  const reorderColumns = useCallback(
    async (orderedIds) => {
      // Luôn giữ Snoozed ở cuối nếu có
      const withoutSnoozed = orderedIds.filter(
        (id) => String(id) !== 'snoozed',
      )

      // Không có user -> chỉ reorder local
      if (!userId) {
        const idToColumn = new Map(columns.map((c) => [String(c.id), c]))

        const nextColumns = withoutSnoozed
          .map((id, index) => {
            const col = idToColumn.get(String(id))
            if (!col) return null
            return { ...col, order: index }
          })
          .filter(Boolean)

        // Append any missing columns (including snoozed)
        columns.forEach((col) => {
          if (!withoutSnoozed.includes(String(col.id))) {
            nextColumns.push({
              ...col,
              order: nextColumns.length,
            })
          }
        })

        setColumns(nextColumns)
        persistLocalMetadata(userId, nextColumns)
        return
      }

      setIsSaving(true)
      try {
        // Gửi lên backend chỉ các ID cột thật (số)
        const numericIds = withoutSnoozed.filter(
          (id) => !isNaN(Number(id)),
        )
        if (numericIds.length > 0) {
          await kanbanApi.reorderKanbanColumns(numericIds)
        }

        await loadColumnsFromBackend()
      } finally {
        setIsSaving(false)
      }
    },
    [columns, userId, loadColumnsFromBackend],
  )

  return {
    columns: getColumns(),
    isLoaded,
    isSaving,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    getColumnById,
  }
}

export { DEFAULT_COLUMNS }


