import { useToast } from '@/hooks/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, variant, open }) {
        if (open === false) return null
        
        return (
          <div
            key={id}
            onClick={() => dismiss(id)}
            className={`relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-10 shadow-lg transition-all duration-300 animate-slideIn cursor-pointer
              ${variant === 'destructive' 
                ? 'border-red-200 bg-red-50 text-red-900' 
                : variant === 'success'
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-gray-200 bg-white text-gray-900'
              }
            `}
          >
            <div className="grid gap-1 flex-1 pointer-events-none">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismiss(id)
              }}
              className="absolute right-2 top-2 rounded-md p-1 text-gray-500 hover:text-gray-900 transition-colors z-10"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
