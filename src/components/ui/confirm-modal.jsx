import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  const buttonColors = isDangerous
    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    : 'bg-primary text-primary-foreground hover:bg-primary/90'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {isDangerous ? (
              <AlertCircle size={24} className="text-destructive flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-0.5" />
            )}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-muted rounded-lg transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-muted-foreground mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 ${buttonColors}`}
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
