import { apiCall } from './api-helper'
import { API_ENDPOINTS } from './api-config'

/**
 * Fetch all mailboxes (folders) for the current user
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchMailboxes = async () => {
  try {
    return await apiCall(API_ENDPOINTS.MAILBOXES.LIST)
  } catch (error) {
    console.error('Error fetching mailboxes:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get mailbox by ID
 * @param {string} mailboxId - The mailbox ID (e.g., 'INBOX', 'SENT', 'DRAFT')
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchMailbox = async (mailboxId) => {
  try {
    return await apiCall(API_ENDPOINTS.MAILBOXES.GET(mailboxId))
  } catch (error) {
    console.error('Error fetching mailbox:', error)
    return { success: false, error: error.message }
  }
}
