import { memo } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

function SearchBar({ 
  onSearch, 
  pagination, 
  onPageChange, 
  loading 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTimeout, setSearchTimeout] = useState(null)

  // Debounce search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    }, 500)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [searchQuery])

  const handlePreviousPage = () => {
    if (pagination && pagination.page > 1 && onPageChange) {
      onPageChange(pagination.page - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && pagination.nextPageToken && onPageChange) {
      onPageChange(pagination.page + 1, pagination.nextPageToken)
    }
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const currentPage = pagination ? pagination.page : 1

  return (
    <div className="h-full">
      {/* Search and Pagination Row */}
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[360px] pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-3">
          {pagination && (
            <>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  `${((currentPage - 1) * pagination.pageSize) + 1}-${Math.min(currentPage * pagination.pageSize, pagination.total)} of ${pagination.total}`
                )}
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.nextPageToken || loading}
                  className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchBar)
