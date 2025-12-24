import { useState } from 'react'
import { X, Send, Paperclip, Bold, Italic, Underline, List, Code, Loader2, Minus, Maximize2 } from 'lucide-react'
import { validateEmail, toggleTextFormatting, formatFileSize } from '@/lib/utils/utils'
import { emailApi } from '@/lib/api'

export default function ComposeModal({ user, onSend, onClose }) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [fileObjects, setFileObjects] = useState([]) // Store actual File objects
  const [errors, setErrors] = useState([])
  const [sending, setSending] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleSend = async () => {
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

    setSending(true)
    setErrors([])

    try {
      const toEmails = to.split(',').map(e => e.trim())
      const ccEmails = cc.split(',').map(e => e.trim()).filter(e => e)
      const bccEmails = bcc.split(',').map(e => e.trim()).filter(e => e)

      // Convert file objects to base64
      const attachmentsData = await Promise.all(
        fileObjects.map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result.split(',')[1] // Remove data:...;base64, prefix
              resolve({
                filename: file.name,
                content: base64,
                mimeType: file.type || 'application/octet-stream',
              })
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        })
      )

      const result = await emailApi.sendEmail({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject: subject.trim(),
        body: body.trim(),
        attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
      })

      if (result.success) {
        onSend({
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject: subject.trim(),
          body: body.trim(),
          htmlBody: body.trim(),
          attachments,
        })
      } else {
        setErrors([result.error || 'Failed to send email'])
        setSending(false)
      }
    } catch (err) {
      setErrors(['Failed to send email. Please try again.'])
      setSending(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.currentTarget.files || [])
    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB per file (Gmail limit)
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024 // 25MB total
    
    if (files.length > 0) {
      const newErrors = []
      const validFiles = []
      
      // Check individual file sizes
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`${file.name} is too large (max 25MB per file)`)
        } else {
          validFiles.push(file)
        }
      }
      
      // Check total size
      const currentTotalSize = fileObjects.reduce((sum, f) => sum + f.size, 0)
      const newTotalSize = validFiles.reduce((sum, f) => sum + f.size, 0)
      
      if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
        newErrors.push(`Total attachment size exceeds 25MB limit`)
        setErrors(newErrors)
        e.target.value = ''
        return
      }
      
      if (newErrors.length > 0) {
        setErrors(newErrors)
      }
      
      if (validFiles.length > 0) {
        // Store actual File objects
        setFileObjects(prev => [...prev, ...validFiles])
        
        // Store display info for attachments
        const newAttachments = validFiles.map((file, i) => ({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
        }))
        setAttachments(prev => [...prev, ...newAttachments])
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemoveAttachment = (attId) => {
    const index = attachments.findIndex(a => a.id === attId)
    if (index !== -1) {
      setAttachments(prev => prev.filter(a => a.id !== attId))
      setFileObjects(prev => prev.filter((_, i) => i !== index))
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
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-4">
      <div 
        className={`pointer-events-auto bg-card rounded-t-lg shadow-2xl flex flex-col border border-border transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 m-0 rounded-none' 
            : isMinimized 
              ? 'w-80 h-12'
              : 'w-[600px] h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 via-muted/60 to-secondary/10 rounded-t-lg border-b border-border backdrop-blur-md shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">New Message</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto">
              {errors.length > 0 && (
                <div className="m-4 bg-destructive/10 border border-destructive/30 rounded-lg p-3 animate-in slide-in-from-top-2">
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-sm font-medium text-destructive">{error}</p>
                  ))}
                </div>
              )}

              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground w-12">To</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Recipients"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showCcBcc ? 'Hide' : 'Cc/Bcc'}
                </button>
              </div>

              {showCcBcc && (
                <>
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground w-12">Cc</label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="Cc"
                      className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground w-12">Bcc</label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="Bcc"
                      className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                </>
              )}

              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60 font-medium"
                />
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-b border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileObjects.reduce((sum, f) => sum + f.size, 0))} / 25MB
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs group">
                        <Paperclip size={12} className="text-muted-foreground" />
                        <span className="max-w-[150px] truncate">{att.name}</span>
                        <span className="text-muted-foreground">({formatFileSize(att.size)})</span>
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-4">
                <textarea
                  id="compose-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-full bg-transparent text-sm focus:outline-none resize-none text-foreground"
                  style={{ minHeight: isFullscreen ? '400px' : '250px' }}
                />
              </div>
            </div>

            {/* Footer with formatting tools and send button */}
            <div className="border-t border-border">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 active:scale-95 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover-glow"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send
                        <Send size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleFormat('**')}
                      className="p-2 hover:bg-muted rounded transition"
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => handleFormat('*')}
                      className="p-2 hover:bg-muted rounded transition"
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => handleFormat('__')}
                      className="p-2 hover:bg-muted rounded transition"
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>
                    <button
                      onClick={() => handleFormat('- ')}
                      className="p-2 hover:bg-muted rounded transition"
                      title="List"
                    >
                      <List size={16} />
                    </button>

                    <label className="p-2 hover:bg-muted rounded transition cursor-pointer" title="Attach files">
                      <Paperclip size={16} />
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  disabled={sending}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title="Delete draft"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
