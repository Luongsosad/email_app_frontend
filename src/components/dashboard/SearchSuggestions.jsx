import { useEffect, useRef } from 'react'
import { User, Hash, Clock } from 'lucide-react'

function SearchSuggestions({
  suggestions = [],
  isVisible = false,
  query = '',
  selectedIndex = -1,
  onSelect,
  onClose,
}) {
  const listRef = useRef(null)
  const itemRefs = useRef([])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex] && listRef.current) {
      const selectedElement = itemRefs.current[selectedIndex]
      const listElement = listRef.current
      
      const itemTop = selectedElement.offsetTop
      const itemBottom = itemTop + selectedElement.offsetHeight
      const listTop = listElement.scrollTop
      const listBottom = listTop + listElement.offsetHeight

      if (itemTop < listTop) {
        listElement.scrollTop = itemTop
      } else if (itemBottom > listBottom) {
        listElement.scrollTop = itemBottom - listElement.offsetHeight
      }
    }
  }, [selectedIndex])

  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null
  }

  const getIcon = (type) => {
    switch (type) {
      case 'contact':
        return <User size={16} className="text-muted-foreground" />
      case 'keyword':
        return <Hash size={16} className="text-muted-foreground" />
      case 'recent':
        return <Clock size={16} className="text-muted-foreground" />
      default:
        return null
    }
  }

  const highlightMatch = (text, query) => {
    if (!query || !query.trim()) {
      return <span>{text}</span>
    }

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) {
      return <span>{text}</span>
    }

    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)

    return (
      <>
        {before}
        <span className="font-semibold bg-gradient-to-r from-primary/30 to-secondary/30 text-primary px-0.5 rounded">{match}</span>
        {after}
      </>
    )
  }

  const handleClick = (suggestion) => {
    if (onSelect) {
      onSelect(suggestion.text)
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card/98 border border-border rounded-xl shadow-xl shadow-primary/10 z-50 max-h-[200px] overflow-hidden animate-in fade-in-0 slide-in-from-top-2">
      <div
        ref={listRef}
        className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${index}-${suggestion.text}`}
            ref={(el) => (itemRefs.current[index] = el)}
            onClick={() => handleClick(suggestion)}
            className={`
              flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200
              ${selectedIndex === index 
                ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium shadow-sm' 
                : 'hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40'
              }
            `}
          >
            <div className="flex-shrink-0">
              {getIcon(suggestion.type)}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              {highlightMatch(suggestion.text, query)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchSuggestions

