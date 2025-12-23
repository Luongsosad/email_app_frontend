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
    // Extract sender name
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
    
    // Extract sender email (if different from name)
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
    
    // Also check 'from' field if available
    if (email.from && email.from.trim()) {
      const from = email.from.trim()
      // Try to extract name from "Name <email@example.com>" format
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
  
  // Get top keywords (appearing in at least 2 emails)
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
    // If no query, return recent searches only
    return suggestions.filter(s => s.type === 'recent').slice(0, MAX_SUGGESTIONS)
  }
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Score each suggestion
  const scored = suggestions.map(suggestion => {
    const lowerText = suggestion.text.toLowerCase()
    let score = 0
    
    // Exact match gets highest score
    if (lowerText === lowerQuery) {
      score = 1000
    }
    // Starts with query
    else if (lowerText.startsWith(lowerQuery)) {
      score = 500
    }
    // Contains query
    else if (lowerText.includes(lowerQuery)) {
      score = 100
    }
    // No match
    else {
      score = 0
    }
    
    // Boost contacts over keywords
    if (suggestion.type === 'contact') {
      score += 50
    }
    
    // Boost recent searches
    if (suggestion.type === 'recent') {
      score += 25
    }
    
    return { ...suggestion, score }
  })
  
  // Filter out non-matching and sort by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ score, ...rest }) => rest) // Remove score from result
}

/**
 * Hook to generate search suggestions
 */
export function useSearchSuggestions(emails, query) {
  const suggestions = useMemo(() => {
    if (!emails || !Array.isArray(emails)) {
      return []
    }
    
    // Extract contacts and keywords from emails
    const contacts = extractContacts(emails)
    const keywords = extractKeywords(emails)
    
    // Get recent searches
    const recentSearches = getRecentSearches().map(search => ({
      type: 'recent',
      text: search,
      original: search,
    }))
    
    // Combine all suggestions
    const allSuggestions = [
      ...contacts,
      ...keywords,
      ...recentSearches,
    ]
    
    // Filter and rank based on query
    return filterAndRankSuggestions(allSuggestions, query)
  }, [emails, query])
  
  return {
    suggestions,
    saveRecentSearch,
  }
}

