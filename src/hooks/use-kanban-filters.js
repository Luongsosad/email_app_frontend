import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook to manage sorting and filtering for Kanban board emails
 * Supports:
 * - Sorting by date (newest/oldest first)
 * - Filtering by unread status
 * - Filtering by attachments
 */
export function useKanbanFilters() {
  // Sorting state
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest'
  
  // Filter state
  const [filters, setFilters] = useState({
    showOnlyUnread: false,
    showOnlyWithAttachments: false,
  })

  // Update sorting
  const updateSort = useCallback((newSortBy) => {
    setSortBy(newSortBy)
  }, [])

  // Update individual filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      showOnlyUnread: false,
      showOnlyWithAttachments: false,
    })
  }, [])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.showOnlyUnread || filters.showOnlyWithAttachments
  }, [filters])

  // Apply sorting to a list of emails
  const sortEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    const sorted = [...emails].sort((a, b) => {
      // Use timestamp field from email object
      const dateA = new Date(a.timestamp || a.date || a.internalDate || 0)
      const dateB = new Date(b.timestamp || b.date || b.internalDate || 0)
      
      if (sortBy === 'newest') {
        return dateB - dateA // Newest first
      } else {
        return dateA - dateB // Oldest first
      }
    })
    
    return sorted
  }, [sortBy])

  // Apply filters to a list of emails
  const filterEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    return emails.filter(email => {
      // Filter by unread status
      if (filters.showOnlyUnread && email.isRead !== false) {
        return false
      }
      
      // Filter by attachments
      if (filters.showOnlyWithAttachments) {
        // Check for attachments array or hasAttachments boolean
        // Debugging: check what the email object has
        const hasArray = email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0
        const hasBool = email.hasAttachments === true
        
        // Uncomment to debug if needed
        // if (email.id === 'some-id') console.log('Filter debug:', { id: email.id, attachments: email.attachments, hasArray, hasBool })
        
        const hasAttachments = hasArray || hasBool
        if (!hasAttachments) {
          return false
        }
      }
      
      return true
    })
  }, [filters])

  // Apply both sorting and filtering
  const procesEmails = useCallback((emails) => {
    if (!emails || emails.length === 0) return []
    
    // First filter, then sort
    const filtered = filterEmails(emails)
    const sorted = sortEmails(filtered)
    
    return sorted
  }, [filterEmails, sortEmails])

  return {
    // State
    sortBy,
    filters,
    hasActiveFilters,
    
    // Actions
    updateSort,
    updateFilter,
    clearFilters,
    
    // Processing functions
    sortEmails,
    filterEmails,
    procesEmails,
  }
}
