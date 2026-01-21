import { useMemo } from 'react'

const RECENT_SEARCHES_KEY = 'email_app_recent_searches'
const MAX_RECENT_SEARCHES = 10
const MAX_SUGGESTIONS = 5

/**
 * Get recent searches from localStorage
 */
function getRecentSearches() {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error reading recent searches:', error)
    return []
  }
}

/**
 * Save a search query to recent searches
 */
function saveRecentSearch(query) {
  if (!query || !query.trim()) return
  
  try {
    const recent = getRecentSearches()
    const trimmedQuery = query.trim()
    
    // Remove if already exists
    const filtered = recent.filter(q => q.toLowerCase() !== trimmedQuery.toLowerCase())
    
    // Add to beginning
    const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving recent search:', error)
  }
}

/**
 * Extract unique contacts (sender names/emails) from emails
 */
function extractContacts(emails) {
  if (!emails || !Array.isArray(emails)) return []
  
  const contacts = new Map()
  
  emails.forEach(email => {
    if (email.senderName && email.senderName.trim()) {
      const name = email.senderName.trim()
      if (!contacts.has(name.toLowerCase())) {
        contacts.set(name.toLowerCase(), {
          type: 'contact',
          text: name,
          original: name,
        })
      }
    }
    
    if (email.senderEmail && email.senderEmail.trim()) {
      const emailAddr = email.senderEmail.trim()
      if (!contacts.has(emailAddr.toLowerCase())) {
        contacts.set(emailAddr.toLowerCase(), {
          type: 'contact',
          text: emailAddr,
          original: emailAddr,
        })
      }
    }
    
    if (email.from && email.from.trim()) {
      const from = email.from.trim()
      const nameMatch = from.match(/^(.+?)\s*<(.+)>$/);
      if (nameMatch) {
        const name = nameMatch[1].trim().replace(/^["']|["']$/g, '')
        if (name && !contacts.has(name.toLowerCase())) {
          contacts.set(name.toLowerCase(), {
            type: 'contact',
            text: name,
            original: name,
          })
        }
      } else if (!contacts.has(from.toLowerCase())) {
        contacts.set(from.toLowerCase(), {
          type: 'contact',
          text: from,
          original: from,
        })
      }
    }
  })
  
  return Array.from(contacts.values())
}

/**
 * Extract keywords from email subjects
 */
function extractKeywords(emails) {
  if (!emails || !Array.isArray(emails)) return []
  
  const wordCount = new Map()
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 're', 'fw', 'fwd', 'subject', 'email',
  ])
  
  emails.forEach(email => {
    if (!email.subject) return
    
    const words = email.subject
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
    
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
  })
  
  const keywords = Array.from(wordCount.entries())
    .filter(([word, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => ({
      type: 'keyword',
      text: word,
      original: word,
    }))
  
  return keywords
}

/**
 * Filter and rank suggestions based on query
 */
function filterAndRankSuggestions(suggestions, query) {
  if (!query || !query.trim()) {
    return suggestions.filter(s => s.type === 'recent').slice(0, MAX_SUGGESTIONS)
  }
  
  const lowerQuery = query.toLowerCase().trim()
  
  const scored = suggestions.map(suggestion => {
    const lowerText = suggestion.text.toLowerCase()
    let score = 0
    
    if (lowerText === lowerQuery) {
      score = 1000
    }
    else if (lowerText.startsWith(lowerQuery)) {
      score = 500
    }
    else if (lowerText.includes(lowerQuery)) {
      score = 100
    }
    else {
      score = 0
    }
    
    if (suggestion.type === 'contact') {
      score += 50
    }
    
    if (suggestion.type === 'recent') {
      score += 25
    }
    
    return { ...suggestion, score }
  })
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ score, ...rest }) => rest)
}

/**
 * Hook to generate search suggestions
 */
export function useSearchSuggestions(emails, query) {
  const suggestions = useMemo(() => {
    if (!emails || !Array.isArray(emails)) {
      return []
    }
    
    const contacts = extractContacts(emails)
    const keywords = extractKeywords(emails)
    
    const recentSearches = getRecentSearches().map(search => ({
      type: 'recent',
      text: search,
      original: search,
    }))
    
    const allSuggestions = [
      ...contacts,
      ...keywords,
      ...recentSearches,
    ]
    
    return filterAndRankSuggestions(allSuggestions, query)
  }, [emails, query])
  
  return {
    suggestions,
    saveRecentSearch,
  }
}

