import { useState, useCallback } from 'react'

export function useSearch(emails) {
  const [searchQuery, setSearchQuery] = useState('')

  const search = useCallback((query) => {
    if (!query.trim()) return emails

    const lowerQuery = query.toLowerCase()
    return emails.filter(email =>
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.from.toLowerCase().includes(lowerQuery) ||
      email.fromName?.toLowerCase().includes(lowerQuery) ||
      email.body.toLowerCase().includes(lowerQuery) ||
      email.to.some(t => t.toLowerCase().includes(lowerQuery)) ||
      email.cc.some(c => c.toLowerCase().includes(lowerQuery))
    )
  }, [emails])

  const results = search(searchQuery)

  return {
    searchQuery,
    setSearchQuery,
    results,
  }
}
