import { useState } from 'react'
import { X, Bell, Moon, Lock, Ligature as Signature } from 'lucide-react'

export default function SettingsPage({ user, onClose }) {
  const [settings, setSettings] = useState({
    notifications: true,
    newMailAlert: true,
    spamAlert: false,
    theme: 'auto',
    compactView: false,
    unreadBadges: true,
    threading: true,
    autoRead: false,
    signature: 'Best regards,\n' + (user?.name || 'You'),
    signatureEnabled: true,
  })

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-2xl flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Account Section */}
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              👤 Account
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Enable Notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.newMailAlert}
                  onChange={() => handleToggle('newMailAlert')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Alert for New Mail</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.spamAlert}
                  onChange={() => handleToggle('spamAlert')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Alert for Spam</span>
              </label>
            </div>
          </div>

          {/* Display Section */}
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Moon size={20} /> Display
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.compactView}
                  onChange={() => handleToggle('compactView')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Compact View</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.unreadBadges}
                  onChange={() => handleToggle('unreadBadges')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Show Unread Badges</span>
              </label>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Lock size={20} /> Privacy & Security
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.threading}
                  onChange={() => handleToggle('threading')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Enable Threading</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRead}
                  onChange={() => handleToggle('autoRead')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Auto-read emails</span>
              </label>
            </div>
          </div>

          {/* Email Signature Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Signature size={20} /> Email Signature
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.signatureEnabled}
                  onChange={() => handleToggle('signatureEnabled')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Enable Signature</span>
              </label>
              <textarea
                value={settings.signature}
                onChange={(e) => handleChange('signature', e.target.value)}
                disabled={!settings.signatureEnabled}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none disabled:bg-muted disabled:text-muted-foreground"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
