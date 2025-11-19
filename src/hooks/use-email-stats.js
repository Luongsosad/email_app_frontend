import { useMemo } from 'react'

export function useEmailStats(emails) {
  const stats = useMemo(() => {
    return {
      totalEmails: emails.length,
      unreadEmails: emails.filter(e => !e.isRead).length,
      starredEmails: emails.filter(e => e.isStarred).length,
      spamEmails: emails.filter(e => e.folder === 'spam').length,
      trashedEmails: emails.filter(e => e.folder === 'trash').length,
      draftEmails: emails.filter(e => e.folder === 'drafts').length,
      sentEmails: emails.filter(e => e.folder === 'sent').length,
      archivedEmails: emails.filter(e => e.folder === 'archive').length,
      todayEmails: emails.filter(e => {
        const emailDate = new Date(e.timestamp)
        const today = new Date()
        return (
          emailDate.getDate() === today.getDate() &&
          emailDate.getMonth() === today.getMonth() &&
          emailDate.getFullYear() === today.getFullYear()
        )
      }).length,
    }
  }, [emails])

  return stats
}
