import { memo, useRef, useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import SearchSuggestions from './SearchSuggestions'
import { useSearchSuggestions } from '../../hooks/use-search-suggestions'

function SearchBar({
  onSearch,
  onSemanticSearch,
  pagination,
  onPageChange,
  loading,
  initialQuery = '',
  emails = [],
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const { suggestions, saveRecentSearch } = useSearchSuggestions(emails, searchQuery)

  // Sync internal state when initialQuery changes (e.g., clear search from parent)
  useEffect(() => {
    setSearchQuery(initialQuery || '')
  }, [initialQuery])

  // Show suggestions when query changes and has suggestions
  useEffect(() => {
    if (searchQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }, [searchQuery, suggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      // If no suggestions, handle Enter to trigger search
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault()
        handleSemanticSearch(searchQuery)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex].text)
        } else if (searchQuery.trim()) {
          handleSemanticSearch(searchQuery)
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      default:
        break
    }
  }

  const handleSuggestionSelect = (suggestionText) => {
    setSearchQuery(suggestionText)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    saveRecentSearch(suggestionText)
    handleSemanticSearch(suggestionText)
  }

  const handleSemanticSearch = (query) => {
    // Close suggestions after search
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    if (onSemanticSearch && query.trim()) {
      onSemanticSearch(query.trim())
    } else if (onSearch) {
      // Fallback to regular search if semantic search not available
      onSearch(query.trim())
    }
  }

  const handleSearchButtonClick = () => {
    if (searchQuery.trim()) {
      handleSemanticSearch(searchQuery)
    }
  }

  const handleBlur = () => {
    // Only close suggestions on blur, don't trigger search
    // Use setTimeout to allow click events on suggestions to fire first
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

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
          <div ref={containerRef} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim() && suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={handleBlur}
                aria-label="Search emails"
                aria-expanded={showSuggestions}
                aria-haspopup="listbox"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background/80 backdrop-blur-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/20"
              />
              <SearchSuggestions
                suggestions={suggestions}
                isVisible={showSuggestions}
                query={searchQuery}
                selectedIndex={selectedIndex}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
            <button
              onClick={handleSearchButtonClick}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover-glow"
              title="Search"
            >
              <Search size={16} />
              <span className="hidden sm:inline font-semibold">Search</span>
            </button>
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
