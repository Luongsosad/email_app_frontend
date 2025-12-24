import { apiCall } from "./api-helper";
import { API_ENDPOINTS } from "./api-config";

/**
 * Fetch emails by mailbox (folder)
 * @param {string} mailboxId - The mailbox ID (e.g., 'INBOX', 'SENT')
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of emails per page (default: 20)
 * @param {string} search - Search query (optional)
 * @param {string} pageToken - Page token for pagination (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchEmailsByMailbox = async (
  mailboxId,
  page = 1,
  pageSize = 20,
  search = "",
  pageToken = ""
) => {
  try {
    let endpoint = `${API_ENDPOINTS.EMAILS.LIST(
      mailboxId
    )}?page=${page}&pageSize=${pageSize}`;
    if (search && search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`;
    }
    if (pageToken) {
      endpoint += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching emails:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email detail by ID
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const fetchEmailDetail = async (emailId) => {
  try {
    return await apiCall(API_ENDPOINTS.EMAILS.GET(emailId));
  } catch (error) {
    console.error("Error fetching email detail:", error);
    return { success: false, error: error.message };
  }
};

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
      method: "POST",
      body: JSON.stringify(emailData),
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

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
      method: "POST",
      body: JSON.stringify(replyData),
    });
  } catch (error) {
    console.error("Error replying to email:", error);
    return { success: false, error: error.message };
  }
};

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
      method: "POST",
      body: JSON.stringify(modifyData),
    });
  } catch (error) {
    console.error("Error modifying email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an email (move to trash or permanently delete)
 * @param {string} emailId - The email ID
 * @param {boolean} permanent - Whether to permanently delete (default: false)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteEmail = async (emailId, permanent = false) => {
  try {
    return await apiCall(`/emails/${emailId}/delete?permanent=${permanent}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error deleting email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark email as read
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const markAsRead = async (emailId) => {
  try {
    return await apiCall(`/emails/${emailId}/read`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error marking email as read:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark email as unread
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const markAsUnread = async (emailId) => {
  try {
    return await apiCall(`/emails/${emailId}/unread`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error marking email as unread:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Star/unstar an email
 * @param {string} emailId - The email ID
 * @param {boolean} starred - Whether to star or unstar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const toggleStar = async (emailId, starred) => {
  return modifyEmail(emailId, {
    addLabelIds: starred ? ["STARRED"] : [],
    removeLabelIds: starred ? [] : ["STARRED"],
  });
};

/**
 * Move email to spam
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const moveToSpam = async (emailId) => {
  return modifyEmail(emailId, {
    addLabelIds: ["SPAM"],
    removeLabelIds: ["INBOX"],
  });
};

/**
 * Archive an email
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const archiveEmail = async (emailId) => {
  return modifyEmail(emailId, {
    removeLabelIds: ["INBOX"],
  });
};

/**
 * Snooze an email until a specific time
 * @param {string} emailId - The email ID
 * @param {Date|string} snoozeUntil - ISO 8601 date string or Date object
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const snoozeEmail = async (emailId, snoozeUntil) => {
  try {
    console.log(
      "[snoozeEmail] Snoozing email:",
      emailId,
      "until:",
      snoozeUntil
    );
    const snoozeDate =
      typeof snoozeUntil === "string" ? snoozeUntil : snoozeUntil.toISOString();
    const result = await apiCall(`/emails/${emailId}/snooze`, {
      method: "POST",
      body: JSON.stringify({ snoozeUntil: snoozeDate }),
    });
    console.log("[snoozeEmail] Result:", result);
    return result;
  } catch (error) {
    console.error("Error snoozing email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsnooze an email (return to inbox)
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const unsnoozeEmail = async (emailId) => {
  try {
    return await apiCall(`/emails/${emailId}/unsnooze`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error unsnoozing email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all snoozed emails
 * @returns {Promise<{success: boolean, data?: {emailIds: string[], total: number}, error?: string}>}
 */
export const getSnoozedEmails = async () => {
  try {
    console.log("[getSnoozedEmails] Fetching snoozed emails...");
    const result = await apiCall("/emails/snoozed");
    console.log("[getSnoozedEmails] Result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching snoozed emails:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check and restore expired snoozed emails
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const checkExpiredSnoozes = async () => {
  try {
    return await apiCall("/emails/check-expired-snoozes", {
      method: "POST",
    });
  } catch (error) {
    console.error("Error checking expired snoozes:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate or retrieve summary for an email
 * @param {string} emailId - The email ID
 * @param {boolean} force - Force regenerate summary even if one exists
 * @returns {Promise<{success: boolean, data?: {summary: string, summarizedAt: Date, cached: boolean}, error?: string}>}
 */
export const summarizeEmail = async (emailId, force = false) => {
  try {
    return await apiCall(`/emails/${emailId}/summarize?force=${force}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error summarizing email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get existing summary for an email
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: {summary: string, summarizedAt: Date}, error?: string}>}
 */
export const getEmailSummary = async (emailId) => {
  try {
    return await apiCall(`/emails/${emailId}/summary`);
  } catch (error) {
    console.error("Error getting email summary:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fuzzy search emails (subject, sender, snippet) via backend search endpoint
 * @param {string} query - Search query (supports typos and partial matches)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of emails per page (default: 20)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const searchEmailsFuzzy = async (query, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (query && query.trim()) {
      params.append("q", query.trim());
    }
    params.append("page", String(page));
    params.append("limit", String(limit));

    const endpoint = `${API_ENDPOINTS.EMAILS.SEARCH}?${params.toString()}`;
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error searching emails (fuzzy):", error);
    return { success: false, error: error.message };
  }
};

/**
 * Semantic search emails using vector embeddings
 * @param {string} query - Search query text
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of emails per page (default: 20)
 * @param {Object} filters - Optional filters
 * @param {boolean} filters.unreadOnly - Filter unread emails only
 * @param {string} filters.sender - Filter by sender email or name
 * @param {string} filters.status - Filter by email status (inbox, todo, in-progress, done, snoozed)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const searchEmailsSemantic = async (query, page = 1, limit = 20, filters = {}) => {
  try {
    if (!query || !query.trim()) {
      return { success: false, error: 'Query is required' };
    }

    const requestBody = {
      query: query.trim(),
      page,
      limit,
      ...(filters.unreadOnly !== undefined && { unreadOnly: filters.unreadOnly }),
      ...(filters.sender && { sender: filters.sender }),
      ...(filters.status && { status: filters.status }),
    };

    return await apiCall(API_ENDPOINTS.SEARCH.SEMANTIC, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("Error searching emails (semantic):", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email kanban status
 * @param {string} emailId - The email ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getEmailStatus = async (emailId) => {
  try {
    return await apiCall(API_ENDPOINTS.EMAILS.STATUS(emailId));
  } catch (error) {
    console.error("Error fetching email status:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update email kanban status
 * @param {string} emailId - The email ID
 * @param {string} status - The kanban status ('inbox' | 'todo' | 'in-progress' | 'done' | 'snoozed')
 * @param {string|null} gmailLabelId - Gmail label ID to sync (optional)
 * @param {string|null} oldGmailLabelId - Previous Gmail label ID to remove (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateEmailStatus = async (emailId, status, gmailLabelId = null, oldGmailLabelId = null) => {
  try {
    const body = { status };
    if (gmailLabelId) {
      body.gmailLabelId = gmailLabelId;
    }
    if (oldGmailLabelId) {
      body.oldGmailLabelId = oldGmailLabelId;
    }
    console.log(`[updateEmailStatus] Calling API:`, {
      endpoint: API_ENDPOINTS.EMAILS.STATUS(emailId),
      method: 'PUT',
      body
    });
    const result = await apiCall(API_ENDPOINTS.EMAILS.STATUS(emailId), {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    console.log(`[updateEmailStatus] API result:`, result);
    return result;
  } catch (error) {
    console.error("Error updating email status:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get kanban statuses for multiple emails
 * @param {string[]} emailIds - Array of email IDs
 * @returns {Promise<{success: boolean, data?: Object[], error?: string}>}
 */
export const getBulkEmailStatuses = async (emailIds) => {
  try {
    return await apiCall(API_ENDPOINTS.EMAILS.BULK_STATUS, {
      method: "POST",
      body: JSON.stringify({ emailIds }),
    });
  } catch (error) {
    console.error("Error fetching bulk email statuses:", error);
    return { success: false, error: error.message };
  }
};
