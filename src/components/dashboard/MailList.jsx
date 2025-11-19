import { Search, Star, Paperclip } from 'lucide-react'
import { formatDate } from '@/lib/utils/utils'
import { useState } from 'react'

export default function MailList({ emails, selectedEmail, onSelectEmail, onStarEmail }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-96 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
        </div>
      </div>

      {/* Email Count */}
      <div className="px-4 py-2 border-b border-border text-sm text-muted-foreground">
        {filteredEmails.length} Email{filteredEmails.length !== 1 ? 's' : ''}
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No emails found</p>
          </div>
        ) : (
          filteredEmails.map(email => (
            <button
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className={`w-full px-4 py-3 border-b border-border text-left transition hover:bg-muted ${
                selectedEmail?.id === email.id ? 'bg-accent/10' : 'bg-background'
              } ${!email.isRead ? 'bg-accent/15' : ''}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onStarEmail(email.id)
                  }}
                  className="mt-1 text-muted-foreground hover:text-primary transition"
                >
                  <Star
                    size={18}
                    fill={email.isStarred ? 'currentColor' : 'none'}
                    className={email.isStarred ? 'text-primary' : ''}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm truncate ${!email.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                      {email.fromName}
                    </p>
                    <span className={`text-xs whitespace-nowrap ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {formatDate(email.timestamp)}
                    </span>
                  </div>

                  <p className={`text-sm truncate mt-1 ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {email.subject}
                  </p>

                  <p className={`text-xs truncate mt-1 ${!email.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {email.body.substring(0, 50)}...
                  </p>

                  {email.attachments.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Paperclip size={14} className={!email.isRead ? 'text-foreground' : 'text-muted-foreground'} />
                      <span className={`text-xs ${!email.isRead ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                        {email.attachments.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
