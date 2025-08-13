"use client"

import { useState } from "react"
import { useToast } from "@atlas/ui"

export interface CoopShareEvent {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    datasetId?: string
    ownerAddr?: string
    firmId?: string
    priceUSDC?: string
    licenseTemplateId?: string
    daoFeePct?: string
    listingId?: string
    fixedPriceAddr?: string
    royaltyPct?: string
    indexerId?: string
    licenseeAddr?: string
    amount?: string
    ownerAmt?: string
    daoAmt?: string
    reason?: string
    txHash?: string
    explorerUrl?: string
    blockNumber?: string
    message?: string
  }
}

export interface CoopShareState {
  isActive: boolean
  currentStep: number
  events: CoopShareEvent[]
  isComplete: boolean
  datasetId?: string
  listingId?: string
  priceUSDC: number
  licenseTemplate: string
  daoFeePct: number
}

interface UseCoopSharingProps {
  uploadedFile?: File | null
}

export function useCoopSharing({ uploadedFile }: UseCoopSharingProps) {
  const { toast } = useToast()
  
  // Co-op sharing state
  const [coopShareState, setCoopShareState] = useState<CoopShareState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
    priceUSDC: 1,
    licenseTemplate: "CBE-4 Non-Exclusive",
    daoFeePct: 5,
  })
  
  // UI state
  const [showCoopSharingDrawer, setShowCoopSharingDrawer] = useState(false)
  const [showCoopSharingDialog, setShowCoopSharingDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate co-op sharing JSON for display
  const getCoopSharingJson = () => {
    if (!coopShareState.datasetId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        dataset_id: coopShareState.datasetId,
        listing_id: coopShareState.listingId,
        publish_timestamp: coopShareState.events.find(e => e.name === 'CoopListingPublished')?.timestamp || new Date().toISOString(),
        share_type: "data_coop_marketplace",
        listing_terms: {
          price_usdc: coopShareState.priceUSDC,
          license_template: coopShareState.licenseTemplate,
          dao_fee_pct: coopShareState.daoFeePct,
          owner_share_pct: 100 - coopShareState.daoFeePct,
        },
        nft_details: {
          listing_nft: "ERC-721",
          references_data_nft: true,
          revenue_split_automated: true,
        },
        marketplace: {
          searchable: true,
          indexed: true,
          revenue_model: "per_license_purchase",
        },
        status: "live_in_marketplace",
        blockchain_anchor: {
          chain: "Ethereum",
          events_logged: coopShareState.events.filter(e => e.status === 'completed').length,
        },
      },
      null,
      2,
    )
  }

  // Generate mock co-op sharing data
  const generateMockCoopSharingData = (priceUSDC: number, licenseTemplate: string) => {
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const listingId = `listing-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const ownerAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const firmId = `firm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const fixedPriceAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const indexerId = `idx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`
    const blockNumber = Math.floor(Math.random() * 1000000) + 50000000

    return {
      datasetId,
      listingId,
      ownerAddr,
      firmId,
      priceUSDC: priceUSDC.toString(),
      licenseTemplateId: licenseTemplate.toLowerCase().replace(/\s+/g, '-'),
      daoFeePct: "5",
      fixedPriceAddr,
      royaltyPct: "95",
      indexerId,
      txHash,
      explorerUrl,
      blockNumber: blockNumber.toString(),
    }
  }

  // Create co-op sharing events (only first 3 events for initial publication)
  const createCoopSharingEvents = (
    mockData: ReturnType<typeof generateMockCoopSharingData>
  ): CoopShareEvent[] => {
    const { datasetId, listingId, ownerAddr, firmId, priceUSDC, licenseTemplateId, daoFeePct, fixedPriceAddr, royaltyPct, indexerId, blockNumber } = mockData

    return [
      {
        id: 1,
        name: 'CoopShareInitiated',
        status: 'pending',
        details: {
          datasetId,
          ownerAddr,
          firmId,
          message: `Data co-op contribution wizard started for dataset`
        }
      },
      {
        id: 2,
        name: 'ListingTermsSet',
        status: 'pending',
        details: {
          datasetId,
          priceUSDC: `$${priceUSDC} USDC`,
          licenseTemplateId,
          daoFeePct: `${daoFeePct}%`,
          message: `Listing terms confirmed: $${priceUSDC} USDC per license, ${100 - parseInt(daoFeePct)}% owner share`
        }
      },
      {
        id: 3,
        name: 'CoopListingPublished',
        status: 'pending',
        details: {
          listingId,
          datasetId,
          fixedPriceAddr,
          royaltyPct: `${royaltyPct}%`,
          blockNumber,
          message: `Listing NFT (ERC-721) minted with automated ${royaltyPct}% owner / ${daoFeePct}% DAO revenue split`
        }
      },
      // Future events that will be triggered by marketplace activity
      // {
      //   id: 4,
      //   name: 'ListingIndexed',
      //   status: 'pending',
      //   details: {
      //     listingId,
      //     indexerId,
      //     message: 'Off-chain indexer flags listing as searchable in Co-op marketplace'
      //   }
      // },
      // {
      //   id: 5,
      //   name: 'LicensePurchased',
      //   status: 'pending',
      //   details: {
      //     listingId,
      //     amount: priceUSDC,
      //     message: 'Fires each time a buyer pays for a license'
      //   }
      // },
      // {
      //   id: 6,
      //   name: 'RevenueDistributed',
      //   status: 'pending',
      //   details: {
      //     listingId,
      //     ownerAmt: (parseFloat(priceUSDC) * 0.95).toFixed(2),
      //     daoAmt: (parseFloat(priceUSDC) * 0.05).toFixed(2),
      //     message: 'Protocol routes owner share to wallet & DAO fee to treasury'
      //   }
      // },
      // {
      //   id: 7,
      //   name: 'ListingSuspended',
      //   status: 'pending',
      //   details: {
      //     listingId,
      //     reason: 'owner_request',
      //     message: 'Owner or DAO can pause listing if needed'
      //   }
      // }
    ]
  }

  // Handle data co-op sharing with simulated backend events
  const handlePublishToCoop = async (priceUSDC: number, licenseTemplate: string) => {
    // Generate mock data
    const mockData = generateMockCoopSharingData(priceUSDC, licenseTemplate)
    const events = createCoopSharingEvents(mockData)
    
    // Initialize co-op sharing state
    setCoopShareState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
      priceUSDC,
      licenseTemplate,
      daoFeePct: 5,
    })
    setShowCoopSharingDrawer(true)

    // Initialize with all events pending
    setCoopShareState(prev => ({
      ...prev,
      events: events,
      datasetId: mockData.datasetId,
      listingId: mockData.listingId,
    }))

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Update event to processing
      setCoopShareState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Simulate processing time (longer for NFT minting and IPFS upload)
      const processingTime = event.name === 'CoopListingPublished' ? 3000 + Math.random() * 2000 : 1200 + Math.random() * 1800
      await new Promise(resolve => setTimeout(resolve, processingTime))

      // Update event to completed
      setCoopShareState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'CoopShareInitiated') {
        toast({
          title: "Co-op Contribution Started",
          description: `Publishing your data to the Atlas Data Co-op marketplace`,
        })
      } else if (event.name === 'ListingTermsSet') {
        toast({
          title: "✓ Listing Terms Confirmed",
          description: `$${priceUSDC} USDC per license, ${100 - 5}% owner share`,
        })
      } else if (event.name === 'CoopListingPublished') {
        toast({
          title: "✓ Listing Live in Marketplace",
          description: `Earn revenue on every license purchase`,
        })
      }
    }

    // Mark co-op sharing as complete (for the initial phase)
    setCoopShareState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }))

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowCoopSharingDialog(true)
    }, 500)
  }

  // Reset co-op sharing state
  const resetCoopSharingState = () => {
    setCoopShareState({
      isActive: false,
      currentStep: 0,
      events: [],
      isComplete: false,
      priceUSDC: 1,
      licenseTemplate: "CBE-4 Non-Exclusive",
      daoFeePct: 5,
    })
    setShowCoopSharingDrawer(false)
    setShowCoopSharingDialog(false)
  }

  // Get completed ledger events for storing in backend
  const getCompletedLedgerEvents = () => {
    return coopShareState.events
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
    coopShareState,
    showCoopSharingDrawer,
    showCoopSharingDialog,
    copySuccess,
    
    // Actions
    handlePublishToCoop,
    handleCopyToClipboard,
    getCoopSharingJson,
    getCompletedLedgerEvents,
    setShowCoopSharingDrawer,
    setShowCoopSharingDialog,
    resetCoopSharingState,
  }
} 