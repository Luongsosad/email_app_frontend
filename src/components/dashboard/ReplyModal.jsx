import { useState } from 'react'
import { X, Send, Bold, Italic, Underline, List, Code } from 'lucide-react'
import { toggleTextFormatting } from '@/lib/utils/utils'

export default function ReplyModal({ email, onClose, onSend }) {
  const [body, setBody] = useState(`\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.fromName} wrote:\n> ${email.body.split('\n')[0]}`)

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

  const handleSend = () => {
    onSend()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-2xl flex flex-col max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Reply to {email.fromName}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-muted rounded-lg border border-border">
            <button
              onClick={() => handleFormat('**')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => handleFormat('*')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => handleFormat('__')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Underline"
            >
              <Underline size={16} />
            </button>
            <button
              onClick={() => handleFormat('- ')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => handleFormat('`')}
              className="p-1.5 hover:bg-muted-foreground/20 rounded transition"
              title="Code"
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
            rows={6}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2"
          >
            <Send size={16} />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  )
}
