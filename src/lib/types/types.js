// Type definitions for the email application

export const EMAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'spam', 'trash', 'archive']

// JSDoc type definitions
/**
 * @typedef {'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive'} EmailFolder
 */

/**
 * @typedef {Object} User
 * @property {string} [id]
 * @property {string} email
 * @property {string} name
 * @property {string} [password]
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} name
 * @property {number} size
 * @property {string} type
 * @property {string} url
 */

/**
 * @typedef {Object} Email
 * @property {string} id
 * @property {string} from
 * @property {string} fromName
 * @property {string[]} to
 * @property {string[]} cc
 * @property {string[]} bcc
 * @property {string} subject
 * @property {string} body
 * @property {string} htmlBody
 * @property {EmailAttachment[]} attachments
 * @property {Date} timestamp
 * @property {boolean} isRead
 * @property {boolean} isStarred
 * @property {boolean} isSpam
 * @property {EmailFolder} folder
 * @property {string} [replyTo]
 * @property {string} [inReplyTo]
 * @property {string} threadId
 */

/**
 * @typedef {Object} EmailThread
 * @property {string} id
 * @property {string} subject
 * @property {User[]} participants
 * @property {Email} lastMessage
 * @property {number} messageCount
 * @property {boolean} isRead
 */

/**
 * @typedef {Object} ComposeData
 * @property {string[]} to
 * @property {string[]} cc
 * @property {string[]} bcc
 * @property {string} subject
 * @property {string} body
 * @property {string} htmlBody
 * @property {EmailAttachment[]} attachments
 */

/**
 * @typedef {Object} AuthState
 * @property {User | null} user
 * @property {boolean} isLoading
 * @property {string | null} error
 */
