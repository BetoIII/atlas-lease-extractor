"use client"

import { useState } from "react"
import { useToast } from "./use-toast"

export interface ShareEvent {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    invitationId?: string
    datasetId?: string
    recipientEmailHash?: string
    emailTxId?: string
    txHash?: string
    explorerUrl?: string
    tokenId?: string
    perms?: string
    expiresAt?: string
    message?: string
  }
}

export interface ShareState {
  isActive: boolean
  currentStep: number
  events: ShareEvent[]
  isComplete: boolean
  invitationId?: string
  datasetId?: string
  sharedEmails: string[]
}

interface UseSharingProps {
  uploadedFile?: File | null
}

export function useSharing({ uploadedFile }: UseSharingProps) {
  const { toast } = useToast()
  
  // Sharing state
  const [shareState, setShareState] = useState<ShareState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
    sharedEmails: [],
  })
  
  // UI state
  const [showSharingDrawer, setShowSharingDrawer] = useState(false)
  const [showSharingDialog, setShowSharingDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate sharing JSON for display
  const getSharingJson = () => {
    if (!shareState.invitationId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        invitation_id: shareState.invitationId,
        dataset_id: shareState.datasetId,
        shared_timestamp: shareState.events.find(e => e.name === 'InvitationEmailSent')?.timestamp || new Date().toISOString(),
        recipients: shareState.sharedEmails,
        permissions: {
          read: true,
          comment: false,
          download: false,
        },
        expiration: null,
        status: "invitation_sent",
        blockchain_anchor: {
          chain: "Ethereum",
          events_logged: shareState.events.filter(e => e.status === 'completed').length,
        },
      },
      null,
      2,
    )
  }

  // Generate mock sharing data
  const generateMockSharingData = (sharedEmails: string[]) => {
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const invitationId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const emailTxId = `email-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const recipientEmailHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    return {
      datasetId,
      invitationId,
      emailTxId,
      recipientEmailHash,
      txHash,
      explorerUrl,
      expiresAt,
      sharedEmails,
    }
  }

  // Create sharing events (only first 2 events for initial share)
  const createSharingEvents = (
    mockData: ReturnType<typeof generateMockSharingData>
  ): ShareEvent[] => {
    const { datasetId, invitationId, emailTxId, recipientEmailHash, txHash, explorerUrl, expiresAt, sharedEmails } = mockData

    return [
      {
        id: 1,
        name: 'ShareInvitationCreated',
        status: 'pending',
        details: {
          datasetId,
          invitationId,
          recipientEmailHash,
          perms: 'read',
          expiresAt,
          message: `Share invitation created for ${sharedEmails.length} recipient${sharedEmails.length > 1 ? 's' : ''}`
        }
      },
      {
        id: 2,
        name: 'InvitationEmailSent',
        status: 'pending',
        details: {
          invitationId,
          emailTxId,
          message: `Email invitations dispatched to ${sharedEmails.join(', ')}`
        }
      },
      // Future events that will be triggered by recipient actions
      // {
      //   id: 3,
      //   name: 'InvitationAccepted',
      //   status: 'pending',
      //   details: {
      //     invitationId,
      //     message: 'Partner accepts invitation and signs with wallet'
      //   }
      // },
      // {
      //   id: 4,
      //   name: 'AccessTokenGranted',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     tokenId: '1',
      //     perms: 'read',
      //     message: 'ERC-20 datatoken minted and delegated for read access'
      //   }
      // },
      // {
      //   id: 5,
      //   name: 'DatasetViewed',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     message: 'Optional analytics ping when data is accessed'
      //   }
      // },
      // {
      //   id: 6,
      //   name: 'AccessRevoked',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     message: 'Access can be revoked by document owner'
      //   }
      // }
    ]
  }

  // Handle document sharing with simulated backend events
  const handleShareDocument = async (sharedEmails: string[]) => {
    if (sharedEmails.length === 0) return
    
    // Generate mock data
    const mockData = generateMockSharingData(sharedEmails)
    const events = createSharingEvents(mockData)
    
    // Initialize sharing state
    setShareState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
      sharedEmails,
    })
    setShowSharingDrawer(true)

    // Initialize with all events pending
    setShareState(prev => ({
      ...prev,
      events: events,
      invitationId: mockData.invitationId,
      datasetId: mockData.datasetId,
    }))

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Update event to processing
      setShareState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

      // Update event to completed
      setShareState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'ShareInvitationCreated') {
        toast({
          title: "Share Invitation Created",
          description: `Invitation created for ${sharedEmails.length} recipient${sharedEmails.length > 1 ? 's' : ''}`,
        })
      } else if (event.name === 'InvitationEmailSent') {
        toast({
          title: "✓ Invitations Sent",
          description: `Email invitations sent to ${sharedEmails.length} recipient${sharedEmails.length > 1 ? 's' : ''}`,
        })
      }
    }

    // Mark sharing as complete (for the initial phase)
    setShareState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }))

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowSharingDialog(true)
    }, 500)
  }

  // Reset sharing state
  const resetSharingState = () => {
    setShareState({
      isActive: false,
      currentStep: 0,
      events: [],
      isComplete: false,
      sharedEmails: [],
    })
    setShowSharingDrawer(false)
    setShowSharingDialog(false)
  }

  return {
    // State
    shareState,
    showSharingDrawer,
    showSharingDialog,
    copySuccess,
    
    // Actions
    handleShareDocument,
    handleCopyToClipboard,
    getSharingJson,
    setShowSharingDrawer,
    setShowSharingDialog,
    resetSharingState,
  }
} 