import { useState, useCallback } from 'react'
import { emailApi, mailboxApi } from '../lib/api'

export function useEmail() {
  const [emails, setEmails] = useState([])
  const [emailDetail, setEmailDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })

  /**
   * Fetch emails by mailbox/folder
   */
  const fetchEmails = useCallback(async (mailboxId, page = 1, pageSize = 20) => {
    setLoading(true)
    setError(null)
    try {
      const response = await emailApi.fetchEmailsByMailbox(mailboxId, page, pageSize)
      if (response.success && response.data) {
        setEmails(response.data.emails || [])
        setPagination({
          page: response.data.page || page,
          pageSize: response.data.pageSize || pageSize,
          total: response.data.total || 0,
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
    setLoading(true)
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
      setLoading(false)
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
        if (emailDetail?.id === emailId) {
          setEmailDetail(prev => ({ ...prev, isStarred: !isStarred }))
        }
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to toggle star' }
    }
  }, [emailDetail])

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
        if (emailDetail?.id === emailId) {
          setEmailDetail(prev => ({ ...prev, isRead: true }))
        }
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to mark as read' }
    }
  }, [emailDetail])

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
        if (emailDetail?.id === emailId) {
          setEmailDetail(prev => ({ ...prev, isRead: false }))
        }
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

  return {
    emails,
    emailDetail,
    loading,
    error,
    pagination,
    fetchEmails,
    fetchEmailDetail,
    sendEmail,
    replyToEmail,
    toggleStar,
    markAsRead,
    markAsUnread,
    moveToSpam,
    archiveEmail,
    deleteEmail,
  }
}
