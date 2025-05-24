import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nanoid() {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Format a date string to a more readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

/**
 * Convert bytes to a human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

/**
 * Calculate the reading time for a text
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Chunk text into smaller pieces for better embedding
 * This is a sophisticated implementation that respects document structure
 */
export function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChunkSize, text.length)

    if (endIndex < text.length) {
      const possibleBreakpoints = [
        text.lastIndexOf(". ", endIndex),
        text.lastIndexOf("! ", endIndex),
        text.lastIndexOf("? ", endIndex),
        text.lastIndexOf("\n\n", endIndex),
      ].filter((bp) => bp > startIndex)

      if (possibleBreakpoints.length > 0) {
        endIndex = Math.max(...possibleBreakpoints) + 1
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim()
    if (chunk.length === 0) break // prevent infinite loop on empty chunk
    
    const cleanChunk = cleanString(chunk);
    chunks.push(cleanChunk)

    const nextStartIndex = endIndex - overlap
    // Always move forward
    startIndex = nextStartIndex > startIndex ? nextStartIndex : endIndex
  }
  
  // Usage before indexing
  
  // then send cleanContent instead of chunk.content
  
  
  return chunks
}

function cleanString(input: string): string {
  // Remove all control characters except newline (\n) and tab (\t)
  return input.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
}