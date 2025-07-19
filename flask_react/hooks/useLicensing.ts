"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export interface LicenseEvent {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    datasetId?: string
    offerId?: string
    licensorAddr?: string
    templateId?: string
    price?: string
    currency?: string
    exclusivity?: string
    duration?: string
    recipientEmailHash?: string
    licenseId?: string
    amount?: string
    expiry?: string
    txHash?: string
    explorerUrl?: string
    message?: string
  }
}

export interface LicenseState {
  isActive: boolean
  currentStep: number
  events: LicenseEvent[]
  isComplete: boolean
  offerId?: string
  datasetId?: string
  licensedEmails: string[]
  monthlyFee: number
}

interface UseLicensingProps {
  uploadedFile?: File | null
}

export function useLicensing({ uploadedFile }: UseLicensingProps) {
  const { toast } = useToast()
  
  // Licensing state
  const [licenseState, setLicenseState] = useState<LicenseState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
    licensedEmails: [],
    monthlyFee: 0,
  })
  
  // UI state
  const [showLicensingDrawer, setShowLicensingDrawer] = useState(false)
  const [showLicensingDialog, setShowLicensingDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate licensing JSON for display
  const getLicensingJson = () => {
    if (!licenseState.offerId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        offer_id: licenseState.offerId,
        dataset_id: licenseState.datasetId,
        license_timestamp: licenseState.events.find(e => e.name === 'OfferEmailSent')?.timestamp || new Date().toISOString(),
        licensees: licenseState.licensedEmails,
        terms: {
          price: licenseState.monthlyFee,
          currency: "USD",
          duration: "monthly",
          exclusivity: "non-exclusive",
          template: "A16Z Can't Be Evil",
        },
        permissions: {
          read: true,
          comment: false,
          download: true,
          redistribute: false,
        },
        revenue_sharing: {
          licensor_share: 0.85,
          platform_fee: 0.15,
        },
        status: "offer_published",
        blockchain_anchor: {
          chain: "Ethereum",
          events_logged: licenseState.events.filter(e => e.status === 'completed').length,
        },
      },
      null,
      2,
    )
  }

  // Generate mock licensing data
  const generateMockLicensingData = (licensedEmails: string[], monthlyFee: number) => {
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const offerId = `offer-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const licensorAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const templateId = "a16z-cant-be-evil-v1"
    const recipientEmailHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`

    return {
      datasetId,
      offerId,
      licensorAddr,
      templateId,
      price: monthlyFee.toString(),
      currency: "USD",
      exclusivity: "non-exclusive",
      duration: "monthly",
      recipientEmailHash,
      txHash,
      explorerUrl,
      licensedEmails,
    }
  }

  // Create licensing events (only first 2 events for initial license creation)
  const createLicensingEvents = (
    mockData: ReturnType<typeof generateMockLicensingData>
  ): LicenseEvent[] => {
    const { datasetId, offerId, licensorAddr, templateId, price, currency, exclusivity, duration, recipientEmailHash, licensedEmails } = mockData

    return [
      {
        id: 1,
        name: 'LicenseOfferCreated',
        status: 'pending',
        details: {
          datasetId,
          offerId,
          licensorAddr,
          templateId,
          price: `$${price}/month`,
          currency,
          exclusivity,
          duration,
          message: `License offer created for ${licensedEmails.length} potential licensee${licensedEmails.length > 1 ? 's' : ''} at $${price}/month`
        }
      },
      {
        id: 2,
        name: 'OfferEmailSent',
        status: 'pending',
        details: {
          offerId,
          recipientEmailHash,
          message: `License offer notifications sent to ${licensedEmails.join(', ')}`
        }
      },
      // Future events that will be triggered by licensee actions
      // {
      //   id: 3,
      //   name: 'LicenseViewed',
      //   status: 'pending',
      //   details: {
      //     offerId,
      //     message: 'Prospective licensee inspects terms'
      //   }
      // },
      // {
      //   id: 4,
      //   name: 'LicenseAccepted',
      //   status: 'pending',
      //   details: {
      //     offerId,
      //     message: 'Licensee signs offer'
      //   }
      // },
      // {
      //   id: 5,
      //   name: 'PaymentEscrowed',
      //   status: 'pending',
      //   details: {
      //     offerId,
      //     amount: price,
      //     message: 'Funds received in escrow'
      //   }
      // },
      // {
      //   id: 6,
      //   name: 'LicenseNFTMinted',
      //   status: 'pending',
      //   details: {
      //     datasetId,
      //     message: 'ERC-4907 NFT minted with expiry date'
      //   }
      // },
      // {
      //   id: 7,
      //   name: 'RevenueDistributed',
      //   status: 'pending',
      //   details: {
      //     amount: (parseFloat(price) * 0.85).toFixed(2),
      //     message: 'Atlas releases funds to licensor'
      //   }
      // },
      // {
      //   id: 8,
      //   name: 'LicenseExpired',
      //   status: 'pending',
      //   details: {
      //     message: 'Automatic cleanup when license expires'
      //   }
      // }
    ]
  }

  // Handle document licensing with simulated backend events
  const handleCreateLicense = async (licensedEmails: string[], monthlyFee: number) => {
    if (licensedEmails.length === 0) return
    
    // Generate mock data
    const mockData = generateMockLicensingData(licensedEmails, monthlyFee)
    const events = createLicensingEvents(mockData)
    
    // Initialize licensing state
    setLicenseState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
      licensedEmails,
      monthlyFee,
    })
    setShowLicensingDrawer(true)

    // Initialize with all events pending
    setLicenseState(prev => ({
      ...prev,
      events: events,
      offerId: mockData.offerId,
      datasetId: mockData.datasetId,
    }))

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Update event to processing
      setLicenseState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1300))

      // Update event to completed
      setLicenseState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'LicenseOfferCreated') {
        toast({
          title: "License Offer Created",
          description: `License offer published at $${monthlyFee}/month for ${licensedEmails.length} potential licensee${licensedEmails.length > 1 ? 's' : ''}`,
        })
      } else if (event.name === 'OfferEmailSent') {
        toast({
          title: "✓ License Offers Sent",
          description: `License notifications sent to ${licensedEmails.length} recipient${licensedEmails.length > 1 ? 's' : ''}`,
        })
      }
    }

    // Mark licensing as complete (for the initial phase)
    setLicenseState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }))

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowLicensingDialog(true)
    }, 500)
  }

  // Reset licensing state
  const resetLicensingState = () => {
    setLicenseState({
      isActive: false,
      currentStep: 0,
      events: [],
      isComplete: false,
      licensedEmails: [],
      monthlyFee: 0,
    })
    setShowLicensingDrawer(false)
    setShowLicensingDialog(false)
  }

  return {
    // State
    licenseState,
    showLicensingDrawer,
    showLicensingDialog,
    copySuccess,
    
    // Actions
    handleCreateLicense,
    handleCopyToClipboard,
    getLicensingJson,
    setShowLicensingDrawer,
    setShowLicensingDialog,
    resetLicensingState,
  }
} 