import { useState, useEffect, useCallback } from "react";
import { getBulkEmailStatuses, updateEmailStatus } from "../lib/api/email.api";

const STORAGE_KEY_PREFIX = "kanban_email_status";


const STATUS_NAME_TO_COLUMN_ID = {
  'Inbox': 'inbox',
  'To Do': 'todo',
  'In Progress': 'in-progress',
  'Done': 'done',
  'Snoozed': 'snoozed',

  'inbox': 'inbox',
  'todo': 'todo',
  'in-progress': 'in-progress',
  'done': 'done',
  'snoozed': 'snoozed',
};

/**
 * Convert backend status name to frontend column ID
 */
function mapStatusToColumnId(status) {
  if (!status) return 'inbox';
  

  if (STATUS_NAME_TO_COLUMN_ID[status]) {
    return STATUS_NAME_TO_COLUMN_ID[status];
  }
  

  if (typeof status === 'number' || !isNaN(parseInt(status))) {
    return status;
  }
  

  const normalized = status.toLowerCase().replace(/\s+/g, '-');
  if (STATUS_NAME_TO_COLUMN_ID[normalized]) {
    return STATUS_NAME_TO_COLUMN_ID[normalized];
  }
  

  console.warn(`Unknown status "${status}", defaulting to inbox`);
  return 'inbox';
}

/**
 * Hook to manage email-to-column mapping for Kanban board
 * Stores status in localStorage per user
 */
export function useKanbanStatus(userId = null) {
  const [statusMap, setStatusMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStorageKey = useCallback(() => {
    if (userId) {
      return `${STORAGE_KEY_PREFIX}_${userId}`;
    }
    return STORAGE_KEY_PREFIX;
  }, [userId]);

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
   * @param {Array} availableColumns - Array of available column configs (optional, for custom columns)
   * @returns {Object} Object with column IDs as keys and email arrays as values
   */
  const getEmailsByColumn = useCallback(
    (emails, availableColumns = null, currentStatusMap = null) => {
      const statusMapToUse = currentStatusMap || statusMap;
      const columns = {};

      if (availableColumns && Array.isArray(availableColumns)) {
        availableColumns.forEach((col) => {
          columns[col.id] = [];
        });
      } else {
        columns.inbox = [];
        columns.todo = [];
        columns["in-progress"] = [];
        columns.done = [];
        columns.snoozed = [];
      }

      emails.forEach((email) => {
        if (email.snoozedUntil) {
          const snoozeDate = new Date(email.snoozedUntil);
          const now = new Date();
          if (snoozeDate > now) {
            if (columns["snoozed"]) {
              columns["snoozed"].push(email);
            } else if (columns.snoozed) {
              columns.snoozed.push(email);
            } else if (columns.inbox) {
              columns.inbox.push(email);
            }
            return;
          }
        }

        const columnId = statusMapToUse[email.id] || "inbox";

        if (columns[columnId]) {
          columns[columnId].push(email);
        } else {
          if (columns.inbox) {
            columns.inbox.push(email);
          } else if (availableColumns && availableColumns.length > 0) {
            columns[availableColumns[0].id].push(email);
          }
        }
      });

      return columns;
    },
    [statusMap]
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
          const backendStatusMap = {};
          response.data.forEach((status) => {
            backendStatusMap[status.emailId] = mapStatusToColumnId(status.status);
          });

          setStatusMap((currentStatusMap) => {
            const mergedMap = {
              ...currentStatusMap,
              ...backendStatusMap,
            };

            try {
              const key = getStorageKey();
              localStorage.setItem(key, JSON.stringify(mergedMap));
            } catch (error) {
              console.error("Failed to save synced statuses:", error);
            }

            return mergedMap;
          });

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
    [getStorageKey]
  );

  /**
   * Update email status on backend and locally
   * Implements optimistic update pattern
   * @param {string} emailId - The email ID
   * @param {string} columnId - The column ID
   * @param {string|null} gmailLabelId - Gmail label ID to sync (optional)
   * @param {string|null} oldGmailLabelId - Previous Gmail label ID to remove (optional)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateStatusOnBackend = useCallback(
    async (emailId, columnId, gmailLabelId = null, oldGmailLabelId = null) => {
      setStatusMap((currentStatusMap) => {
        const previousStatus = currentStatusMap[emailId] || "inbox";
        const optimisticMap = {
          ...currentStatusMap,
          [emailId]: columnId,
        };

        try {
          const key = getStorageKey();
          localStorage.setItem(key, JSON.stringify(optimisticMap));
        } catch (error) {
          console.error("Failed to save optimistic update:", error);
        }

        return optimisticMap;
      });

      const previousStatus = statusMap[emailId] || "inbox";

      try {
        const response = await updateEmailStatus(
          emailId,
          columnId,
          gmailLabelId,
          oldGmailLabelId
        );
        if (response.success) {
          return { success: true };
        } else {
          setStatusMap((currentStatusMap) => {
            const revertedMap = {
              ...currentStatusMap,
              [emailId]: previousStatus,
            };
            try {
              const key = getStorageKey();
              localStorage.setItem(key, JSON.stringify(revertedMap));
            } catch (error) {
              console.error("Failed to revert status:", error);
            }
            return revertedMap;
          });
          return {
            success: false,
            error: response.error || "Failed to update status",
          };
        }
      } catch (error) {
        setStatusMap((currentStatusMap) => {
          const revertedMap = {
            ...currentStatusMap,
            [emailId]: previousStatus,
          };
          try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(revertedMap));
          } catch (err) {
            console.error("Failed to revert status:", err);
          }
          return revertedMap;
        });
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
