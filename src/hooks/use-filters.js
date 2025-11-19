import { useState, useCallback } from 'react'

export function useFilters(emails) {
  const [filters, setFilters] = useState({
    isStarred: false,
    isUnread: false,
    hasAttachments: false,
    from: null,
  })

  const applyFilters = useCallback((emailList) => {
    return emailList.filter(email => {
      if (filters.isStarred && !email.isStarred) return false
      if (filters.isUnread && email.isRead) return false
      if (filters.hasAttachments && email.attachments.length === 0) return false
      if (filters.from && email.from !== filters.from) return false
      return true
    })
  }, [filters])

  const filteredEmails = applyFilters(emails)

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      isStarred: false,
      isUnread: false,
      hasAttachments: false,
      from: null,
    })
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
    filteredEmails,
  }
}
