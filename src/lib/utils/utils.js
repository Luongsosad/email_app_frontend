import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function formatDate(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function extractEmailDomain(email) {
  return email.split("@")[1]?.toLowerCase() || "";
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function parseEmailList(emailString) {
  return emailString
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

export function toggleTextFormatting(text, tag) {
  if (text.startsWith(tag) && text.endsWith(tag)) {
    return text.slice(tag.length, -tag.length);
  }
  return tag + text + tag;
}

/**
 * Strip HTML tags and decode HTML entities from text
 * Similar to Gmail's preview - shows plain text only
 * @param {string} html - HTML string to strip
 * @param {number} maxLength - Maximum length of the preview (optional)
 * @returns {string} Plain text without HTML tags
 */
export function stripHtmlTags(html, maxLength = null) {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Get text content (automatically strips HTML tags and decodes entities)
  let text = tempDiv.textContent || tempDiv.innerText || "";

  // Clean up whitespace - replace multiple spaces/newlines with single space
  text = text.replace(/\s+/g, " ").trim();

  // Truncate if maxLength is specified
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + "...";
  }

  return text;
}

/**
 * Detect file type from filename and mimeType
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type (optional)
 * @returns {object} { type: 'image'|'pdf'|'text'|'video'|'audio'|'office'|'other', canPreview: boolean }
 */
export function detectFileType(filename, mimeType = '') {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  const mimeLower = mimeType.toLowerCase()

  // Image types
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
  const imageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon']
  
  // PDF
  const pdfExtensions = ['pdf']
  const pdfMimes = ['application/pdf']
  
  // Text types
  const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'scss', 'yaml', 'yml']
  const textMimes = ['text/plain', 'text/markdown', 'application/json', 'text/xml', 'text/csv', 'text/javascript', 'text/css', 'text/html']
  
  // Video types
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi']
  const videoMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
  
  // Audio types
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
  const audioMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac']
  
  // Office types (can use Google Docs Viewer)
  const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  const officeMimes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']

  // Check by MIME type first (more reliable)
  if (mimeLower) {
    if (imageMimes.includes(mimeLower)) {
      return { type: 'image', canPreview: true }
    }
    if (pdfMimes.includes(mimeLower)) {
      return { type: 'pdf', canPreview: true }
    }
    if (textMimes.includes(mimeLower)) {
      return { type: 'text', canPreview: true }
    }
    if (videoMimes.includes(mimeLower)) {
      return { type: 'video', canPreview: true }
    }
    if (audioMimes.includes(mimeLower)) {
      return { type: 'audio', canPreview: true }
    }
    if (officeMimes.includes(mimeLower)) {
      return { type: 'office', canPreview: true }
    }
  }

  // Fallback to extension
  if (imageExtensions.includes(extension)) {
    return { type: 'image', canPreview: true }
  }
  if (pdfExtensions.includes(extension)) {
    return { type: 'pdf', canPreview: true }
  }
  if (textExtensions.includes(extension)) {
    return { type: 'text', canPreview: true }
  }
  if (videoExtensions.includes(extension)) {
    return { type: 'video', canPreview: true }
  }
  if (audioExtensions.includes(extension)) {
    return { type: 'audio', canPreview: true }
  }
  if (officeExtensions.includes(extension)) {
    return { type: 'office', canPreview: true }
  }

  return { type: 'other', canPreview: false }
}
