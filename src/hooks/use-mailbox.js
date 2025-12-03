import { useState, useCallback, useEffect } from 'react'
import { mailboxApi } from '../lib/api'

export function useMailbox() {
  const [mailboxes, setMailboxes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch all mailboxes (folders)
   */
  const fetchMailboxes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await mailboxApi.fetchMailboxes()
      if (response.success && response.data) {
        setMailboxes(response.data)
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to fetch mailboxes')
        return { success: false, error: response.error }
      }
    } catch (err) {
      setError('Error fetching mailboxes')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get unread count for a specific mailbox
   */
  const getUnreadCount = useCallback((mailboxId) => {
    const mailbox = mailboxes.find(m => m.id === mailboxId)
    return mailbox?.unreadCount || 0
  }, [mailboxes])

  /**
   * Get all unread counts as an object
   */
  const getUnreadCounts = useCallback(() => {
    const counts = {}
    mailboxes.forEach(mailbox => {
      counts[mailbox.id.toLowerCase()] = mailbox.unreadCount || 0
    })
    return counts
  }, [mailboxes])

  return {
    mailboxes,
    loading,
    error,
    fetchMailboxes,
    getUnreadCount,
    getUnreadCounts,
  }
}
