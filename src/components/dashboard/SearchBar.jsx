import { memo, useRef, useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
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
  const [searchType, setSearchType] = useState('fuzzy') // 'fuzzy' or 'semantic'
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
    if (!showSuggestions) return

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    // Use capture phase for better performance
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [showSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      // If no suggestions, handle Enter to trigger search
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault()
        handleSearchExecution(searchQuery)
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
          handleSearchExecution(searchQuery)
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
    handleSearchExecution(suggestionText)
  }

  const handleSearchExecution = (query) => {
    // Close suggestions after search
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    // Execute search based on selected type
    if (searchType === 'semantic' && onSemanticSearch) {
      onSemanticSearch(trimmedQuery)
    } else if (onSearch) {
      // Use fuzzy search (default)
      onSearch(trimmedQuery)
    }
  }

  const handleSearchButtonClick = () => {
    if (searchQuery.trim()) {
      handleSearchExecution(searchQuery)
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
            {/* Search Type Toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
              <button
                onClick={() => setSearchType('fuzzy')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  searchType === 'fuzzy'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Fuzzy search - Fast keyword matching with typo tolerance"
              >
                <Search size={14} />
                Fuzzy
              </button>
              <button
                onClick={() => setSearchType('semantic')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  searchType === 'semantic'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Semantic search - AI-powered contextual understanding"
              >
                <Sparkles size={14} />
                AI
              </button>
            </div>
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
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background/95 transition-colors duration-200 focus:bg-background focus:shadow-md focus:shadow-primary/20"
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
              className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 active:scale-95 flex items-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
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
