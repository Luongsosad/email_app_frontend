import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import MailList from './MailList'
import MailViewer from './MailViewer'
import ComposeModal from './ComposeModal'
import SettingsPage from './SettingsPage'
import { useEmail } from '../../hooks/use-email'
import { useMailbox } from '../../hooks/use-mailbox'
import { Alert, AlertDescription } from '../ui/alert'

export default function DashboardPage({ user, onLogout }) {
  const [selectedFolder, setSelectedFolder] = useState('INBOX')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Use hooks for Gmail data
  const { 
    emails, 
    emailDetail,
    loading: emailLoading, 
    error: emailError,
    fetchEmails,
    fetchEmailDetail,
    toggleStar,
    markAsRead,
    moveToSpam,
    archiveEmail,
    deleteEmail,
  } = useEmail()
  
  const {
    mailboxes,
    loading: mailboxLoading,
    error: mailboxError,
    fetchMailboxes,
    getUnreadCounts,
  } = useMailbox()

  // Fetch mailboxes on mount
  useEffect(() => {
    fetchMailboxes()
  }, [fetchMailboxes])

  // Fetch emails when folder changes
  useEffect(() => {
    if (selectedFolder) {
      fetchEmails(selectedFolder)
    }
  }, [selectedFolder, fetchEmails])

  // Get unread counts from mailboxes
  const unreadCounts = getUnreadCounts()

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder)
    setSelectedEmail(null)
  }

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email)
    // Mark as read
    await markAsRead(email.id)
    // Fetch full email detail
    await fetchEmailDetail(email.id)
  }

  const handleStarEmail = async (emailId) => {
    const email = emails.find(e => e.id === emailId) || emailDetail
    if (email) {
      await toggleStar(emailId, email.isStarred)
    }
  }

  const handleMoveToSpam = async (emailId) => {
    await moveToSpam(emailId)
    setSelectedEmail(null)
    // Refresh emails
    fetchEmails(selectedFolder)
  }

  const handleDelete = async (emailId) => {
    await deleteEmail(emailId, false)
    setSelectedEmail(null)
    // Refresh emails
    fetchEmails(selectedFolder)
  }

  const handleArchive = async (emailId) => {
    await archiveEmail(emailId)
    setSelectedEmail(null)
    // Refresh emails
    fetchEmails(selectedFolder)
  }

  const handleSendEmail = async (composeData) => {
    // This will be handled by ComposeModal
    setShowCompose(false)
    // Refresh sent folder if needed
    if (selectedFolder === 'SENT') {
      fetchEmails(selectedFolder)
    }
  }


  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Error alerts */}
      {(emailError || mailboxError) && (
        <div className="absolute top-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertDescription>
              {emailError || mailboxError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Sidebar
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        unreadCounts={unreadCounts}
        user={user}
        onLogout={onLogout}
        onCompose={() => setShowCompose(true)}
        onSettings={() => setShowSettings(true)}
        mailboxes={mailboxes}
        loading={mailboxLoading}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <MailList
          emails={emails}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          onStarEmail={handleStarEmail}
          loading={emailLoading}
        />
        
        {selectedEmail && (
          <MailViewer
            email={emailDetail || selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onStar={handleStarEmail}
            onSpam={handleMoveToSpam}
            onDelete={handleDelete}
            onArchive={handleArchive}
            loading={emailLoading}
          />
        )}
      </div>

      {showCompose && (
        <ComposeModal
          user={user}
          onSend={handleSendEmail}
          onClose={() => setShowCompose(false)}
        />
      )}

      {showSettings && (
        <SettingsPage
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

