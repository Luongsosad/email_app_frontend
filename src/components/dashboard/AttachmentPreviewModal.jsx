import { useState, useEffect } from 'react'
import { X, Download, Loader2, FileText, Image, File, Video, Music, FileSpreadsheet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fetchAttachmentBlob } from '@/lib/api/attachment.api'
import { detectFileType, formatFileSize } from '@/lib/utils/utils'

export default function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachment,
  messageId,
  onDownload,
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [textContent, setTextContent] = useState(null)

  const fileType = attachment ? detectFileType(attachment.name, attachment.type) : null

  useEffect(() => {
    if (isOpen && attachment && messageId && fileType?.canPreview) {
      loadPreview()
    } else {
      // Cleanup when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setTextContent(null)
      setError(null)
    }

    return () => {
      // Cleanup on unmount
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, attachment?.id, messageId])

  const loadPreview = async () => {
    if (!attachment || !messageId) return

    setLoading(true)
    setError(null)

    try {
      const blob = await fetchAttachmentBlob(messageId, attachment.id)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      // If text file, also load text content
      if (fileType?.type === 'text') {
        const text = await blob.text()
        setTextContent(text)
      }
    } catch (err) {
      console.error('Failed to load preview:', err)
      setError('Failed to load preview. Please try downloading the file instead.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment)
    }
    onClose()
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <File size={48} className="text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Download Instead
          </Button>
        </div>
      )
    }

    if (!previewUrl && !textContent) {
      return null
    }

    switch (fileType?.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-muted/20 rounded-lg p-4 max-h-[70vh] overflow-auto">
            <img
              src={previewUrl}
              alt={attachment.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={() => setError('Failed to load image')}
            />
          </div>
        )

      case 'pdf':
        return (
          <div className="w-full h-[70vh] border border-border rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={attachment.name}
              onError={() => setError('Failed to load PDF')}
            />
          </div>
        )

      case 'text':
        return (
          <div className="w-full h-[70vh] border border-border rounded-lg overflow-auto bg-muted/10 p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
              {textContent || 'Loading text content...'}
            </pre>
          </div>
        )

      case 'video':
        return (
          <div className="flex items-center justify-center bg-muted/20 rounded-lg p-4">
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg"
              onError={() => setError('Failed to load video')}
            >
              Your browser does not support video playback.
            </video>
          </div>
        )

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8">
            <Music size={64} className="text-primary mb-4" />
            <audio
              src={previewUrl}
              controls
              className="w-full max-w-md"
              onError={() => setError('Failed to load audio')}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        )

      case 'office':
        // Office files need to be opened in new tab or downloaded
        // Google Docs Viewer requires public URL, which we don't have
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <FileSpreadsheet size={48} className="text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Office files cannot be previewed directly. Please download to view.
            </p>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Download File
            </Button>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <File size={48} className="text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
            <Button onClick={handleDownload} variant="outline" size="sm" className="mt-4">
              <Download size={16} className="mr-2" />
              Download File
            </Button>
          </div>
        )
    }
  }

  const getFileIcon = () => {
    switch (fileType?.type) {
      case 'image':
        return <Image size={20} />
      case 'pdf':
        return <FileText size={20} />
      case 'text':
        return <FileText size={20} />
      case 'video':
        return <Video size={20} />
      case 'audio':
        return <Music size={20} />
      case 'office':
        return <FileSpreadsheet size={20} />
      default:
        return <File size={20} />
    }
  }

  if (!attachment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              <span className="truncate">{attachment.name}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
                title="Download"
              >
                <Download size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                title="Close"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
