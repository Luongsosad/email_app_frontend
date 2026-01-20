import { apiCall } from './api-helper'
import { API_ENDPOINTS } from './api-config'

/**
 * Fetch all kanban columns for the current user
 * @returns {Promise<{success: boolean, data?: {columns: Array}, error?: string}>}
 */
export const fetchKanbanColumns = async () => {
  try {
    return await apiCall(API_ENDPOINTS.KANBAN.COLUMNS)
  } catch (error) {
    console.error('Error fetching kanban columns:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create a new kanban column
 * NOTE: Currently we only persist name & order in DB.
 * Gmail label mapping is handled on the frontend side.
 *
 * @param {{ name: string, order?: number }} payload
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createKanbanColumn = async (payload) => {
  try {
    return await apiCall(API_ENDPOINTS.KANBAN.COLUMNS, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Error creating kanban column:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing kanban column
 *
 * @param {number|string} columnId
 * @param {{ name?: string, order?: number }} payload
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateKanbanColumn = async (columnId, payload) => {
  try {
    return await apiCall(API_ENDPOINTS.KANBAN.COLUMN(columnId), {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Error updating kanban column:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a kanban column
 *
 * @param {number|string} columnId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteKanbanColumn = async (columnId) => {
  try {
    return await apiCall(API_ENDPOINTS.KANBAN.COLUMN(columnId), {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting kanban column:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reorder kanban columns
 *
 * @param {Array<number|string>} columnIds - IDs in desired order
 * @returns {Promise<{success: boolean, data?: {columns: Array}, error?: string}>}
 */
export const reorderKanbanColumns = async (columnIds) => {
  try {
    return await apiCall(API_ENDPOINTS.KANBAN.REORDER, {
      method: 'POST',
      body: JSON.stringify({ columnIds: columnIds.map((id) => Number(id)) }),
    })
  } catch (error) {
    console.error('Error reordering kanban columns:', error)
    return { success: false, error: error.message }
  }
}

