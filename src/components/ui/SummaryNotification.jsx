import { useState, useEffect } from 'react'
import { Sparkles, Loader2, X, CheckCircle2 } from 'lucide-react'

/**
 * Floating notification for email summarization progress
 * Shows at bottom right corner with loading state
 */
export default function SummaryNotification({ 
  isLoading, 
  emailId, 
  emailSubject,
  onComplete,
  onDismiss,
  onClick 
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading || emailId) {
      setIsVisible(true)
    } else {
      // Hide when both are null/false
      setIsVisible(false)
    }
  }, [isLoading, emailId])

  useEffect(() => {
    if (!isLoading && emailId) {
      // Show success state briefly
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
        if (onComplete) onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, emailId, onComplete])

  const handleClick = () => {
    if (!isLoading && onClick && emailId) {
      // Dismiss notification immediately when clicked
      setIsVisible(false)
      // Call onClick handler
      onClick(emailId)
      // Clean up after animation
      setTimeout(() => {
        if (onDismiss) onDismiss()
      }, 300)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onDismiss) onDismiss()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}
    >
      <div 
        onClick={handleClick}
        className={`
          bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-amber-100/95 dark:from-amber-950/95 dark:via-orange-950/95 dark:to-amber-900/95
          border-2 border-amber-300/60 dark:border-amber-700/60
          rounded-2xl shadow-xl shadow-amber-500/20 p-4 pr-12 max-w-sm
          ${!isLoading && onClick ? 'cursor-pointer hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 hover:border-amber-400 dark:hover:border-amber-600' : ''}
          transition-all duration-300
        `}
      >
        {/* Close button */}
        {!isLoading && onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition"
          >
            <X size={16} className="text-amber-700 dark:text-amber-300" />
          </button>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 rounded-lg flex-shrink-0 shadow-sm">
            {isLoading ? (
              <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin" />
            ) : (
              <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                {isLoading ? 'AI đang tạo tóm tắt...' : 'Tóm tắt hoàn tất!'}
              </h4>
              <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-full text-amber-800 dark:text-amber-200 flex items-center gap-1 shadow-sm">
                <Sparkles size={10} />
                Gemini
              </span>
            </div>
            
            <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
              {emailSubject || 'Email'}
            </p>
            
            {!isLoading && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                👆 Click để xem email
              </p>
            )}
          </div>
        </div>

        {/* Progress bar for loading state */}
        {isLoading && (
          <div className="mt-3 h-1 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-600 animate-progress"
              style={{ animation: 'progress 10s linear forwards' }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 10s linear forwards;
        }
      `}</style>
    </div>
  )
}
