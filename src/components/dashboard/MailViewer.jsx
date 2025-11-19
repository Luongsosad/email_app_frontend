import { X, Star, Trash2, AlertCircle, Archive, Reply, Forward } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils/utils'
import { useState } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ReplyModal from '@/components/dashboard/ReplyModal'
import ForwardModal from '@/components/dashboard/ForwardModal'

export default function MailViewer({
  email,
  onBack,
  onStar,
  onSpam,
  onDelete,
  onArchive,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmSpam, setShowConfirmSpam] = useState(false)
  const [showConfirmArchive, setShowConfirmArchive] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [showForward, setShowForward] = useState(false)

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

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStar(email.id)}
            className="p-2 text-muted-foreground hover:text-primary transition"
            title="Star"
          >
            <Star
              size={20}
              fill={email.isStarred ? 'currentColor' : 'none'}
              className={email.isStarred ? 'text-primary' : ''}
            />
          </button>

          <button
            onClick={() => setShowReply(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition"
            title="Reply"
          >
            <Reply size={20} />
          </button>

          <button
            onClick={() => setShowForward(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition"
            title="Forward"
          >
            <Forward size={20} />
          </button>

          <button
            onClick={() => setShowConfirmArchive(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition"
            title="Archive"
          >
            <Archive size={20} />
          </button>

          <button
            onClick={() => setShowConfirmSpam(true)}
            className="p-2 text-muted-foreground hover:text-orange-500 transition"
            title="Spam"
          >
            <AlertCircle size={20} />
          </button>

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 text-muted-foreground hover:text-destructive transition"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl mx-auto">
          {/* Subject */}
          <h1 className="text-3xl font-bold mb-4 text-foreground">{email.subject}</h1>

          {/* From/To Info */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-foreground">
                  {email.fromName.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1">
                <p className="font-semibold text-foreground">{email.fromName}</p>
                <p className="text-sm text-muted-foreground">{email.from}</p>

                {email.cc.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Cc:</strong> {email.cc.join(', ')}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(email.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {/* To recipients */}
          <div className="mb-6 text-sm">
            <p className="text-muted-foreground">
              <strong>To:</strong> {email.to.join(', ')}
            </p>
          </div>

          {/* Body */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-foreground whitespace-pre-wrap">{email.body}</p>
          </div>

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-3 text-foreground">Attachments ({email.attachments.length})</h3>
              <div className="space-y-2">
                {email.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {attachment.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
