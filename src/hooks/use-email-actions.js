import { useState, useCallback } from 'react'

export function useEmailActions(initialEmails) {
  const [emails, setEmails] = useState(initialEmails)
  const [actionHistory, setActionHistory] = useState([])

  const addAction = useCallback((action) => {
    setActionHistory(prev => [...prev, { ...action, timestamp: new Date() }])
  }, [])

  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[actionHistory.length - 1]
    setActionHistory(prev => prev.slice(0, -1))

    // Reverse the last action
    switch (lastAction.type) {
      case 'DELETE':
        // Restore from trash
        setEmails(prev =>
          prev.map(e => e.id === lastAction.emailId ? { ...e, folder: 'inbox' } : e)
        )
        break
      case 'STAR':
        setEmails(prev =>
          prev.map(e => e.id === lastAction.emailId ? { ...e, isStarred: false } : e)
        )
        break
      case 'MARK_READ':
        setEmails(prev =>
          prev.map(e => e.id === lastAction.emailId ? { ...e, isRead: false } : e)
        )
        break
    }
  }, [actionHistory])

  const starEmail = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, isStarred: !e.isStarred } : e)
    )
    addAction({ type: 'STAR', emailId })
  }, [addAction])

  const deleteEmail = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, folder: 'trash' } : e)
    )
    addAction({ type: 'DELETE', emailId })
  }, [addAction])

  const markAsSpam = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, folder: 'spam', isSpam: true } : e)
    )
    addAction({ type: 'SPAM', emailId })
  }, [addAction])

  const archiveEmail = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, folder: 'archive' } : e)
    )
    addAction({ type: 'ARCHIVE', emailId })
  }, [addAction])

  const markAsRead = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, isRead: true } : e)
    )
    addAction({ type: 'MARK_READ', emailId })
  }, [addAction])

  const restoreFromTrash = useCallback((emailId) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, folder: 'inbox' } : e)
    )
    addAction({ type: 'RESTORE', emailId })
  }, [addAction])

  return {
    emails,
    setEmails,
    starEmail,
    deleteEmail,
    markAsSpam,
    archiveEmail,
    markAsRead,
    restoreFromTrash,
    undoLastAction,
    canUndo: actionHistory.length > 0,
  }
}
