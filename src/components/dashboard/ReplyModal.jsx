import { useState } from 'react'
import { X, Send, Bold, Italic, Underline, List, Code, Loader2 } from 'lucide-react'
import { toggleTextFormatting } from '@/lib/utils/utils'
import { emailApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function ReplyModal({ email, onClose, onSend }) {
  // Format the original email body with quote markers
  const formatOriginalEmail = () => {
    const originalBody = email.body || email.snippet || ''
    // Add '> ' to the beginning of each line to quote the original message
    const quotedBody = originalBody
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')
    
    const dateStr = new Date(email.receivedDate || email.timestamp).toLocaleString()
    const fromStr = email.from || email.senderName || 'Unknown Sender'
    
    return `\n\nOn ${dateStr}, ${fromStr} wrote:\n${quotedBody}`
  }

  const [body, setBody] = useState(formatOriginalEmail())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const handleFormat = (tag) => {
    const textarea = document.getElementById('reply-body')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = body.substring(start, end) || 'text'
    const beforeText = body.substring(0, start)
    const afterText = body.substring(end)

    const formattedText = toggleTextFormatting(selectedText, tag)
    const newBody = beforeText + formattedText + afterText

    setBody(newBody)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + selectedText.length + tag.length)
    }, 0)
  }

  const handleSend = async () => {
    if (!body.trim()) {
      setError('Reply body cannot be empty')
      return
    }

    setSending(true)
    setError(null)

    try {
      const result = await emailApi.replyToEmail(email.id, {
        body: body.trim(),
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reply sent successfully',
          variant: 'default',
        })
        onSend()
        onClose()
      } else {
        const errorMsg = result.error || 'Failed to send reply'
        setError(errorMsg)
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to send reply. Please try again.'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-2xl flex flex-col max-h-96 min-h-[60vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Reply to {email.from}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
            disabled={sending}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-muted rounded-lg border border-border">
            <button
              onClick={() => handleFormat('**')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Bold"
              disabled={sending}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => handleFormat('*')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Italic"
              disabled={sending}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => handleFormat('__')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Underline"
              disabled={sending}
            >
              <Underline size={16} />
            </button>
            <button
              onClick={() => handleFormat('- ')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="List"
              disabled={sending}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => handleFormat('`')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Code"
              disabled={sending}
            >
              <Code size={16} />
            </button>
          </div>

          <textarea
            id="reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your reply..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm resize-none"
            rows={14}
            disabled={sending}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
