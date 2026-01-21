// Application constants
import { Mail, Send, FileText, AlertCircle, Trash2, Archive, MessageSquare, Star, Bookmark, MailOpen, Clock, Library } from 'lucide-react'

export const EMAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'spam', 'trash', 'archive', 'chat', 'starred', 'important', 'unread', 'snoozed']

export const FOLDER_LABELS = {
  inbox: { label: 'Inbox', icon: Mail, color: 'text-blue-600' },
  sent: { label: 'Sent Mail', icon: Send, color: 'text-green-600' },
  drafts: { label: 'Drafts', icon: FileText, color: 'text-orange-600' },
  spam: { label: 'Spam', icon: AlertCircle, color: 'text-red-600' },
  trash: { label: 'Trash', icon: Trash2, color: 'text-gray-600' },
  archive: { label: 'Archive', icon: Archive, color: 'text-purple-600' },
  chat: { label: 'Chat', icon: MessageSquare, color: 'text-indigo-600' },
  starred: { label: 'Starred', icon: Star, color: 'text-yellow-600' },
  important: { label: 'Important', icon: Bookmark, color: 'text-pink-600' },
  unread: { label: 'Unread', icon: MailOpen, color: 'text-cyan-600' },
  snoozed: { label: 'Snoozed', icon: Clock, color: 'text-amber-600' },
  all_mail: { label: 'All Mail', icon: Library, color: 'text-indigo-600' },
}

export const FORMATTING_OPTIONS = [
  { id: 'bold', label: 'Bold', icon: 'B', tag: '**' },
  { id: 'italic', label: 'Italic', icon: 'I', tag: '*' },
  { id: 'underline', label: 'Underline', icon: 'U', tag: '__' },
  { id: 'list', label: 'List', icon: '•', tag: '- ' },
  { id: 'code', label: 'Code', icon: '</>', tag: '`' },
]

export const TEXT_FORMATS = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'strikethrough',
  code: 'code',
  blockquote: 'blockquote',
  bulletList: 'bullet_list',
  orderedList: 'ordered_list',
  link: 'link',
}

export const CONFIRMATION_MESSAGES = {
  deleteEmail: 'Are you sure you want to delete this email permanently?',
  moveToSpam: 'Mark this email as spam?',
  deleteMultiple: (count) => `Delete ${count} email(s)? This cannot be undone.`,
  emptyTrash: 'Empty trash permanently? All emails will be deleted.',
}

export const GOOGLE_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
}
