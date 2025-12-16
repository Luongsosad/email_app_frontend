import { useState, useEffect, useCallback, useMemo } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import Sidebar from './Sidebar'
import MailList from './MailList'
import MailViewer from './MailViewer'
import KanbanBoard from './KanbanBoard'
import ComposeModal from './ComposeModal'
import SettingsPage from './SettingsPage'
import SearchBar from './SearchBar'
import SearchResultsView from './SearchResultsView'
import { Button } from '../ui/button'
import { useEmail } from '../../hooks/use-email'
import { useMailbox } from '../../hooks/use-mailbox'
import { useKanbanStatus } from '../../hooks/use-kanban-status'
import { Alert, AlertDescription } from '../ui/alert'
import { useToast } from '../../hooks/use-toast'

const VIEW_MODE_STORAGE_KEY = 'email_view_mode'

export default function DashboardPage({ user, onLogout }) {
  const [selectedFolder, setSelectedFolder] = useState('INBOX')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPageToken, setCurrentPageToken] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  // View mode state: 'traditional' | 'kanban'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      return stored === 'kanban' ? 'kanban' : 'traditional'
    } catch {
      return 'traditional'
    }
  })
  
  const { toast } = useToast()
  
  // Use hooks for Gmail data
  const { 
    emails, 
    emailDetail,
    loading: emailLoading,
    loadingDetail: emailDetailLoading,
    error: emailError,
    pagination,
    fetchEmails,
    fetchEmailDetail,
    searchMode,
    searchEmailsFuzzy,
    clearSearch,
    toggleStar,
    markAsRead,
    markAsUnread,
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

  // Get userId for kanban status sync
  const userId = user?.id || user?.userId || null
  const { syncWithBackend } = useKanbanStatus(userId)

  // Fetch mailboxes on mount
  useEffect(() => {
    fetchMailboxes()
  }, [fetchMailboxes])

  // Fetch emails when folder changes
  useEffect(() => {
    if (selectedFolder) {
      setSearchQuery('')
      setCurrentPageToken('')
      fetchEmails(selectedFolder, 1, 20, '', '')
    }
  }, [selectedFolder, fetchEmails])

  // Sync kanban statuses with backend when emails are loaded
  useEffect(() => {
    if (emails.length > 0 && viewMode === 'kanban') {
      const emailIds = emails.map(email => email.id)
      syncWithBackend(emailIds).catch((error) => {
        console.error('Failed to sync kanban statuses:', error)
      })
    }
  }, [emails, viewMode, syncWithBackend])

  // Get unread counts from mailboxes
  const unreadCounts = useMemo(() => getUnreadCounts(), [mailboxes])

  const handleFolderSelect = useCallback((folder) => {
    setSelectedFolder(folder)
    setSelectedEmail(null)
    setSearchQuery('')
    setCurrentPageToken('')
    setIsSearchMode(false)
  }, [])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    setCurrentPageToken('')

    const trimmed = query.trim()
    if (!trimmed) {
      setIsSearchMode(false)
      // Back to normal mailbox view
      fetchEmails(selectedFolder, 1, 20, '', '')
      return
    }

    // Enter search mode and force list view for clearer results
    setIsSearchMode(true)
    if (viewMode === 'kanban') {
      setViewMode('traditional')
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'traditional')
      } catch (error) {
        console.error('Failed to save view mode preference:', error)
      }
    }

    searchEmailsFuzzy(trimmed, 1, 20)
  }, [selectedFolder, fetchEmails, searchEmailsFuzzy, viewMode])

  const handlePageChange = useCallback((page, pageToken = '') => {
    // In search mode, use fuzzy search pagination (no Gmail pageToken)
    if (isSearchMode) {
      searchEmailsFuzzy(searchQuery, page, 20)
      return
    }

    setCurrentPageToken(pageToken)
    fetchEmails(selectedFolder, page, 20, searchQuery, pageToken)
  }, [isSearchMode, searchQuery, selectedFolder, fetchEmails, searchEmailsFuzzy])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearchMode(false)
    setCurrentPageToken('')
    clearSearch(selectedFolder, 1, 20)
  }, [clearSearch, selectedFolder])

  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email)
    // Mark as read asynchronously without blocking UI
    markAsRead(email.id)
    // Fetch full email detail
    fetchEmailDetail(email.id)
  }, [markAsRead, fetchEmailDetail])

  const handleStarEmail = useCallback(async (emailId, isStarred) => {
    // If isStarred is not provided, find it from emails or emailDetail
    if (isStarred === undefined) {
      const email = emails.find(e => e.id === emailId) || emailDetail
      if (email) {
        isStarred = email.isStarred
      }
    }
    const result = await toggleStar(emailId, isStarred)
    
    if (result?.success) {
      toast({
        title: isStarred ? 'Star removed' : 'Star added',
        description: isStarred ? 'Email unstarred successfully' : 'Email starred successfully',
      })
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to update star status',
        variant: 'destructive',
      })
    }
  }, [emails, emailDetail, toggleStar, toast])

  const handleMoveToSpam = useCallback(async (emailId) => {
    const result = await moveToSpam(emailId)
    
    if (result?.success) {
      toast({
        title: 'Moved to spam',
        description: 'Email marked as spam successfully',
      })
      setSelectedEmail(null)
      // Refresh emails
      fetchEmails(selectedFolder, pagination?.page || 1, 20, searchQuery, currentPageToken)
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to mark email as spam',
        variant: 'destructive',
      })
    }
  }, [moveToSpam, selectedFolder, pagination, searchQuery, currentPageToken, fetchEmails, toast])

  const handleDelete = useCallback(async (emailId) => {
    const result = await deleteEmail(emailId, false)
    
    if (result?.success) {
      toast({
        title: 'Email deleted',
        description: 'Email moved to trash successfully',
      })
      setSelectedEmail(null)
      // Refresh emails
      fetchEmails(selectedFolder, pagination?.page || 1, 20, searchQuery, currentPageToken)
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to delete email',
        variant: 'destructive',
      })
    }
  }, [deleteEmail, selectedFolder, pagination, searchQuery, currentPageToken, fetchEmails, toast])

  const handleArchive = useCallback(async (emailId) => {
    const result = await archiveEmail(emailId)
    
    if (result?.success) {
      toast({
        title: 'Email archived',
        description: 'Email archived successfully',
      })
      setSelectedEmail(null)
      // Refresh emails
      fetchEmails(selectedFolder, pagination?.page || 1, 20, searchQuery, currentPageToken)
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to archive email',
        variant: 'destructive',
      })
    }
  }, [archiveEmail, selectedFolder, pagination, searchQuery, currentPageToken, fetchEmails, toast])

  const handleMarkAsRead = useCallback(async (emailId) => {
    const result = await markAsRead(emailId)
    
    if (result?.success) {
      toast({
        title: 'Marked as read',
        description: 'Email marked as read',
      })
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to mark as read',
        variant: 'destructive',
      })
    }
  }, [markAsRead, toast])

  const handleMarkAsUnread = useCallback(async (emailId) => {
    const result = await markAsUnread(emailId)
    
    if (result?.success) {
      toast({
        title: 'Marked as unread',
        description: 'Email marked as unread',
      })
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to mark as unread',
        variant: 'destructive',
      })
    }
  }, [markAsUnread, toast])

  const handleSendEmail = useCallback(async (composeData) => {
    setShowCompose(false)
    
    // Show success toast
    toast({
      title: 'Email sent',
      description: `Email sent successfully to ${composeData.to.join(', ')}`,
    })
    
    // Refresh sent folder if currently viewing it
    if (selectedFolder === 'SENT') {
      setTimeout(() => {
        fetchEmails(selectedFolder, 1, 20, '', '')
      }, 1000) // Small delay to allow email to appear in sent folder
    }
  }, [selectedFolder, fetchEmails, toast])

  const handleToggleViewMode = useCallback(() => {
    // When in search mode, keep list view to avoid confusing UX
    if (isSearchMode) {
      return
    }
    const newMode = viewMode === 'traditional' ? 'kanban' : 'traditional'
    setViewMode(newMode)
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode)
    } catch (error) {
      console.error('Failed to save view mode preference:', error)
    }
  }, [viewMode])


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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with View Toggle and Search Bar */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center gap-4 px-4 h-16">
            {/* View Toggle Button */}
            <Button
              variant={viewMode === 'traditional' ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleViewMode}
              className="gap-2 flex-shrink-0"
              title={viewMode === 'traditional' ? 'Switch to Kanban view' : 'Switch to List view'}
            >
              {viewMode === 'traditional' ? (
                <>
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">Kanban View</span>
                </>
              ) : (
                <>
                  <List size={16} />
                  <span className="hidden sm:inline">List View</span>
                </>
              )}
            </Button>

            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <SearchBar
                onSearch={handleSearch}
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={emailLoading}
                initialQuery={searchQuery}
              />
            </div>

            {isSearchMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="flex-shrink-0"
              >
                Clear search
              </Button>
            )}
          </div>
        </div>
        
        {/* Mail content area */}
        {viewMode === 'kanban' && !isSearchMode ? (
          <div className="flex-1 flex overflow-hidden">
            <KanbanBoard
              emails={emails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              loading={emailLoading}
              user={user}
            />
            
            {selectedEmail && (
              <MailViewer
                email={emailDetail || selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onStar={handleStarEmail}
                onSpam={handleMoveToSpam}
                onDelete={handleDelete}
                onArchive={handleArchive}
                loading={emailDetailLoading}
              />
            )}
          </div>
        ) : isSearchMode ? (
          <div className="flex-1 flex overflow-hidden">
            <SearchResultsView
              emails={emails}
              loading={emailLoading}
              error={emailError}
              searchQuery={searchQuery}
              pagination={pagination}
              onPageChange={handlePageChange}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onBack={handleClearSearch}
            />

            {selectedEmail && (
              <MailViewer
                email={emailDetail || selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onStar={handleStarEmail}
                onSpam={handleMoveToSpam}
                onDelete={handleDelete}
                onArchive={handleArchive}
                loading={emailDetailLoading}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <MailList
              emails={emails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onStarEmail={handleStarEmail}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onSpam={handleMoveToSpam}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
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
                loading={emailDetailLoading}
              />
            )}
          </div>
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

