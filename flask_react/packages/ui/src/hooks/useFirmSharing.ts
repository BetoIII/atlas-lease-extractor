"use client"

import { useState } from "react"
import { useToast } from "./use-toast"
import { devLog } from "@/lib/dev-utils"

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
    adminEmail?: string
    isUserAdmin?: boolean
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
  adminEmail?: string
  isUserAdmin?: boolean
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

    const jsonData: any = {
      document_type: "Lease Agreement",
      dataset_id: firmShareState.datasetId,
      firm_id: firmShareState.firmId,
      share_timestamp: firmShareState.events.find(e => e.name === 'BulkEmailSent')?.timestamp || new Date().toISOString(),
      share_type: "firm_wide",
      member_count: firmShareState.memberCount,
      permissions: {
        read: true,
        comment: true,
        download: false,
      },
      access_method: "scim_managed",
      token_type: "ERC-1155_group_token",
      group_token_id: 600,
      expiration: null,
      status: firmShareState.adminEmail && !firmShareState.isUserAdmin ? "pending_admin_approval" : "bulk_invitations_sent",
      blockchain_anchor: {
        chain: "Ethereum",
        events_logged: firmShareState.events.filter(e => e.status === 'completed').length,
      },
    };

    // Add admin information if available
    if (firmShareState.adminEmail) {
      jsonData.firm_admin = {
        email: firmShareState.adminEmail,
        is_current_user: firmShareState.isUserAdmin || false,
        approval_status: firmShareState.isUserAdmin ? "self_approved" : "pending"
      };
    }

    return JSON.stringify(jsonData, null, 2)
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

  // Create firm sharing events (complete firm-wide sharing workflow)
  const createFirmSharingEvents = (
    mockData: ReturnType<typeof generateMockFirmSharingData>,
    adminEmail?: string,
    isUserAdmin?: boolean
  ): FirmShareEvent[] => {
    const { datasetId, firmId, sharerAddr, batchId, memberCount, expiresAt, txHash, explorerUrl } = mockData

    const adminInfo = adminEmail ? {
      adminEmail,
      isUserAdmin: isUserAdmin || false
    } : {};

    return [
      {
        id: 1,
        name: 'FirmDirectoryQueried',
        status: 'pending',
        details: {
          firmId,
          memberCount,
          ...adminInfo,
          message: 'SCIM directory queried for active firm members'
        }
      },
      {
        id: 2,
        name: 'FirmWideShareInitiated',
        status: 'pending',
        details: {
          datasetId,
          sharerAddr,
          firmId,
          perms: 'read,comment',
          expiresAt,
          memberCount,
          ...adminInfo,
          message: adminEmail && !isUserAdmin 
            ? `Firm-wide sharing initiated for ${memberCount} active members (pending admin approval from ${adminEmail})`
            : `Firm-wide sharing initiated for ${memberCount} active members`
        }
      },
      {
        id: 3,
        name: 'BulkInvitationQueued',
        status: 'pending',
        details: {
          datasetId,
          firmId,
          memberCount,
          batchId,
          ...adminInfo,
          message: `Bulk invitations queued for all ${memberCount} active firm members from SCIM directory`
        }
      },
      {
        id: 4,
        name: 'BatchNotificationSent',
        status: 'pending',
        details: {
          batchId,
          datasetId,
          memberCount,
          ...adminInfo,
          message: adminEmail && !isUserAdmin
            ? `Admin approval notification sent to ${adminEmail}`
            : `Batch email notifications sent to ${memberCount} firm members`
        }
      },
      {
        id: 5,
        name: 'GroupTokenMinted',
        status: 'pending',
        details: {
          datasetId,
          firmId,
          groupTokenId: '600',
          perms: 'read,comment',
          txHash,
          explorerUrl,
          message: 'ERC-1155 group access token minted for firm'
        }
      },
      {
        id: 6,
        name: 'BlockchainAnchor',
        status: 'pending',
        details: {
          txHash,
          explorerUrl,
          firmId,
          memberCount,
          message: 'Firm sharing event anchored to blockchain for immutability'
        }
      }
    ]
  }

  // Handle firm-wide document sharing with simulated backend events
  const handleShareWithFirm = async (adminEmail?: string, isUserAdmin?: boolean) => {
    // Generate mock data
    const mockData = generateMockFirmSharingData()
    
    // Use passed parameters or fall back to current state
    const currentAdminEmail = adminEmail !== undefined ? adminEmail : firmShareState.adminEmail
    const currentIsUserAdmin = isUserAdmin !== undefined ? isUserAdmin : firmShareState.isUserAdmin
    
    devLog.debug('🔍 Firm sharing workflow starting with:', { 
      adminEmail: currentAdminEmail, 
      isUserAdmin: currentIsUserAdmin,
      passedAdminEmail: adminEmail,
      passedIsUserAdmin: isUserAdmin 
    });
    
    const events = createFirmSharingEvents(mockData, currentAdminEmail, currentIsUserAdmin)
    
    // Initialize firm sharing state
    setFirmShareState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
      memberCount: mockData.memberCount,
      adminEmail: currentAdminEmail,
      isUserAdmin: currentIsUserAdmin,
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
      if (event.name === 'FirmDirectoryQueried') {
        toast({
          title: "Directory Queried",
          description: `Found ${mockData.memberCount} active firm members in SCIM directory`,
        })
      } else if (event.name === 'FirmWideShareInitiated') {
        toast({
          title: "Firm-Wide Sharing Initiated",
          description: `Document sharing enabled for ${mockData.memberCount} firm members`,
        })
      } else if (event.name === 'BatchNotificationSent') {
        toast({
          title: "✓ Firm Notifications Sent",
          description: `Batch notifications sent to ${mockData.memberCount} firm members`,
        })
      } else if (event.name === 'GroupTokenMinted') {
        toast({
          title: "✓ Group Access Token Created",
          description: `ERC-1155 group token minted for firm access`,
        })
      }
    }

    // Mark firm sharing as complete (for the initial phase)
    setFirmShareState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length,
      events: prev.events, // Explicitly preserve the events array
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

  // Update firm sharing state with admin info
  const updateFirmShareState = (updates: Partial<FirmShareState>) => {
    setFirmShareState(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Get completed ledger events for storing in backend
  const getCompletedLedgerEvents = () => {
    return firmShareState.events
      .filter(event => event.status === 'completed')
      .map(event => ({
        id: event.id,
        name: event.name,
        status: event.status,
        timestamp: event.timestamp,
        details: event.details
      }))
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
    getCompletedLedgerEvents,
    setShowFirmSharingDrawer,
    setShowFirmSharingDialog,
    resetFirmSharingState,
    updateFirmShareState,
  }
} 