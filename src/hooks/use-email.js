import { useState, useCallback } from 'react'
import { emailApi } from '../lib/api'

export function useEmail() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEmails = useCallback(async (folder) => {
    setLoading(true)
    setError(null)
    try {
      const response = await emailApi.fetchEmails(folder)
      if (response.success && response.data) {
        setEmails(response.data)
      } else {
        setError(response.error || 'Failed to fetch emails')
      }
    } catch (err) {
      setError('Error fetching emails')
    } finally {
      setLoading(false)
    }
  }, [])

  const sendEmail = useCallback(async (data) => {
    try {
      const response = await emailApi.sendEmail(data)
      if (response.success && response.data) {
        return { success: true, email: response.data }
      }
      return { success: false, error: response.error }
    } catch (err) {
      return { success: false, error: 'Failed to send email' }
    }
  }, [])

  const starEmail = useCallback((emailId) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
    ))
  }, [])

  const markAsSpam = useCallback((emailId) => {
    setEmails(prev => prev.filter(e => e.id !== emailId))
  }, [])

  const deleteEmail = useCallback((emailId) => {
    setEmails(prev => prev.filter(e => e.id !== emailId))
  }, [])

  const markAsRead = useCallback((emailId) => {
    setEmails(prev => prev.map(e =>
      e.id === emailId ? { ...e, isRead: true } : e
    ))
  }, [])

  return {
    emails,
    loading,
    error,
    fetchEmails,
    sendEmail,
    starEmail,
    markAsSpam,
    deleteEmail,
    markAsRead,
  }
}
