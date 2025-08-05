"use client"

import { useState } from "react"
import { useToast } from "@/components/ui"

// External sharing event types
export interface ExternalSharingEvent {
  id: string
  name: string
  timestamp: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  details?: {
    message?: string
    recipient?: string
    [key: string]: any
  }
}

// External sharing state interface
export interface ExternalShareState {
  isActive: boolean
  currentStep: number
  events: ExternalSharingEvent[]
  isComplete: boolean
  sharedEmails: string[]
  expirationDate?: Date
  allowDownloads: boolean
  shareAllData: boolean
  sharedFields: Record<string, boolean>
  datasetId?: string
  invitationId?: string
  sharingInstances: ExternalSharingInstance[]
}

// Individual sharing instance
export interface ExternalSharingInstance {
  id: string
  emails: string[]
  timestamp: string
  expirationDate?: Date
  allowDownloads: boolean
  shareAllData: boolean
  sharedFields: Record<string, boolean>
  status: 'active' | 'expired' | 'revoked'
}

interface UseExternalSharingProps {
  uploadedFile?: File | null
}

export function useExternalSharing({ uploadedFile }: UseExternalSharingProps) {
  const { toast } = useToast()
  
  // External sharing state
  const [externalShareState, setExternalShareState] = useState<ExternalShareState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
    sharedEmails: [],
    allowDownloads: false,
    shareAllData: true,
    sharedFields: {},
    sharingInstances: [],
  })
  
  // UI state
  const [showExternalSharingDrawer, setShowExternalSharingDrawer] = useState(false)
  const [showExternalSharingDialog, setShowExternalSharingDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate external sharing JSON for display
  const getExternalSharingJson = () => {
    if (!externalShareState.invitationId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        invitation_id: externalShareState.invitationId,
        dataset_id: externalShareState.datasetId,
        shared_timestamp: externalShareState.events.find(e => e.name === 'InvitationEmailSent')?.timestamp || new Date().toISOString(),
        recipients: externalShareState.sharedEmails,
        permissions: {
          read: true,
          comment: false,
          download: externalShareState.allowDownloads,
        },
        expiration: externalShareState.expirationDate?.toISOString() || null,
        data_access: externalShareState.shareAllData ? 'full' : 'partial',
        shared_fields: externalShareState.shareAllData ? null : externalShareState.sharedFields,
        status: "invitation_sent",
        blockchain_anchor: {
          chain: "Ethereum",
          events_logged: externalShareState.events.filter(e => e.status === 'completed').length,
        },
      },
      null,
      2,
    )
  }

  // Generate mock external sharing data
  const generateMockExternalSharingData = (
    sharedEmails: string[], 
    expirationDate?: Date,
    allowDownloads?: boolean,
    shareAllData?: boolean,
    sharedFields?: Record<string, boolean>
  ) => {
    const timestamp = new Date().toISOString()
    const datasetId = `ds_${Math.random().toString(36).substr(2, 9)}`
    const invitationId = `inv_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      datasetId,
      invitationId,
      sharedEmails,
      expirationDate,
      allowDownloads: allowDownloads || false,
      shareAllData: shareAllData !== false,
      sharedFields: sharedFields || {},
      timestamp,
    }
  }

  const createExternalSharingEvents = (
    mockData: ReturnType<typeof generateMockExternalSharingData>
  ): ExternalSharingEvent[] => {
    const baseTimestamp = new Date()
    
    return [
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'ExternalShareInitiated',
        timestamp: new Date(baseTimestamp.getTime()).toISOString(),
        status: 'pending' as const,
        details: {
          message: `Initiating external share with ${mockData.sharedEmails.length} recipient${mockData.sharedEmails.length > 1 ? 's' : ''}`,
          recipients: mockData.sharedEmails,
        }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'DatasetPrepared',
        timestamp: new Date(baseTimestamp.getTime() + 1000).toISOString(),
        status: 'pending' as const,
        details: {
          message: 'Preparing dataset for external sharing',
          dataset_id: mockData.datasetId,
          data_access: mockData.shareAllData ? 'full' : 'partial',
          download_enabled: mockData.allowDownloads,
        }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'AccessControlsConfigured',
        timestamp: new Date(baseTimestamp.getTime() + 2000).toISOString(),
        status: 'pending' as const,
        details: {
          message: 'Configuring access controls and permissions',
          expiration: mockData.expirationDate?.toISOString() || 'none',
          download_permission: mockData.allowDownloads,
        }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'ExternalInvitationCreated',
        timestamp: new Date(baseTimestamp.getTime() + 3000).toISOString(),
        status: 'pending' as const,
        details: {
          message: 'Creating external sharing invitation',
          invitation_id: mockData.invitationId,
          recipients: mockData.sharedEmails,
        }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'InvitationEmailSent',
        timestamp: new Date(baseTimestamp.getTime() + 4000).toISOString(),
        status: 'pending' as const,
        details: {
          message: `External sharing invitations sent to ${mockData.sharedEmails.length} recipient${mockData.sharedEmails.length > 1 ? 's' : ''}`,
          recipients: mockData.sharedEmails,
        }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        name: 'BlockchainAnchor',
        timestamp: new Date(baseTimestamp.getTime() + 5000).toISOString(),
        status: 'pending' as const,
        details: {
          message: 'Anchoring external sharing event to blockchain',
          chain: 'Ethereum',
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        }
      },
    ]
  }

  // Handle external sharing with simulated backend events
  const handleShareWithExternal = async (
    sharedEmails: string[],
    expirationDate?: Date,
    allowDownloads?: boolean,
    shareAllData?: boolean,
    sharedFields?: Record<string, boolean>
  ) => {
    if (sharedEmails.length === 0) return

    // Generate mock data and events
    const mockData = generateMockExternalSharingData(sharedEmails, expirationDate, allowDownloads, shareAllData, sharedFields)
    const events = createExternalSharingEvents(mockData)

    // Set initial state with all events as pending
    setExternalShareState(prev => ({
      ...prev,
      isActive: true,
      isComplete: false,
      currentStep: 0,
      events: events,
      sharedEmails,
      expirationDate,
      allowDownloads: allowDownloads || false,
      shareAllData: shareAllData !== false,
      sharedFields: sharedFields || {},
      datasetId: mockData.datasetId,
      invitationId: mockData.invitationId,
    }))

    // Open the drawer to show live progress
    setShowExternalSharingDrawer(true)

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
      
      // Mark current event as in progress
      setExternalShareState(prev => ({
        ...prev,
        currentStep: i,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'in_progress' as const }
            : e
        )
      }))

      // Short delay for in-progress state
      await new Promise(resolve => setTimeout(resolve, 300))

      // Mark current event as completed
      setExternalShareState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'ExternalInvitationCreated') {
        toast({
          title: "External Invitation Created",
          description: `Invitation created for ${sharedEmails.length} external recipient${sharedEmails.length > 1 ? 's' : ''}`,
        })
      } else if (event.name === 'InvitationEmailSent') {
        toast({
          title: "✓ External Invitations Sent",
          description: `Email invitations sent to ${sharedEmails.length} external recipient${sharedEmails.length > 1 ? 's' : ''}`,
        })
      }
    }

    // Create sharing instance
    const newInstance: ExternalSharingInstance = {
      id: `inst_${Math.random().toString(36).substr(2, 9)}`,
      emails: sharedEmails,
      timestamp: new Date().toISOString(),
      expirationDate,
      allowDownloads: allowDownloads || false,
      shareAllData: shareAllData !== false,
      sharedFields: sharedFields || {},
      status: 'active',
    }

    // Mark sharing as complete and add instance
    setExternalShareState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length,
      sharingInstances: [...prev.sharingInstances, newInstance],
    }))

    // Show success dialog after a brief delay and close drawer
    setTimeout(() => {
      setShowExternalSharingDrawer(false)
      setShowExternalSharingDialog(true)
    }, 500)
  }

  // Reset external sharing state
  const resetExternalSharingState = () => {
    setExternalShareState({
      isActive: false,
      currentStep: 0,
      events: [],
      isComplete: false,
      sharedEmails: [],
      allowDownloads: false,
      shareAllData: true,
      sharedFields: {},
      sharingInstances: [],
    })
    setShowExternalSharingDrawer(false)
    setShowExternalSharingDialog(false)
  }

  // Update external sharing state
  const updateExternalShareState = (updates: Partial<ExternalShareState>) => {
    setExternalShareState(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Add a new sharing instance (for multiple shares)
  const addSharingInstance = (
    emails: string[],
    expirationDate?: Date,
    allowDownloads?: boolean,
    shareAllData?: boolean,
    sharedFields?: Record<string, boolean>
  ) => {
    const newInstance: ExternalSharingInstance = {
      id: `inst_${Math.random().toString(36).substr(2, 9)}`,
      emails,
      timestamp: new Date().toISOString(),
      expirationDate,
      allowDownloads: allowDownloads || false,
      shareAllData: shareAllData !== false,
      sharedFields: sharedFields || {},
      status: 'active',
    }

    setExternalShareState(prev => ({
      ...prev,
      sharingInstances: [...prev.sharingInstances, newInstance],
    }))
  }

  return {
    // State
    externalShareState,
    showExternalSharingDrawer,
    showExternalSharingDialog,
    copySuccess,
    
    // Actions
    handleShareWithExternal,
    handleCopyToClipboard,
    getExternalSharingJson,
    setShowExternalSharingDrawer,
    setShowExternalSharingDialog,
    resetExternalSharingState,
    updateExternalShareState,
    addSharingInstance,
  }
}