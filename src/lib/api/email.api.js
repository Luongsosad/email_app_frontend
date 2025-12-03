import { apiCall } from './api-helper'
import { API_ENDPOINTS } from './api-config'

/**
 * Fetch emails by mailbox (folder)
 * @param {string} mailboxId - The mailbox ID (e.g., 'INBOX', 'SENT')
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of emails per page (default: 20)
 * @param {string} search - Search query (optional)
 * @param {string} pageToken - Page token for pagination (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchEmailsByMailbox = async (mailboxId, page = 1, pageSize = 20, search = '', pageToken = '') => {
  try {
    let endpoint = `${API_ENDPOINTS.EMAILS.LIST(mailboxId)}?page=${page}&pageSize=${pageSize}`
    if (search && search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`
    }
    if (pageToken) {
      endpoint += `&pageToken=${encodeURIComponent(pageToken)}`
    }
    return await apiCall(endpoint)
  } catch (error) {
    console.error('Error fetching emails:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get email detail by ID
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchEmailDetail = async (emailId) => {
  try {
    return await apiCall(API_ENDPOINTS.EMAILS.GET(emailId))
  } catch (error) {
    console.error('Error fetching email detail:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send a new email
 * @param {Object} emailData - Email data
 * @param {string[]} emailData.to - Array of recipient emails
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body
 * @param {string[]} emailData.cc - Array of CC emails (optional)
 * @param {string[]} emailData.bcc - Array of BCC emails (optional)
 * @param {Array<{filename: string, content: string, mimeType: string}>} emailData.attachments - Attachments (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const sendEmail = async (emailData) => {
  try {
    return await apiCall(API_ENDPOINTS.EMAILS.SEND, {
      method: 'POST',
      body: JSON.stringify(emailData),
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reply to an email
 * @param {string} emailId - The email ID to reply to
 * @param {Object} replyData - Reply data
 * @param {string} replyData.body - Reply body
 * @param {Array<{filename: string, content: string, mimeType: string}>} replyData.attachments - Attachments (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const replyToEmail = async (emailId, replyData) => {
  try {
    return await apiCall(`/emails/${emailId}/reply`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    })
  } catch (error) {
    console.error('Error replying to email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Modify email (mark read/unread, star, etc.)
 * @param {string} emailId - The email ID
 * @param {Object} modifyData - Modify data
 * @param {string[]} modifyData.addLabelIds - Label IDs to add (e.g., ['STARRED', 'UNREAD'])
 * @param {string[]} modifyData.removeLabelIds - Label IDs to remove (e.g., ['UNREAD'])
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const modifyEmail = async (emailId, modifyData) => {
  try {
    return await apiCall(`/emails/${emailId}/modify`, {
      method: 'POST',
      body: JSON.stringify(modifyData),
    })
  } catch (error) {
    console.error('Error modifying email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete an email (move to trash or permanently delete)
 * @param {string} emailId - The email ID
 * @param {boolean} permanent - Whether to permanently delete (default: false)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteEmail = async (emailId, permanent = false) => {
  try {
    return await apiCall(`/emails/${emailId}/delete?permanent=${permanent}`, {
      method: 'POST',
    })
  } catch (error) {
    console.error('Error deleting email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark email as read
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const markAsRead = async (emailId) => {
  return modifyEmail(emailId, {
    removeLabelIds: ['UNREAD'],
  })
}

/**
 * Mark email as unread
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const markAsUnread = async (emailId) => {
  return modifyEmail(emailId, {
    addLabelIds: ['UNREAD'],
  })
}

/**
 * Star/unstar an email
 * @param {string} emailId - The email ID
 * @param {boolean} starred - Whether to star or unstar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const toggleStar = async (emailId, starred) => {
  return modifyEmail(emailId, {
    addLabelIds: starred ? ['STARRED'] : [],
    removeLabelIds: starred ? [] : ['STARRED'],
  })
}

/**
 * Move email to spam
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const moveToSpam = async (emailId) => {
  return modifyEmail(emailId, {
    addLabelIds: ['SPAM'],
    removeLabelIds: ['INBOX'],
  })
}

/**
 * Archive an email
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const archiveEmail = async (emailId) => {
  return modifyEmail(emailId, {
    removeLabelIds: ['INBOX'],
  })
}
