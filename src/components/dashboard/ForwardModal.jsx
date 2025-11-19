import { useState } from 'react'
import { X, Send, Bold, Italic, Underline, List, Code } from 'lucide-react'
import { validateEmail, toggleTextFormatting } from '@/lib/utils/utils'

export default function ForwardModal({ email, onClose, onSend }) {
  const [to, setTo] = useState('')
  const [body, setBody] = useState(`\n\n---------- Forwarded message ---------\nFrom: ${email.fromName} <${email.from}>\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`)
  const [errors, setErrors] = useState([])

  const handleFormat = (tag) => {
    const textarea = document.getElementById('forward-body')
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
    setErrors([])

    if (!to.trim()) {
      setErrors(['Recipient email is required'])
      return
    }

    if (!validateEmail(to.trim())) {
      setErrors(['Invalid email address'])
      return
    }

    onSend()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-2xl flex flex-col max-h-screen md:max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Forward Email</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              {errors.map((error, idx) => (
                <p key={idx} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
            />
          </div>

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
            id="forward-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a note before forwarding..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm resize-none"
            rows={4}
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
            Forward
          </button>
        </div>
      </div>
    </div>
  )
}
