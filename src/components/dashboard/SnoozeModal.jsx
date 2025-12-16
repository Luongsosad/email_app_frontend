import { useState } from 'react'
import { X, Clock, Loader2 } from 'lucide-react'
import { emailApi } from '@/lib/api'

const SNOOZE_OPTIONS = [
  { label: 'Later today (6 hours)', hours: 6 },
  { label: 'Tomorrow morning (8 AM)', type: 'tomorrow-morning' },
  { label: 'Tomorrow afternoon (1 PM)', type: 'tomorrow-afternoon' },
  { label: 'This weekend (Saturday 9 AM)', type: 'weekend' },
  { label: 'Next week (Monday 9 AM)', type: 'next-week' },
  { label: 'Custom...', type: 'custom' },
]

export default function SnoozeModal({ email, onClose, onSnooze }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('09:00')
  const [snoozing, setSnoozing] = useState(false)
  const [error, setError] = useState(null)

  const calculateSnoozeDate = (option) => {
    const now = new Date()
    
    if (option.hours) {
      // Add hours
      return new Date(now.getTime() + option.hours * 60 * 60 * 1000)
    }
    
    switch (option.type) {
      case 'tomorrow-morning': {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(8, 0, 0, 0)
        return tomorrow
      }
      case 'tomorrow-afternoon': {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(13, 0, 0, 0)
        return tomorrow
      }
      case 'weekend': {
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7
        const saturday = new Date(now)
        saturday.setDate(saturday.getDate() + daysUntilSaturday)
        saturday.setHours(9, 0, 0, 0)
        return saturday
      }
      case 'next-week': {
        const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7
        const monday = new Date(now)
        monday.setDate(monday.getDate() + daysUntilMonday)
        monday.setHours(9, 0, 0, 0)
        return monday
      }
      case 'custom': {
        if (!customDate) return null
        const [hours, minutes] = customTime.split(':')
        const date = new Date(customDate)
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        return date
      }
      default:
        return null
    }
  }

  const handleSnooze = async () => {
    const snoozeDate = calculateSnoozeDate(selectedOption)
    
    if (!snoozeDate) {
      setError('Please select a valid snooze time')
      return
    }

    if (snoozeDate <= new Date()) {
      setError('Snooze time must be in the future')
      return
    }

    setSnoozing(true)
    setError(null)

    try {
      const result = await emailApi.snoozeEmail(email.id, snoozeDate.toISOString())
      
      if (result.success) {
        onSnooze(email.id, snoozeDate)
        onClose()
      } else {
        setError(result.error || 'Failed to snooze email')
      }
    } catch (err) {
      setError('Failed to snooze email. Please try again.')
    } finally {
      setSnoozing(false)
    }
  }

  const formatPreviewDate = (option) => {
    const date = calculateSnoozeDate(option)
    if (!date) return ''
    return date.toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-card rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Snooze Email</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
            disabled={snoozing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Hide this email until:
          </p>

          {/* Snooze Options */}
          <div className="space-y-2">
            {SNOOZE_OPTIONS.map((option, index) => (
              <div key={index}>
                <button
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                    selectedOption === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                  disabled={snoozing}
                >
                  <div className="font-medium text-foreground">{option.label}</div>
                  {option.type !== 'custom' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPreviewDate(option)}
                    </div>
                  )}
                </button>

                {/* Custom Date/Time Picker */}
                {selectedOption === option && option.type === 'custom' && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>
                    {customDate && (
                      <div className="text-xs text-muted-foreground">
                        Will snooze until: {formatPreviewDate(option)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            disabled={snoozing}
          >
            Cancel
          </button>
          <button
            onClick={handleSnooze}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedOption || snoozing}
          >
            {snoozing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Snoozing...
              </>
            ) : (
              <>
                <Clock size={16} />
                Snooze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
