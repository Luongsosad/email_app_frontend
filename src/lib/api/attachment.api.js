import { API_BASE_URL, getAuthHeaders } from './api-config'

/**
 * Download an attachment
 * @param {string} messageId - The message ID
 * @param {string} attachmentId - The attachment ID
 * @param {string} filename - The filename for download
 * @returns {Promise<void>}
 */
export const downloadAttachment = async (messageId, attachmentId, filename) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/attachments/${messageId}/${attachmentId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to download attachment')
    }

    // Create a blob from the response
    const blob = await response.blob()
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob)
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true }
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get attachment URL for preview
 * @param {string} messageId - The message ID
 * @param {string} attachmentId - The attachment ID
 * @returns {string} - The attachment URL with auth token
 */
export const getAttachmentUrl = (messageId, attachmentId) => {
  return `${API_BASE_URL}/attachments/${messageId}/${attachmentId}`
}

/**
 * Fetch attachment as blob for preview
 * @param {string} messageId - The message ID
 * @param {string} attachmentId - The attachment ID
 * @returns {Promise<Blob>} - The attachment blob
 */
export const fetchAttachmentBlob = async (messageId, attachmentId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/attachments/${messageId}/${attachmentId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch attachment')
    }

    return await response.blob()
  } catch (error) {
    console.error('Error fetching attachment blob:', error)
    throw error
  }
}
