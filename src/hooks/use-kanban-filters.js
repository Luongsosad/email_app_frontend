import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook to manage sorting and filtering for Kanban board emails
 * Supports:
 * - Sorting by date (newest/oldest first)
 * - Filtering by unread status
 * - Filtering by attachments
 */
export function useKanbanFilters() {
  const [sortBy, setSortBy] = useState('newest')
  
  const [filters, setFilters] = useState({
    showOnlyUnread: false,
    showOnlyWithAttachments: false,
  })

  const updateSort = useCallback((newSortBy) => {
    setSortBy(newSortBy)
  }, [])

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      showOnlyUnread: false,
      showOnlyWithAttachments: false,
    })
  }, [])

  const hasActiveFilters = useMemo(() => {
    return filters.showOnlyUnread || filters.showOnlyWithAttachments
  }, [filters])

  const sortEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    const sorted = [...emails].sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || a.internalDate || 0)
      const dateB = new Date(b.timestamp || b.date || b.internalDate || 0)
      
      if (sortBy === 'newest') {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })
    
    return sorted
  }, [sortBy])

  const filterEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    return emails.filter(email => {
      if (filters.showOnlyUnread && email.isRead !== false) {
        return false
      }
      
      if (filters.showOnlyWithAttachments) {
        const hasAttachments = (email.attachments && email.attachments.length > 0) || email.hasAttachments === true
        if (!hasAttachments) {
          return false
        }
      }
      
      return true
    })
  }, [filters])

  const procesEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    const filtered = filterEmails(emails)
    const sorted = sortEmails(filtered)
    
    return sorted
  }, [filterEmails, sortEmails])

  return {
    sortBy,
    filters,
    hasActiveFilters,
    updateSort,
    updateFilter,
    clearFilters,
    sortEmails,
    filterEmails,
    procesEmails,
  }
}
