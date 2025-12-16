import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { stripHtmlTags } from '@/lib/utils/utils'

export default function SearchResultsView({
  emails = [],
  loading = false,
  error = null,
  searchQuery = '',
  pagination,
  onPageChange,
  selectedEmail,
  onSelectEmail,
  onBack,
}) {
  const hasResults = emails && emails.length > 0

  const handleViewEmail = (email) => {
    if (onSelectEmail) {
      onSelectEmail(email)
    }
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const currentPage = pagination ? pagination.page : 1

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">
              Search results for
              {' '}
              <span className="font-semibold">&quot;{searchQuery}&quot;</span>
            </h2>
            {pagination && (
              <p className="text-xs text-muted-foreground">
                {pagination.total} result{pagination.total === 1 ? '' : 's'} found
              </p>
            )}
          </div>

          {pagination && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Page
                {' '}
                {currentPage}
                {' '}
                of
                {' '}
                {totalPages}
              </span>
              {onPageChange && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* States: loading, error, empty, results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Searching emails...</span>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Search failed:
                  {' '}
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!loading && !error && !hasResults && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-sm">
                No results found for
                {' '}
                <span className="font-semibold">&quot;{searchQuery}&quot;</span>
                .
              </p>
              <p className="text-xs">
                Try a different keyword or clear the search to return to your inbox.
              </p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <div className="divide-y divide-border">
              {emails.map((email) => (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => handleViewEmail(email)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted transition flex flex-col gap-1 ${
                    selectedEmail && selectedEmail.id === email.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {email.senderName || 'Unknown sender'}
                      </span>
                      {!email.isRead && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Unread
                        </span>
                      )}
                    </div>
                    {email.timestamp && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(email.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {email.subject || '(No subject)'}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {stripHtmlTags(email.preview || email.snippet || '')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side MailViewer is handled by parent; this component only controls list + header */}
      {onBack && (
        <div className="hidden">
          {/* onBack is used by parent via Clear search button; kept here only to satisfy props */}
        </div>
      )}
    </div>
  )
}


