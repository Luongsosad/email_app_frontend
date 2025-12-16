import { useState, useCallback } from 'react'
import { emailApi, mailboxApi } from '../lib/api'

export function useEmail() {
  const [emails, setEmails] = useState([])
  const [emailDetail, setEmailDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState(null)
  const [searchMode, setSearchMode] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    nextPageToken: null,
  })

  /**
   * Fetch emails by mailbox/folder
   */
  const fetchEmails = useCallback(async (mailboxId, page = 1, pageSize = 20, search = '', pageToken = '') => {
    setLoading(true)
    setSearchMode(false)
    setError(null)
    setSearchError(null)
    try {
      // Handle snoozed folder separately
      if (mailboxId === 'snoozed') {
        console.log('[use-email] Fetching snoozed emails...')
        const response = await emailApi.getSnoozedEmails()
        console.log('[use-email] Snoozed response:', response)
        if (response.success && response.data) {
          // Backend now returns array of emails directly with snoozeUntil field
          const snoozedEmails = response.data || []
          console.log('[use-email] Snoozed emails:', snoozedEmails)
          setEmails(snoozedEmails)
          setPagination({
            page: 1,
            pageSize: snoozedEmails.length,
            total: snoozedEmails.length,
            nextPageToken: null,
          })
          return { success: true, data: { emails: snoozedEmails } }
        } else {
          console.error('[use-email] Failed to fetch snoozed emails:', response.error)
          setError(response.error || 'Failed to fetch snoozed emails')
          return { success: false, error: response.error }
        }
      }
      
      // Regular mailbox fetch
      const response = await emailApi.fetchEmailsByMailbox(mailboxId, page, pageSize, search, pageToken)
      if (response.success && response.data) {
        setEmails(response.data.emails || [])
        setPagination({
          page: response.data.page || page,
          pageSize: response.data.pageSize || pageSize,
          total: response.data.total || 0,
          nextPageToken: response.data.nextPageToken || null,
        })
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to fetch emails')
        return { success: false, error: response.error }
      }
    } catch (err) {
      setError('Error fetching emails')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch email detail by ID
   */
  const fetchEmailDetail = useCallback(async (emailId) => {
    setLoadingDetail(true)
    setError(null)
    try {
      const response = await emailApi.fetchEmailDetail(emailId)
      if (response.success && response.data) {
        setEmailDetail(response.data)
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to fetch email detail')
        return { success: false, error: response.error }
      }
    } catch (err) {
      setError('Error fetching email detail')
      return { success: false, error: err.message }
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  /**
   * Send a new email
   */
  const sendEmail = useCallback(async (emailData) => {
    try {
      const response = await emailApi.sendEmail(emailData)
      if (response.success && response.data) {
        return { success: true, data: response.data }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to send email' }
    }
  }, [])

  /**
   * Reply to an email
   */
  const replyToEmail = useCallback(async (emailId, replyData) => {
    try {
      const response = await emailApi.replyToEmail(emailId, replyData)
      if (response.success && response.data) {
        return { success: true, data: response.data }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to reply to email' }
    }
  }, [])

  /**
   * Toggle star on an email
   */
  const toggleStar = useCallback(async (emailId, isStarred) => {
    try {
      const response = await emailApi.toggleStar(emailId, !isStarred)
      if (response.success) {
        // Update local state
        setEmails(prev => prev.map(e => 
          e.id === emailId ? { ...e, isStarred: !isStarred } : e
        ))
        setEmailDetail(prev => prev?.id === emailId ? { ...prev, isStarred: !isStarred } : prev)
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to toggle star' }
    }
  }, [])

  /**
   * Mark email as read
   */
  const markAsRead = useCallback(async (emailId) => {
    try {
      const response = await emailApi.markAsRead(emailId)
      if (response.success) {
        // Update local state
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, isRead: true } : e
        ))
        setEmailDetail(prev => prev?.id === emailId ? { ...prev, isRead: true } : prev)
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to mark as read' }
    }
  }, [])

  /**
   * Mark email as unread
   */
  const markAsUnread = useCallback(async (emailId) => {
    try {
      const response = await emailApi.markAsUnread(emailId)
      if (response.success) {
        // Update local state
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, isRead: false } : e
        ))
        setEmailDetail(prev => prev?.id === emailId ? { ...prev, isRead: false } : prev)
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to mark as unread' }
    }
  }, [emailDetail])

  /**
   * Move email to spam
   */
  const moveToSpam = useCallback(async (emailId) => {
    try {
      const response = await emailApi.moveToSpam(emailId)
      if (response.success) {
        // Remove from current list
        setEmails(prev => prev.filter(e => e.id !== emailId))
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to move to spam' }
    }
  }, [])

  /**
   * Archive an email
   */
  const archiveEmail = useCallback(async (emailId) => {
    try {
      const response = await emailApi.archiveEmail(emailId)
      if (response.success) {
        // Remove from current list
        setEmails(prev => prev.filter(e => e.id !== emailId))
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to archive email' }
    }
  }, [])

  /**
   * Delete an email
   */
  const deleteEmail = useCallback(async (emailId, permanent = false) => {
    try {
      const response = await emailApi.deleteEmail(emailId, permanent)
      if (response.success) {
        // Remove from current list
        setEmails(prev => prev.filter(e => e.id !== emailId))
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to delete email' }
    }
  }, [])

  /**
   * Fuzzy search emails using backend search endpoint
   */
  const searchEmailsFuzzy = useCallback(async (query, page = 1, pageSize = 20) => {
    setLoading(true)
    setSearchMode(true)
    setSearchError(null)
    setError(null)

    try {
      const response = await emailApi.searchEmailsFuzzy(query, page, pageSize)
      if (response.success && response.data) {
        setEmails(response.data.emails || [])
        setPagination({
          page: response.data.page || page,
          pageSize: response.data.pageSize || pageSize,
          total: response.data.total || 0,
          nextPageToken: null,
        })
        return { success: true, data: response.data }
      }

      const message = response.error || 'Failed to search emails'
      setSearchError(message)
      return { success: false, error: message }
    } catch (err) {
      const message = err?.message || 'Error searching emails'
      setSearchError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clear search mode and optionally reload mailbox emails
   */
  const clearSearch = useCallback(async (mailboxId, page = 1, pageSize = 20) => {
    setSearchMode(false)
    setSearchError(null)

    if (mailboxId) {
      // Reload current mailbox with no search query
      await fetchEmails(mailboxId, page, pageSize, '', '')
    }
  }, [fetchEmails])

  return {
    emails,
    emailDetail,
    loading,
    loadingDetail,
    error,
    searchMode,
    searchError,
    pagination,
    fetchEmails,
    fetchEmailDetail,
    searchEmailsFuzzy,
    clearSearch,
    sendEmail,
    replyToEmail,
    toggleStar,
    markAsRead,
    markAsUnread,
    moveToSpam,
    archiveEmail,
    deleteEmail,
    setEmails, // Export setEmails for direct state updates
  }
}
