import { useState } from 'react'

const STORAGE_KEY = 'promail_emails'
const DRAFTS_KEY = 'promail_drafts'

export function useEmailStorage() {
  const [isLoading, setIsLoading] = useState(true)

  // Load emails from localStorage
  const loadEmails = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error('Failed to load emails:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Save emails to localStorage
  const saveEmails = (emails) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emails))
    } catch (err) {
      console.error('Failed to save emails:', err)
    }
  }

  // Load draft emails
  const loadDrafts = () => {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error('Failed to load drafts:', err)
      return []
    }
  }

  // Save draft
  const saveDraft = (draftEmail) => {
    try {
      const drafts = loadDrafts()
      const existingIndex = drafts.findIndex((d) => d.id === draftEmail.id)
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = draftEmail
      } else {
        drafts.push(draftEmail)
      }
      
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
    } catch (err) {
      console.error('Failed to save draft:', err)
    }
  }

  // Delete draft
  const deleteDraft = (draftId) => {
    try {
      const drafts = loadDrafts().filter((d) => d.id !== draftId)
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
    } catch (err) {
      console.error('Failed to delete draft:', err)
    }
  }

  return {
    isLoading,
    loadEmails,
    saveEmails,
    loadDrafts,
    saveDraft,
    deleteDraft,
  }
}
