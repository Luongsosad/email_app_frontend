import { useState, useEffect, useCallback } from "react";
import { getBulkEmailStatuses, updateEmailStatus } from "../lib/api/email.api";

const STORAGE_KEY_PREFIX = "kanban_email_status";

/**
 * Hook to manage email-to-column mapping for Kanban board
 * Stores status in localStorage per user
 */
export function useKanbanStatus(userId = null) {
  const [statusMap, setStatusMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get storage key based on userId
  const getStorageKey = useCallback(() => {
    if (userId) {
      return `${STORAGE_KEY_PREFIX}_${userId}`;
    }
    return STORAGE_KEY_PREFIX;
  }, [userId]);

  // Load statuses from localStorage
  useEffect(() => {
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStatusMap(parsed);
      }
    } catch (error) {
      console.error("Failed to load kanban statuses:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [getStorageKey]);

  // Save statuses to localStorage
  const saveStatuses = useCallback(
    (newStatusMap) => {
      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(newStatusMap));
        setStatusMap(newStatusMap);
      } catch (error) {
        console.error("Failed to save kanban statuses:", error);
      }
    },
    [getStorageKey]
  );

  /**
   * Get the column status for an email
   * @param {string} emailId - The email ID
   * @returns {string} Column ID (default: 'inbox')
   */
  const getEmailStatus = useCallback(
    (emailId) => {
      return statusMap[emailId] || "inbox";
    },
    [statusMap]
  );

  /**
   * Set the column status for an email
   * @param {string} emailId - The email ID
   * @param {string} columnId - The column ID ('inbox' | 'todo' | 'in-progress' | 'done' | 'snoozed')
   */
  const setEmailStatus = useCallback(
    (emailId, columnId) => {
      const newStatusMap = {
        ...statusMap,
        [emailId]: columnId,
      };
      saveStatuses(newStatusMap);
    },
    [statusMap, saveStatuses]
  );

  /**
   * Organize emails array into columns
   * @param {Array} emails - Array of email objects
   * @returns {Object} Object with column IDs as keys and email arrays as values
   */
  const getEmailsByColumn = useCallback(
    (emails) => {
      const columns = {
        inbox: [],
        todo: [],
        "in-progress": [],
        done: [],
        snoozed: [],
      };

      emails.forEach((email) => {
        const columnId = getEmailStatus(email.id);
        if (columns[columnId]) {
          columns[columnId].push(email);
        } else {
          // Default to inbox if column doesn't exist
          columns["inbox"].push(email);
        }
      });

      return columns;
    },
    [getEmailStatus]
  );

  /**
   * Reset all statuses (clear localStorage)
   */
  const resetStatuses = useCallback(() => {
    const emptyMap = {};
    saveStatuses(emptyMap);
  }, [saveStatuses]);

  /**
   * Bulk update statuses (useful for initialization)
   * @param {Object} newStatusMap - Object mapping email IDs to column IDs
   */
  const bulkUpdateStatuses = useCallback(
    (newStatusMap) => {
      saveStatuses(newStatusMap);
    },
    [saveStatuses]
  );

  /**
   * Sync statuses from backend for a list of email IDs
   * @param {string[]} emailIds - Array of email IDs to sync
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const syncWithBackend = useCallback(
    async (emailIds) => {
      if (!emailIds || emailIds.length === 0) {
        return { success: true };
      }

      setIsSyncing(true);
      try {
        const response = await getBulkEmailStatuses(emailIds);
        if (response.success && response.data) {
          // Convert array to map
          const backendStatusMap = {};
          response.data.forEach((status) => {
            backendStatusMap[status.emailId] = status.status;
          });

          // Merge with existing statuses (backend takes precedence)
          const mergedMap = {
            ...statusMap,
            ...backendStatusMap,
          };
          saveStatuses(mergedMap);
          return { success: true };
        } else {
          return {
            success: false,
            error: response.error || "Failed to sync statuses",
          };
        }
      } catch (error) {
        console.error("Error syncing statuses from backend:", error);
        return { success: false, error: error.message };
      } finally {
        setIsSyncing(false);
      }
    },
    [statusMap, saveStatuses]
  );

  /**
   * Update email status on backend and locally
   * Implements optimistic update pattern
   * @param {string} emailId - The email ID
   * @param {string} columnId - The column ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateStatusOnBackend = useCallback(
    async (emailId, columnId) => {
      // Optimistic update: update UI immediately
      const previousStatus = statusMap[emailId] || "inbox";
      const optimisticMap = {
        ...statusMap,
        [emailId]: columnId,
      };
      setStatusMap(optimisticMap);

      // Try to save optimistically to localStorage
      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(optimisticMap));
      } catch (error) {
        console.error("Failed to save optimistic update:", error);
      }

      try {
        const response = await updateEmailStatus(emailId, columnId);
        if (response.success) {
          // Backend update successful, ensure localStorage is synced
          const key = getStorageKey();
          localStorage.setItem(key, JSON.stringify(optimisticMap));
          return { success: true };
        } else {
          // Backend update failed, revert optimistic update
          const revertedMap = {
            ...optimisticMap,
            [emailId]: previousStatus,
          };
          setStatusMap(revertedMap);
          try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(revertedMap));
          } catch (error) {
            console.error("Failed to revert status:", error);
          }
          return {
            success: false,
            error: response.error || "Failed to update status",
          };
        }
      } catch (error) {
        // Network error, revert optimistic update
        const revertedMap = {
          ...optimisticMap,
          [emailId]: previousStatus,
        };
        setStatusMap(revertedMap);
        try {
          const key = getStorageKey();
          localStorage.setItem(key, JSON.stringify(revertedMap));
        } catch (err) {
          console.error("Failed to revert status:", err);
        }
        return { success: false, error: error.message || "Network error" };
      }
    },
    [statusMap, getStorageKey]
  );

  return {
    statusMap,
    isLoaded,
    isSyncing,
    getEmailStatus,
    setEmailStatus,
    getEmailsByColumn,
    resetStatuses,
    bulkUpdateStatuses,
    syncWithBackend,
    updateStatusOnBackend,
  };
}
