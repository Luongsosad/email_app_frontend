import { useState, useCallback } from 'react'
import { emailApi } from '../lib/api'

export function useCompose() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [composeData, setComposeData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    htmlBody: '',
    attachments: [],
  })

  const updateCompose = useCallback((updates) => {
    setComposeData(prev => ({ ...prev, ...updates }))
  }, [])

  const addAttachment = useCallback(async (file) => {
    try {
      const response = await emailApi.uploadAttachment(file)
      if (response.success && response.data) {
        const attachment = {
          id: `att-${Date.now()}`,
          name: response.data.name,
          size: response.data.size,
          type: file.type,
          url: response.data.url,
        }
        setComposeData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment],
        }))
      }
    } catch (err) {
      console.error('Failed to upload attachment')
    }
  }, [])

  const removeAttachment = useCallback((attachmentId) => {
    setComposeData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attachmentId),
    }))
  }, [])

  const resetCompose = useCallback(() => {
    setComposeData({
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
      htmlBody: '',
      attachments: [],
    })
  }, [])

  const openCompose = useCallback(() => setIsOpen(true), [])
  const closeCompose = useCallback(() => {
    setIsOpen(false)
    resetCompose()
  }, [resetCompose])

  return {
    isOpen,
    isSending,
    composeData,
    openCompose,
    closeCompose,
    updateCompose,
    addAttachment,
    removeAttachment,
    resetCompose,
    setIsSending,
  }
}
