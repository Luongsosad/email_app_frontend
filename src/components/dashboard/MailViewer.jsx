import { memo, useState, useMemo, useEffect } from 'react'
import { X, Star, Trash2, AlertCircle, Archive, Reply, Forward, Download, Loader2, Clock, Sparkles, Paperclip, ExternalLink, Eye } from 'lucide-react'
import { formatDate, formatFileSize, detectFileType } from '@/lib/utils/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ReplyModal from '@/components/dashboard/ReplyModal'
import ForwardModal from '@/components/dashboard/ForwardModal'
import SnoozeModal from '@/components/dashboard/SnoozeModal'
import AttachmentPreviewModal from '@/components/dashboard/AttachmentPreviewModal'
import { attachmentApi, emailApi } from '@/lib/api'
import DOMPurify from 'dompurify'

function MailViewer({
  email,
  onBack,
  onStar,
  onSpam,
  onDelete,
  onArchive,
  onSnooze,
  loading,
  onSummaryStart,
  onSummaryComplete,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmSpam, setShowConfirmSpam] = useState(false)
  const [showConfirmArchive, setShowConfirmArchive] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [showSnooze, setShowSnooze] = useState(false)
  const [downloadingAttachments, setDownloadingAttachments] = useState(new Set())
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)

  // Fetch existing summary when email changes
  useEffect(() => {
    const fetchSummary = async () => {
      if (email?.id) {
        try {
          const response = await emailApi.getEmailSummary(email.id)
          if (response.success && response.data?.summary) {
            setSummary(response.data.summary)
          } else {
            setSummary(null)
          }
        } catch (err) {
          console.error('Failed to fetch summary:', err)
          setSummary(null)
        }
      }
    }

    fetchSummary()
  }, [email?.id])

  const handleOpenInGmail = () => {
    if (!email?.id) return

    const gmailUrl = `https://mail.google.com/mail/u/1/#inbox/${email.id}`
    window.open(gmailUrl, '_blank', 'noopener,noreferrer')
  }

  const handleGenerateSummary = async () => {
    if (!email?.id) return

    setLoadingSummary(true)

    // Notify parent that summary generation started
    if (onSummaryStart) {
      onSummaryStart(email.id, email.subject)
    }

    try {
      // Force regenerate if summary already exists
      const force = summary !== null
      const response = await emailApi.summarizeEmail(email.id, force)
      if (response.success && response.data?.summary) {
        setSummary(response.data.summary)

        // Notify parent that summary is complete with the new summary
        if (onSummaryComplete) {
          onSummaryComplete(email.id, response.data.summary)
        }

        // Trigger a custom event for KanbanCards to refresh
        window.dispatchEvent(new CustomEvent('emailSummaryUpdated', {
          detail: { emailId: email.id, summary: response.data.summary }
        }))
      } else {
        alert('Failed to generate summary. Please try again.')
      }
    } catch (err) {
      console.error('Failed to generate summary:', err)
      alert('Failed to generate summary. Please try again.')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleDeleteConfirm = () => {
    onDelete(email.id)
    setShowConfirmDelete(false)
  }

  const handleSpamConfirm = () => {
    onSpam(email.id)
    setShowConfirmSpam(false)
  }

  const handleArchiveConfirm = () => {
    onArchive(email.id)
    setShowConfirmArchive(false)
  }

  const handleDownloadAttachment = async (attachment) => {
    setDownloadingAttachments(prev => new Set([...prev, attachment.id]))
    try {
      await attachmentApi.downloadAttachment(email.id, attachment.id, attachment.name)
    } catch (error) {
      console.error('Failed to download attachment:', error)
      alert('Failed to download attachment. Please try again.')
    } finally {
      setDownloadingAttachments(prev => {
        const newSet = new Set([...prev])
        newSet.delete(attachment.id)
        return newSet
      })
    }
  }

  // Extract sender name from email address if needed
  const getSenderName = () => {
    if (email.from) {
      // Try to extract name from "Name <email@example.com>" format
      const match = email.from.match(/^(.+?)\s*<(.+)>$/)
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, '')
      }
      // If no name, return the email address
      return email.from.split('@')[0]
    }
    return 'Unknown Sender'
  }

  const getSenderEmail = () => {
    if (email.from) {
      const match = email.from.match(/<(.+)>$/)
      if (match && match[1]) {
        return match[1]
      }
      return email.from
    }
    return ''
  }

  const senderName = getSenderName()
  const senderEmail = getSenderEmail()

  // Sanitize HTML content
  const sanitizedBody = useMemo(() => {
    if (!email.body) return ''

    // Configure DOMPurify to allow most HTML but remove dangerous elements
    const config = {
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'ul', 'blockquote', 'pre', 'code',
        'hr', 'u', 's', 'del', 'ins', 'sub', 'sup', 'font', 'center'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height', 'style',
        'class', 'target', 'rel', 'border', 'cellpadding', 'cellspacing',
        'align', 'valign', 'bgcolor', 'color', 'size', 'face'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ['target'], // Allow opening links in new tab
    }

    return DOMPurify.sanitize(email.body, config)
  }, [email.body])

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden border-l max-md:border-l-0 max-md:border-t max-md:w-full border-border shadow-lg">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 via-card/60 to-card/80 p-2 sm:p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Close email viewer"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:bg-muted/80 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          title="Back"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onStar(email.id, email.isStarred)}
            className={`p-2 rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation ${email.isStarred
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
            title={email.isStarred ? 'Remove star' : 'Add star'}
            aria-label={email.isStarred ? 'Remove star' : 'Add star'}
          >
            <Star
              size={18}
              fill={email.isStarred ? 'currentColor' : 'none'}
            />
          </button>

          <button
            onClick={() => setShowReply(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation hidden sm:flex"
            title="Reply"
            aria-label="Reply"
          >
            <Reply size={18} />
          </button>

          <button
            onClick={() => setShowForward(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation hidden sm:flex"
            title="Forward"
            aria-label="Forward"
          >
            <Forward size={18} />
          </button>

          <button
            onClick={() => setShowSnooze(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
            title="Snooze"
            aria-label="Snooze"
          >
            <Clock size={18} />
          </button>

          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className={`p-2 rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation ${summary
              ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              } ${loadingSummary ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              loadingSummary
                ? 'AI đang tạo tóm tắt...'
                : summary
                  ? 'Tạo lại tóm tắt với AI'
                  : 'Tạo tóm tắt với AI'
            }
            aria-label="Generate summary"
          >
            {loadingSummary ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
          </button>

          {email?.id && (
            <button
              onClick={handleOpenInGmail}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
              title="Open in Gmail"
              aria-label="Open in Gmail"
            >
              <ExternalLink size={18} />
            </button>
          )}

          <button
            onClick={() => setShowConfirmArchive(true)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
            title="Archive"
            aria-label="Archive"
          >
            <Archive size={18} />
          </button>

          <button
            onClick={() => setShowConfirmSpam(true)}
            className="p-2 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
            title="Spam"
            aria-label="Mark as spam"
          >
            <AlertCircle size={18} />
          </button>

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="text-base font-medium text-foreground mb-1">Loading email...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Subject */}
            <h1 className="text-2xl lg:text-3xl font-bold mb-6 text-foreground leading-tight">
              {email.subject || '(No Subject)'}
            </h1>

            {/* From/To Info */}
            <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-muted/20 border border-border rounded-xl p-5 mb-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                  <span className="text-xl font-bold text-primary-foreground">
                    {senderName.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-foreground mb-1">{senderName}</p>
                  <p className="text-sm text-muted-foreground truncate">{senderEmail}</p>

                  {email.cc && email.cc.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Cc:</span> {Array.isArray(email.cc) ? email.cc.join(', ') : email.cc}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(new Date(email.receivedDate || email.timestamp))}
                  </p>
                </div>
              </div>
            </div>

            {/* To recipients */}
            {email.to && (
              <div className="mb-6 text-sm bg-muted/20 border border-border rounded-lg p-3.5">
                <p className="text-muted-foreground">
                  <span className="font-medium">To:</span> {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                </p>
              </div>
            )}

            {/* Summary */}
            {/* Don't show inline loading if using global notification */}
            {loadingSummary && !summary && !onSummaryStart && (
              <div className="mb-6 bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-amber-100/95 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/20 border-2 border-amber-200/60 dark:border-amber-800/60 rounded-2xl p-5 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 rounded-lg shadow-sm">
                    <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 text-base flex items-center gap-2">
                      AI đang tạo tóm tắt...
                      <span className="text-xs font-normal px-2 py-0.5 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-full text-amber-800 dark:text-amber-200 shadow-sm">
                        Gemini
                      </span>
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 leading-relaxed text-sm">
                      Vui lòng chờ trong giây lát, AI đang phân tích và tóm tắt nội dung email...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {summary && (
              <div className="mb-6 bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-amber-100/95 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/20 border-2 border-amber-200/60 dark:border-amber-800/60 rounded-2xl p-5 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 rounded-lg shadow-sm">
                    <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 text-base flex items-center gap-2">
                      AI Summary
                      <span className="text-xs font-normal px-2 py-0.5 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-full text-amber-800 dark:text-amber-200 shadow-sm">
                        Gemini
                      </span>
                      {loadingSummary && (
                        <Loader2 size={14} className="text-amber-600 dark:text-amber-400 animate-spin" />
                      )}
                    </h3>
                    <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="mb-8 border border-border rounded-xl p-6 bg-gradient-to-br from-card via-card to-muted/20 shadow-md">
              <div
                className="email-content text-foreground prose prose-sm max-w-none dark:prose-invert"
                style={{ lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
              />
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="border-t-2 border-border pt-6 mt-6">
                <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2 text-lg">
                  <Paperclip size={20} className="text-primary" />
                  Attachments ({email.attachments.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {email.attachments.map(attachment => {
                    const fileType = detectFileType(attachment.name, attachment.type)
                    const canPreview = fileType.canPreview

                    return (
                      <div
                        key={attachment.id}
                        className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-muted/60 to-muted/40 hover:from-muted/80 hover:to-muted/60 border border-border rounded-lg transition-colors duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30 shadow-sm">
                          <span className="text-xs font-bold text-primary">
                            {attachment.name.split('.').pop()?.toUpperCase().substring(0, 3) || 'FILE'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate mb-0.5">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {canPreview && (
                            <button
                              onClick={() => setPreviewAttachment(attachment)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                              title="Preview"
                              aria-label="Preview attachment"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadAttachment(attachment)}
                            disabled={downloadingAttachments.has(attachment.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors duration-150 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download"
                            aria-label="Download attachment"
                          >
                            {downloadingAttachments.has(attachment.id) ? (
                              <Loader2 size={18} className="animate-spin text-primary" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Email"
        message="Are you sure you want to permanently delete this email? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
        isDestructive
      />

      <ConfirmModal
        isOpen={showConfirmSpam}
        title="Mark as Spam"
        message="Are you sure you want to mark this email as spam?"
        confirmText="Yes, Mark as Spam"
        cancelText="Cancel"
        onConfirm={handleSpamConfirm}
        onCancel={() => setShowConfirmSpam(false)}
      />

      <ConfirmModal
        isOpen={showConfirmArchive}
        title="Archive Email"
        message="Are you sure you want to archive this email?"
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowConfirmArchive(false)}
      />

      {/* Reply Modal */}
      {showReply && (
        <ReplyModal
          email={email}
          onClose={() => setShowReply(false)}
          onSend={() => setShowReply(false)}
        />
      )}

      {/* Forward Modal */}
      {showForward && (
        <ForwardModal
          email={email}
          onClose={() => setShowForward(false)}
          onSend={() => setShowForward(false)}
        />
      )}

      {/* Snooze Modal */}
      {showSnooze && (
        <SnoozeModal
          email={email}
          onClose={() => setShowSnooze(false)}
          onSnooze={(emailId, snoozeUntil) => {
            setShowSnooze(false)
            if (onSnooze) {
              onSnooze(emailId, snoozeUntil)
            }
            // Close the viewer after snoozing
            if (onBack) {
              onBack()
            }
          }}
        />
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <AttachmentPreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
          messageId={email.id}
          onDownload={handleDownloadAttachment}
        />
      )}
    </div>
  )
}

export default memo(MailViewer)
