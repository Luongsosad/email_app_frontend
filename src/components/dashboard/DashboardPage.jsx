import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { LayoutGrid, List, Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'
import MailList from './MailList'
import MailViewer from './MailViewer'
import SearchBar from './SearchBar'
import SummaryNotification from '../ui/SummaryNotification'
import SearchResultsView from './SearchResultsView'
import { Button } from '../ui/button'
import { useEmail } from '../../hooks/use-email'
import { useMailbox } from '../../hooks/use-mailbox'
import { useKanbanStatus } from '../../hooks/use-kanban-status'
import { useKanbanFilters } from '../../hooks/use-kanban-filters'
import { Alert, AlertDescription } from '../ui/alert'
import { useToast } from '../../hooks/use-toast'
import { emailApi } from '../../lib/api'

// Lazy load heavy components
const KanbanBoard = lazy(() => import('./KanbanBoard'))
const ComposeModal = lazy(() => import('./ComposeModal'))
const SettingsPage = lazy(() => import('./SettingsPage'))

const VIEW_MODE_STORAGE_KEY = 'email_view_mode'

export default function DashboardPage({ user, onLogout }) {
  const [selectedFolder, setSelectedFolder] = useState('INBOX')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPageToken, setCurrentPageToken] = useState('')
  const [currentSearchType, setCurrentSearchType] = useState('fuzzy') // Track current search type

  // Summary notification state
  const [summaryNotification, setSummaryNotification] = useState({
    isLoading: false,
    emailId: null,
    emailSubject: null,
  })
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
    searchEmailsSemantic,
    clearSearch,
    toggleStar,
    markAsRead,
    markAsUnread,
    moveToSpam,
    archiveEmail,
    deleteEmail,
    setEmails, // Added to allow direct state updates
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

  // Kanban filters hook (sử dụng cho cả kanban và list view)
  const {
    sortBy,
    filters,
    hasActiveFilters,
    updateSort,
    updateFilter,
    clearFilters,
    procesEmails,
  } = useKanbanFilters()

  useEffect(() => {
    fetchMailboxes()
  }, [fetchMailboxes])

  useEffect(() => {
    const fetchAllEmails = async () => {
      if (!selectedFolder) return

      if (isSearchMode) {
        return
      }

      setSearchQuery('')
      setCurrentPageToken('')

      if (viewMode === 'kanban') {
        try {
          await fetchEmails('ALL', 1, 50, '', '')

          const snoozedResult = await emailApi.getSnoozedEmails()
          if (snoozedResult.success && snoozedResult.data) {
            setEmails(prevEmails => {
              const emailMap = new Map()

              prevEmails.forEach(email => emailMap.set(email.id, email))

              snoozedResult.data.forEach(email => {
                const normalizedEmail = {
                  ...email,
                  hasAttachments: (email.attachments && email.attachments.length > 0) || email.hasAttachments === true
                }
                emailMap.set(email.id, normalizedEmail)
              })

              return Array.from(emailMap.values())
            })
          }
        } catch (error) {
          // Silently handle error
        }
      } else {
        fetchEmails(selectedFolder, 1, 20, '', '')
      }
    }

    fetchAllEmails()
  }, [selectedFolder, viewMode, isSearchMode])

  // Sync kanban statuses with backend when emails are loaded
  // Use emailIds string to prevent unnecessary re-syncs
  const emailIdsString = useMemo(() => {
    if (emails.length === 0 || viewMode !== 'kanban') return ''
    return emails.map(email => email.id).sort().join(',')
  }, [emails, viewMode])

  useEffect(() => {
    if (emailIdsString && viewMode === 'kanban') {
      const emailIds = emailIdsString.split(',').filter(id => id)
      if (emailIds.length > 0) {
        syncWithBackend(emailIds).catch(() => {})
      }
    }
  }, [emailIdsString, viewMode, syncWithBackend])

  useEffect(() => {
    const checkExpiredSnoozes = async () => {
      try {
        const result = await emailApi.checkExpiredSnoozes()
        if (result?.data?.restoredCount > 0 && result?.data?.restoredEmailIds) {
          toast({
            title: 'Snoozed emails restored',
            description: `${result.data.restoredCount} email(s) returned to Inbox`,
            duration: 5000,
          })

          setEmails(prevEmails =>
            prevEmails.map(email =>
              result.data.restoredEmailIds.includes(email.id)
                ? { ...email, snoozedUntil: null }
                : email
            )
          )

          fetchEmails(selectedFolder, pagination?.page || 1, 20, searchQuery, currentPageToken)
        }
      } catch (err) {}
    }

    checkExpiredSnoozes()

    const interval = setInterval(checkExpiredSnoozes, 30000)

    return () => clearInterval(interval)
  }, [selectedFolder, pagination?.page, searchQuery, currentPageToken])

  const unreadCounts = useMemo(() => getUnreadCounts(), [mailboxes])

  const filteredEmails = useMemo(() => {
    if (viewMode === 'kanban') {
      return emails
    }

    if (selectedFolder === 'snoozed') {
      return emails.filter(email => {
        if (email.snoozedUntil) {
          const snoozeDate = new Date(email.snoozedUntil)
          const now = new Date()
          return snoozeDate > now // Only show if actively snoozed
        }
        return false
      })
    }

    // For all other folders (INBOX, SENT, etc.), exclude actively snoozed emails
    return emails.filter(email => {
      // Check if email is actively snoozed (has future snoozedUntil date)
      if (email.snoozedUntil) {
        const snoozeDate = new Date(email.snoozedUntil)
        const now = new Date()
        return snoozeDate <= now // Only show if snooze has expired
      }
      return true // Show if not snoozed
    })
  }, [emails, selectedFolder, viewMode])

  // Apply sorting and filtering for list view only
  const processedEmailsForList = useMemo(() => {
    if (viewMode === 'kanban' || isSearchMode) {
      return filteredEmails
    }
    return procesEmails(filteredEmails)
  }, [filteredEmails, viewMode, isSearchMode, procesEmails])

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
    setCurrentSearchType('fuzzy') // Set search type

    const trimmed = query.trim()
    if (!trimmed) {
      setIsSearchMode(false)
      // Back to normal mailbox view
      fetchEmails(selectedFolder, 1, 20, '', '')
      return
    }

    // Enter search mode and force list view for clearer results
    setIsSearchMode(true)
    // If currently in kanban view, switch to list view when searching
    if (viewMode === 'kanban') {
      setViewMode('traditional')
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'traditional')
      } catch {
        // Silently handle localStorage errors
      }
    }

    // Use fuzzy search
    searchEmailsFuzzy(trimmed, 1, 20)
  }, [selectedFolder, fetchEmails, searchEmailsFuzzy, viewMode])

  const handleSemanticSearch = useCallback((query) => {
    setSearchQuery(query)
    setCurrentPageToken('')
    setCurrentSearchType('semantic') // Set search type

    const trimmed = query.trim()
    if (!trimmed) {
      setIsSearchMode(false)
      // Back to normal mailbox view
      fetchEmails(selectedFolder, 1, 20, '', '')
      return
    }

    // Enter search mode and force list view for clearer results
    setIsSearchMode(true)
    // If currently in kanban view, switch to list view when searching
    if (viewMode === 'kanban') {
      setViewMode('traditional')
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'traditional')
      } catch {
        // Silently handle localStorage errors
      }
    }

    // Use semantic search
    if (searchEmailsSemantic) {
      searchEmailsSemantic(trimmed, 1, 20)
    } else {
      // Fallback to fuzzy search if semantic not available
      searchEmailsFuzzy(trimmed, 1, 20)
    }
  }, [selectedFolder, fetchEmails, searchEmailsSemantic, searchEmailsFuzzy, viewMode])

  const handlePageChange = useCallback((page, pageToken = '') => {
    // In search mode, use the appropriate search type based on currentSearchType
    if (isSearchMode) {
      if (currentSearchType === 'semantic' && searchEmailsSemantic) {
        searchEmailsSemantic(searchQuery, page, 20)
      } else {
        // Use fuzzy search (default or fallback)
        searchEmailsFuzzy(searchQuery, page, 20)
      }
      return
    }

    setCurrentPageToken(pageToken)
    fetchEmails(selectedFolder, page, 20, searchQuery, pageToken)
  }, [isSearchMode, currentSearchType, searchQuery, selectedFolder, fetchEmails, searchEmailsFuzzy, searchEmailsSemantic])

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

  // Handle email moved in Kanban - fetch email detail if not in array
  const handleEmailMoved = useCallback(async (emailId, snoozedUntil = undefined) => {
    // If snoozedUntil is provided (from drag to Snooze), update existing email
    if (snoozedUntil !== undefined) {
      setEmails(prevEmails =>
        prevEmails.map(email =>
          email.id === emailId
            ? { ...email, snoozedUntil: snoozedUntil }
            : email
        )
      )
      return
    }

    // Otherwise, fetch email detail if not in array (original behavior)
    try {
      const result = await fetchEmailDetail(emailId)
      if (result.success && result.data) {
        // Convert email detail to email list item format
        const emailListItem = {
          id: result.data.id,
          senderName: result.data.from ? result.data.from.split('<')[0].trim() : '',
          subject: result.data.subject || '',
          preview: result.data.body ? result.data.body.substring(0, 100) : '',
          timestamp: result.data.receivedDate ? new Date(result.data.receivedDate) : new Date(),
          isStarred: result.data.isStarred || false,
          isRead: result.data.isRead !== false,
          snoozedUntil: null,
          attachments: result.data.attachments || [],
          hasAttachments: (result.data.attachments && result.data.attachments.length > 0) || result.data.hasAttachments,
        }

        // Add to emails array if not already present
        setEmails(prevEmails => {
          const exists = prevEmails.find(e => e.id === emailId)
          if (exists) {
            return prevEmails
          }
          return [...prevEmails, emailListItem]
        })
      }
    } catch (error) {
      // Silently handle error - email will be fetched on next refresh
    }
  }, [fetchEmailDetail, setEmails])

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

  // SnoozeModal handles the API call, this callback updates the local state
  const handleSnooze = useCallback(async (emailId, snoozeUntil) => {
    toast({
      title: 'Email snoozed',
      description: `Email will reappear on ${new Date(snoozeUntil).toLocaleDateString()}`,
    })
    
    // Close the email viewer
    setSelectedEmail(null)

    // Update local state immediately by adding snoozedUntil to the email
    setEmails(prevEmails =>
      prevEmails.map(email =>
        email.id === emailId
          ? { ...email, snoozedUntil: snoozeUntil }
          : email
      )
    )
  }, [toast, setEmails])

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
    const newMode = viewMode === 'traditional' ? 'kanban' : 'traditional'

    // If switching to kanban while in search mode, clear search first
    if (newMode === 'kanban' && isSearchMode) {
      handleClearSearch()
    }

    setViewMode(newMode)
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode)
    } catch {
      // Silently handle localStorage errors
    }
  }, [viewMode, isSearchMode, handleClearSearch])

  // Summary notification handlers
  const handleSummaryStart = useCallback((emailId, emailSubject) => {
    setSummaryNotification({
      isLoading: true,
      emailId,
      emailSubject,
    })
  }, [])

  const handleSummaryComplete = useCallback((emailId, summary) => {
    setSummaryNotification(prev => ({
      ...prev,
      isLoading: false,
    }))
  }, [])

  const handleSummaryNotificationClick = useCallback(async (emailId) => {
    // Dismiss notification immediately
    setSummaryNotification({
      isLoading: false,
      emailId: null,
      emailSubject: null,
    })

    // If already selected, just dismiss
    if (selectedEmail?.id === emailId) {
      return
    }

    // Try to find email in current list
    let email = emails.find(e => e.id === emailId)

    // If not found, search in INBOX
    if (!email) {
      try {
        const { fetchEmailsByMailbox } = await import('@/lib/api/email.api')
        const result = await fetchEmailsByMailbox('INBOX', 1, 100)
        if (result.success && result.data?.emails) {
          email = result.data.emails.find(e => e.id === emailId)
        }
      } catch (error) {
        // Silently handle search error
      }
    }

    // If still not found, fetch detail
    if (!email) {
      try {
        await fetchEmailDetail(emailId)
        await new Promise(resolve => setTimeout(resolve, 150))

        if (emailDetail?.id === emailId) {
          email = emailDetail
        } else {
          email = {
            id: emailId,
            subject: 'Email',
            from: '',
            timestamp: new Date(),
            isRead: true,
            isStarred: false,
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not open email',
          variant: 'destructive',
        })
        return
      }
    }

    // Select email
    if (email) {
      setSelectedEmail(email)
      fetchEmailDetail(email.id)
    }
  }, [emails, selectedEmail, emailDetail, fetchEmailDetail, toast])

  const handleDismissSummaryNotification = useCallback(() => {
    setSummaryNotification({
      isLoading: false,
      emailId: null,
      emailSubject: null,
    })
  }, [])


  return (
    <div className="flex h-screen bg-background overflow-hidden max-md:flex-col">
      {/* Error alerts */}
      {(emailError || mailboxError) && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 max-w-[calc(100%-1rem)] sm:max-w-md animate-in slide-in-from-top-5">
          <Alert variant="destructive" className="shadow-lg">
            <AlertDescription className="font-medium text-sm">
              {emailError || mailboxError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Summary notification */}
      <SummaryNotification
        isLoading={summaryNotification.isLoading}
        emailId={summaryNotification.emailId}
        emailSubject={summaryNotification.emailSubject}
        onClick={handleSummaryNotificationClick}
        onDismiss={handleDismissSummaryNotification}
        onComplete={handleDismissSummaryNotification}
      />

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

      <div className="flex-1 flex flex-col overflow-hidden max-md:min-h-0">
        {/* Header with View Toggle and Search Bar */}
        <div className="border-b border-border bg-gradient-to-r from-card/80 via-card/60 to-card/80 shadow-md">
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 h-12 sm:h-14 md:h-16">
            {/* View Toggle Button */}
            <Button
              variant={viewMode === 'traditional' ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleViewMode}
              className={`gap-1 sm:gap-2 flex-shrink-0 transition-colors duration-200 min-h-[36px] sm:min-h-[40px] ${viewMode === 'traditional'
                  ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md shadow-primary/20'
                  : 'hover:bg-muted/60'
                }`}
              title={viewMode === 'traditional' ? 'Switch to Kanban view' : 'Switch to List view'}
            >
              {viewMode === 'traditional' ? (
                <>
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">Kanban</span>
                </>
              ) : (
                <>
                  <List size={16} />
                  <span className="hidden sm:inline">List</span>
                </>
              )}
            </Button>

            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <SearchBar
                onSearch={handleSearch}
                onSemanticSearch={handleSemanticSearch}
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={emailLoading}
                initialQuery={searchQuery}
                emails={emails}
              />
            </div>

            {isSearchMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="flex-shrink-0 transition-colors duration-200 min-h-[36px] sm:min-h-[40px]"
              >
                <span className="hidden xs:inline">Clear</span>
                <span className="xs:hidden">✕</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mail content area */}
        {viewMode === 'kanban' && !isSearchMode ? (
          <div className="flex-1 flex overflow-hidden max-md:flex-col">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading Kanban board...</p>
                </div>
              </div>
            }>
              <KanbanBoard
                emails={filteredEmails}
                selectedEmail={selectedEmail}
                onSelectEmail={handleSelectEmail}
                loading={emailLoading}
                user={user}
                onRefresh={() => fetchEmails(selectedFolder, pagination?.page || 1, 20, searchQuery, currentPageToken)}
                onEmailMoved={handleEmailMoved}
              />
            </Suspense>

            {selectedEmail && (
              <MailViewer
                email={emailDetail || selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onStar={handleStarEmail}
                onSpam={handleMoveToSpam}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onSnooze={handleSnooze}
                loading={emailDetailLoading}
                onSummaryStart={handleSummaryStart}
                onSummaryComplete={handleSummaryComplete}
              />
            )}
          </div>
        ) : isSearchMode ? (
          <div className="flex-1 flex overflow-hidden max-md:flex-col">
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
                onSnooze={handleSnooze}
                loading={emailDetailLoading}
                onSummaryStart={handleSummaryStart}
                onSummaryComplete={handleSummaryComplete}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden max-md:flex-col">
            <MailList
              emails={processedEmailsForList}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onStarEmail={handleStarEmail}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onSpam={handleMoveToSpam}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              loading={emailLoading}
              sortBy={sortBy}
              onSortChange={updateSort}
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
            />

            {selectedEmail && (
              <MailViewer
                email={emailDetail || selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onStar={handleStarEmail}
                onSpam={handleMoveToSpam}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onSnooze={handleSnooze}
                loading={emailDetailLoading}
                onSummaryStart={handleSummaryStart}
                onSummaryComplete={handleSummaryComplete}
              />
            )}
          </div>
        )}
      </div>

      {showCompose && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        }>
          <ComposeModal
            user={user}
            onSend={handleSendEmail}
            onClose={() => setShowCompose(false)}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        }>
          <SettingsPage
            user={user}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

