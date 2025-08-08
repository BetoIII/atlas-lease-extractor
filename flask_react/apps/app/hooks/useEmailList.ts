import { useState } from "react"

export function useEmailList() {
  const [emailInput, setEmailInput] = useState("")
  const [sharedEmails, setSharedEmails] = useState<string[]>([])

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle adding email to the list
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase()
    if (trimmedEmail && isValidEmail(trimmedEmail) && !sharedEmails.includes(trimmedEmail)) {
      setSharedEmails([...sharedEmails, trimmedEmail])
      setEmailInput("")
    }
  }

  // Handle removing email from the list
  const handleRemoveEmail = (emailToRemove: string) => {
    setSharedEmails(sharedEmails.filter(email => email !== emailToRemove))
  }

  // Handle Enter key press in email input
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  // Clear all emails
  const clearEmails = () => {
    setSharedEmails([])
    setEmailInput("")
  }

  return {
    emailInput,
    setEmailInput,
    sharedEmails,
    setSharedEmails,
    isValidEmail,
    handleAddEmail,
    handleRemoveEmail,
    handleEmailKeyPress,
    clearEmails
  }
} 