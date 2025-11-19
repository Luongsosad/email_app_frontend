import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import MailList from './MailList'
import MailViewer from './MailViewer'
import ComposeModal from './ComposeModal'
import SettingsPage from './SettingsPage'

export default function DashboardPage({ user, onLogout }) {
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [emails, setEmails] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({
    inbox: 5,
    sent: 0,
    drafts: 0,
    spam: 2,
    trash: 0,
    archive: 0,
  })

  // Initialize mock emails
  useEffect(() => {
    const mockEmails = [
      {
        id: '1',
        from: 'john@company.com',
        fromName: 'John Doe',
        to: [user?.email || 'you@example.com'],
        cc: [],
        bcc: [],
        subject: 'Project Update - Q4 Planning',
        body: 'Hi,\n\nI wanted to reach out regarding our Q4 planning. As discussed in our last meeting, we need to finalize the roadmap by next week.\n\nKey points to cover:\n1. Feature prioritization\n2. Resource allocation\n3. Timeline and milestones\n\nPlease let me know your availability for a sync.\n\nBest regards,\nJohn',
        htmlBody: '<p>Hi,</p><p>I wanted to reach out regarding our Q4 planning...</p>',
        attachments: [],
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        isStarred: false,
        isSpam: false,
        folder: 'inbox',
        threadId: 'thread-1',
      },
      {
        id: '2',
        from: 'sarah@design.com',
        fromName: 'Sarah Smith',
        to: [user?.email || 'you@example.com'],
        cc: ['team@company.com'],
        bcc: [],
        subject: 'Design Review - New Dashboard',
        body: 'Hi,\n\nThe new dashboard design is ready for your review. I\'ve created a prototype with all the requested features.\n\nPlease check the Figma link below and provide feedback.\n\nFigma: [link]\n\nLooking forward to your thoughts!\n\nBest,\nSarah',
        htmlBody: '<p>Hi,</p><p>The new dashboard design is ready...</p>',
        attachments: [
          {
            id: 'att-1',
            name: 'dashboard-design.pdf',
            size: 2048576,
            type: 'application/pdf',
            url: '#',
          },
        ],
        timestamp: new Date(Date.now() - 7200000),
        isRead: false,
        isStarred: true,
        isSpam: false,
        folder: 'inbox',
        threadId: 'thread-2',
      },
      {
        id: '3',
        from: 'support@service.com',
        fromName: 'Support Team',
        to: [user?.email || 'you@example.com'],
        cc: [],
        bcc: [],
        subject: 'Action Required: Confirm Your Email',
        body: 'Please confirm your email address by clicking the link below.\n\n[Confirm Email]\n\nThis link expires in 24 hours.',
        htmlBody: '<p>Please confirm your email address...</p>',
        attachments: [],
        timestamp: new Date(Date.now() - 86400000),
        isRead: true,
        isStarred: false,
        isSpam: false,
        folder: 'inbox',
        threadId: 'thread-3',
      },
      {
        id: '4',
        from: 'newsletter@tech.com',
        fromName: 'Tech Newsletter',
        to: [user?.email || 'you@example.com'],
        cc: [],
        bcc: [],
        subject: 'Weekly Tech Digest - Latest News',
        body: 'Here are the top tech news stories this week...',
        htmlBody: '<p>Here are the top tech news stories...</p>',
        attachments: [],
        timestamp: new Date(Date.now() - 172800000),
        isRead: true,
        isStarred: false,
        isSpam: false,
        folder: 'inbox',
        threadId: 'thread-4',
      },
      {
        id: '5',
        from: 'spam@ads.com',
        fromName: 'Spam Ads',
        to: [user?.email || 'you@example.com'],
        cc: [],
        bcc: [],
        subject: 'EXCLUSIVE OFFER - 50% OFF NOW',
        body: 'Click here for amazing deals...',
        htmlBody: '<p>This is spam content...</p>',
        attachments: [],
        timestamp: new Date(Date.now() - 259200000),
        isRead: false,
        isStarred: false,
        isSpam: true,
        folder: 'spam',
        threadId: 'thread-5',
      },
    ]
    setEmails(mockEmails)
  }, [user])

  const currentEmails = emails.filter(e => e.folder === selectedFolder)

  const handleStarEmail = (emailId) => {
    setEmails(prev => {
      const updated = prev.map(e => 
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      )
      if (selectedEmail?.id === emailId) {
        const updatedEmail = updated.find(e => e.id === emailId)
        if (updatedEmail) {
          setSelectedEmail(updatedEmail)
        }
      }
      return updated
    })
  }

  const handleMarkAsRead = (emailId) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, isRead: true } : e
    ))
  }

  const handleMoveToSpam = (emailId) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, folder: 'spam', isSpam: true } : e
    ))
    setUnreadCounts(prev => ({
      ...prev,
      [selectedFolder]: Math.max(0, prev[selectedFolder] - 1),
      spam: prev.spam + 1,
    }))
    setSelectedEmail(null)
  }

  const handleDelete = (emailId) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, folder: 'trash' } : e
    ))
    setSelectedEmail(null)
  }

  const handleArchive = (emailId) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, folder: 'archive' } : e
    ))
    setSelectedEmail(null)
  }

  const handleSendEmail = (composeData) => {
    const newEmail = {
      id: `email-${Date.now()}`,
      from: user?.email || 'you@example.com',
      fromName: user?.name || 'You',
      to: composeData.to,
      cc: composeData.cc,
      bcc: composeData.bcc,
      subject: composeData.subject,
      body: composeData.body,
      htmlBody: composeData.htmlBody,
      attachments: composeData.attachments,
      timestamp: new Date(),
      isRead: true,
      isStarred: false,
      isSpam: false,
      folder: 'sent',
      threadId: `thread-${Date.now()}`,
    }
    setEmails(prev => [...prev, newEmail])
    setShowCompose(false)
    setUnreadCounts(prev => ({
      ...prev,
      sent: prev.sent + 1,
    }))
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
        unreadCounts={unreadCounts}
        user={user}
        onLogout={onLogout}
        onCompose={() => setShowCompose(true)}
        onSettings={() => setShowSettings(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <MailList
          emails={currentEmails}
          selectedEmail={selectedEmail}
          onSelectEmail={(email) => {
            setSelectedEmail(email)
            handleMarkAsRead(email.id)
          }}
          onStarEmail={handleStarEmail}
        />
        
        {selectedEmail && (
          <MailViewer
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onStar={handleStarEmail}
            onSpam={handleMoveToSpam}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        )}
      </div>

      {showCompose && (
        <ComposeModal
          user={user}
          onSend={handleSendEmail}
          onClose={() => setShowCompose(false)}
        />
      )}

      {showSettings && (
        <SettingsPage
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
