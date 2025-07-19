"use client"

import { useState } from "react"
import { useToast } from "@/components/ui"

export interface FirmShareEvent {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    datasetId?: string
    sharerAddr?: string
    firmId?: string
    perms?: string
    expiresAt?: string
    memberCount?: number
    batchId?: string
    groupTokenId?: string
    walletAddr?: string
    emailHash?: string
    viewerAddr?: string
    reason?: string
    txHash?: string
    explorerUrl?: string
    message?: string
  }
}

export interface FirmShareState {
  isActive: boolean
  currentStep: number
  events: FirmShareEvent[]
  isComplete: boolean
  datasetId?: string
  firmId?: string
  memberCount: number
  batchId?: string
}

interface UseFirmSharingProps {
  uploadedFile?: File | null
}

export function useFirmSharing({ uploadedFile }: UseFirmSharingProps) {
  const { toast } = useToast()
  
  // Firm sharing state
  const [firmShareState, setFirmShareState] = useState<FirmShareState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
    memberCount: 0,
  })
  
  // UI state
  const [showFirmSharingDrawer, setShowFirmSharingDrawer] = useState(false)
  const [showFirmSharingDialog, setShowFirmSharingDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate firm sharing JSON for display
  const getFirmSharingJson = () => {
    if (!firmShareState.datasetId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        dataset_id: firmShareState.datasetId,
        firm_id: firmShareState.firmId,
        share_timestamp: firmShareState.events.find(e => e.name === 'BulkEmailSent')?.timestamp || new Date().toISOString(),
        share_type: "firm_wide",
        member_count: firmShareState.memberCount,
        batch_id: firmShareState.batchId,
        permissions: {
          read: true,
          comment: true,
          download: false,
        },
        access_method: "scim_managed",
        token_type: "ERC-1155_group_token",
        group_token_id: 600,
        expiration: null,
        status: "bulk_invitations_sent",
        blockchain_anchor: {
          chain: "Ethereum",
          events_logged: firmShareState.events.filter(e => e.status === 'completed').length,
        },
      },
      null,
      2,
    )
  }

  // Generate mock firm sharing data
  const generateMockFirmSharingData = () => {
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const firmId = `firm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const sharerAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const batchId = `batch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const memberCount = Math.floor(Math.random() * 50) + 15 // Random between 15-65 members
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now

    return {
      datasetId,
      firmId,
      sharerAddr,
      batchId,
      memberCount,
      txHash,
      explorerUrl,
      expiresAt,
    }
  }

  // Create firm sharing events (only first 3 events for initial firm share)
  const createFirmSharingEvents = (
    mockData: ReturnType<typeof generateMockFirmSharingData>
  ): FirmShareEvent[] => {
    const { datasetId, firmId, sharerAddr, batchId, memberCount, expiresAt } = mockData

    return [
      {
        id: 1,
        name: 'FirmWideShareInitiated',
        status: 'pending',
        details: {
          datasetId,
          sharerAddr,
          firmId,
          perms: 'read,comment',
          expiresAt,
          message: `Firm-wide sharing initiated for ${memberCount} active members`
        }
      },
      {
        id: 2,
        name: 'BulkInvitationQueued',
        status: 'pending',
        details: {
          datasetId,
          firmId,
          memberCount,
          message: `Bulk invitations queued for all ${memberCount} active firm members from SCIM directory`
        }
      },
      {
        id: 3,
        name: 'BulkEmailSent',
        status: 'pending',
        details: {
          batchId,
          datasetId,
          memberCount,
          message: `Batch email notifications sent to ${memberCount} firm members`
        }
      },
      // Future events that will be triggered by member actions
      // {
      //   id: 4,
      //   name: 'MemberWalletLinked',
      //   status: 'pending',
      //   details: {
      //     firmId,
      //     message: 'Each user links wallet to corp-email (fires per user)'
      //   }
      // },
      // {
      //   id: 5,
      //   name: 'GroupAccessTokenGranted',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     groupTokenId: '600',
      //     perms: 'read,comment',
      //     message: 'Single ERC-1155 token ID 600 granted to SCIM group address'
      //   }
      // },
      // {
      //   id: 6,
      //   name: 'DatasetViewed',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     message: 'Optional analytics ping when data is accessed'
      //   }
      // },
      // {
      //   id: 7,
      //   name: 'SCIMAutoRevoke',
      //   status: 'pending',
      //   details: {
      //     reason: 'user_removed_from_directory',
      //     message: 'Atlas detects user removal from directory; burns their portion of group token'
      //   }
      // }
    ]
  }

  // Handle firm-wide document sharing with simulated backend events
  const handleShareWithFirm = async () => {
    // Generate mock data
    const mockData = generateMockFirmSharingData()
    const events = createFirmSharingEvents(mockData)
    
    // Initialize firm sharing state
    setFirmShareState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
      memberCount: mockData.memberCount,
    })
    setShowFirmSharingDrawer(true)

    // Initialize with all events pending
    setFirmShareState(prev => ({
      ...prev,
      events: events,
      datasetId: mockData.datasetId,
      firmId: mockData.firmId,
      batchId: mockData.batchId,
    }))

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Update event to processing
      setFirmShareState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Simulate processing time (longer for bulk operations)
      const processingTime = event.name === 'BulkInvitationQueued' ? 2000 + Math.random() * 2000 : 1000 + Math.random() * 1500
      await new Promise(resolve => setTimeout(resolve, processingTime))

      // Update event to completed
      setFirmShareState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'FirmWideShareInitiated') {
        toast({
          title: "Firm-Wide Sharing Initiated",
          description: `Document sharing enabled for ${mockData.memberCount} firm members`,
        })
      } else if (event.name === 'BulkInvitationQueued') {
        toast({
          title: "✓ Bulk Invitations Queued",
          description: `Invitations prepared for all ${mockData.memberCount} active firm members`,
        })
      } else if (event.name === 'BulkEmailSent') {
        toast({
          title: "✓ Firm Notifications Sent",
          description: `Batch email sent to ${mockData.memberCount} firm members`,
        })
      }
    }

    // Mark firm sharing as complete (for the initial phase)
    setFirmShareState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }))

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowFirmSharingDialog(true)
    }, 500)
  }

  // Reset firm sharing state
  const resetFirmSharingState = () => {
    setFirmShareState({
      isActive: false,
      currentStep: 0,
      events: [],
      isComplete: false,
      memberCount: 0,
    })
    setShowFirmSharingDrawer(false)
    setShowFirmSharingDialog(false)
  }

  return {
    // State
    firmShareState,
    showFirmSharingDrawer,
    showFirmSharingDialog,
    copySuccess,
    
    // Actions
    handleShareWithFirm,
    handleCopyToClipboard,
    getFirmSharingJson,
    setShowFirmSharingDrawer,
    setShowFirmSharingDialog,
    resetFirmSharingState,
  }
} 