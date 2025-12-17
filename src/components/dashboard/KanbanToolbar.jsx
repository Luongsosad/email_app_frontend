import { ArrowDownAZ, ArrowUpAZ, Mail, Paperclip, X, Filter } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils/utils'

/**
 * KanbanToolbar - Combined sorting and filtering controls for Kanban Board
 * Displays above the kanban columns with sorting and filter options
 */
export default function KanbanToolbar({
  sortBy = 'newest',
  onSortChange,
  filters = {},
  onFilterChange,
  onClearFilters,
  hasActiveFilters = false,
}) {
  const handleSortClick = (newSort) => {
    if (onSortChange) {
      onSortChange(newSort)
    }
  }

  const handleFilterToggle = (filterKey) => {
    if (onFilterChange) {
      onFilterChange(filterKey, !filters[filterKey])
    }
  }

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Left side - Sorting controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <ArrowDownAZ className="h-4 w-4" />
            Sort:
          </span>
          <div className="flex gap-1">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortClick('newest')}
              className={cn(
                'text-xs h-8',
                sortBy === 'newest' && 'bg-primary text-primary-foreground'
              )}
            >
              <ArrowDownAZ className="h-3.5 w-3.5 mr-1" />
              Newest First
            </Button>
            <Button
              variant={sortBy === 'oldest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortClick('oldest')}
              className={cn(
                'text-xs h-8',
                sortBy === 'oldest' && 'bg-primary text-primary-foreground'
              )}
            >
              <ArrowUpAZ className="h-3.5 w-3.5 mr-1" />
              Oldest First
            </Button>
          </div>
        </div>

        {/* Right side - Filter controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filters:
          </span>
          <div className="flex gap-1">
            <Button
              variant={filters.showOnlyUnread ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterToggle('showOnlyUnread')}
              className={cn(
                'text-xs h-8',
                filters.showOnlyUnread && 'bg-primary text-primary-foreground'
              )}
            >
              <Mail className="h-3.5 w-3.5 mr-1" />
              Unread Only
            </Button>
            <Button
              variant={filters.showOnlyWithAttachments ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterToggle('showOnlyWithAttachments')}
              className={cn(
                'text-xs h-8',
                filters.showOnlyWithAttachments && 'bg-primary text-primary-foreground'
              )}
            >
              <Paperclip className="h-3.5 w-3.5 mr-1" />
              With Attachments
            </Button>
            
            {/* Clear filters button - only show when filters are active */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
