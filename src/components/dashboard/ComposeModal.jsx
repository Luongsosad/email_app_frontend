import { useState } from 'react'
import { X, Send, Paperclip, Bold, Italic, Underline, List, Code } from 'lucide-react'
import { validateEmail, toggleTextFormatting, formatFileSize } from '@/lib/utils/utils'

export default function ComposeModal({ user, onSend, onClose }) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState([])

  const handleSend = () => {
    const newErrors = []

    if (!to.trim()) {
      newErrors.push('Recipient email is required')
    } else {
      const toEmails = to.split(',').map(e => e.trim())
      toEmails.forEach(email => {
        if (!validateEmail(email)) {
          newErrors.push(`Invalid email: ${email}`)
        }
      })
    }

    if (!subject.trim()) {
      newErrors.push('Subject is required')
    }

    if (!body.trim()) {
      newErrors.push('Message body is required')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    const toEmails = to.split(',').map(e => e.trim())
    const ccEmails = cc.split(',').map(e => e.trim()).filter(e => e)
    const bccEmails = bcc.split(',').map(e => e.trim()).filter(e => e)

    onSend({
      to: toEmails,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject.trim(),
      body: body.trim(),
      htmlBody: body.trim(),
      attachments,
    })
  }

  const handleFileSelect = (e) => {
    const files = e.currentTarget.files
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const newAttachment = {
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '#',
        }
        setAttachments(prev => [...prev, newAttachment])
      }
    }
  }

  const handleFormat = (tag) => {
    const textarea = document.getElementById('compose-body')
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50">
      <div className="w-full md:w-2xl bg-card rounded-lg shadow-2xl flex flex-col max-h-screen md:max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Compose Email</h2>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
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

            <div className="flex-1"></div>

            <label className="cursor-pointer p-1.5 hover:bg-muted-foreground/20 rounded transition">
              <Paperclip size={16} />
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{att.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(att.size)})</span>
                  </div>
                  <button
                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
          >
            Draft
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
