"use client"

import { useState } from "react"
import { useToast } from "@/components/ui"
import type { RegistrationState, RegistrationEvent } from "@/app/try-it-now/screens/document-tracking-card"

interface UseRegistrationProps {
  uploadedFile?: File | null
}

export function useRegistration({ uploadedFile }: UseRegistrationProps) {
  const { toast } = useToast()
  
  // Registration state
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    isActive: false,
    currentStep: 0,
    events: [],
    isComplete: false,
  })
  
  // UI state
  const [showRegistrationDrawer, setShowRegistrationDrawer] = useState(false)
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Generate registration JSON for display
  const getRegistrationJson = () => {
    if (!registrationState.recordId) return ""

    return JSON.stringify(
      {
        document_type: "Lease Agreement",
        record_id: registrationState.recordId,
        issued_timestamp: registrationState.events.find(e => e.name === 'RegistrationCompleted')?.timestamp || new Date().toISOString(),
        source_hash: registrationState.events.find(e => e.name === 'RegistrationCompleted')?.details?.sha256 || "N/A",
        qa_verified: false,
        authors: [
          {
            name: "Current User",
            role: "Abstractor",
          },
        ],
        owning_firm: {
          name: "Atlas Data Co-op User",
          firm_id: "FIRM-0193",
        },
        data_fields: {
          term_start: "2023-07-01",
          base_rent: "$48.00/SF",
          tenant: "Acme Corporation",
        },
        permissioning: {
          visibility: "private",
          allowed_viewers: ["internal"],
          revocable: true,
        },
        ...(registrationState.txHash
          ? {
              blockchain_anchor: {
                chain: "Ethereum",
                tx_hash: registrationState.txHash,
                explorer_url: registrationState.explorerUrl,
              },
            }
          : {}),
      },
      null,
      2,
    )
  }

  // Generate mock registration data
  const generateMockRegistrationData = () => {
    const datasetId = `ds-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const recordId = `rec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    const sha256 = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const simhash = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const tlsh = `T1${Array.from({ length: 70 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    const explorerUrl = `https://polygonscan.com/tx/${txHash}`
    const tokenId = Math.floor(Math.random() * 1000) + 1
    const manifestCID = `Qm${Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join("")}`
    const storageCID = `Qm${Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join("")}`
    const blockNumber = Math.floor(Math.random() * 1000000) + 50000000

    return {
      datasetId,
      recordId,
      sha256,
      simhash,
      tlsh,
      txHash,
      explorerUrl,
      tokenId,
      manifestCID,
      storageCID,
      blockNumber,
    }
  }

  // Create registration events
  const createRegistrationEvents = (mockData: ReturnType<typeof generateMockRegistrationData>): RegistrationEvent[] => {
    const { datasetId, sha256, simhash, tlsh, manifestCID, tokenId, storageCID, txHash, explorerUrl, blockNumber } = mockData

    return [
      {
        id: 1,
        name: 'RegistrationInitiated',
        status: 'pending',
        details: {
          datasetId,
          message: `Broker triggers registration for ${uploadedFile?.name || 'document'}`
        }
      },
      {
        id: 2,
        name: 'DocumentFingerprinted',
        status: 'pending',
        details: {
          sha256,
          simhash,
          tlsh,
          message: 'Atlas emits canonical SHA-256 + fuzzy SimHash/TLSH digests'
        }
      },
      {
        id: 3,
        name: 'ProvenanceStampCreated',
        status: 'pending',
        details: {
          manifestCID,
          message: 'C2PA manifest generated and pinned to IPFS'
        }
      },
      {
        id: 4,
        name: 'DataNFTMinted',
        status: 'pending',
        details: {
          tokenId: tokenId.toString(),
          datasetId,
          storageCID,
          txHash,
          explorerUrl,
          message: 'ERC-721 NFT minted with encrypted storage pointer'
        }
      },
      {
        id: 5,
        name: 'OwnerTokenGranted',
        status: 'pending',
        details: {
          message: 'ERC-1155 datatoken #0 (full rights) delegated to owner'
        }
      },
      {
        id: 6,
        name: 'RegistrationCompleted',
        status: 'pending',
        details: {
          datasetId,
          block: blockNumber.toString(),
          txHash,
          sha256,
          message: 'Registration complete - document is now tamper-proof'
        }
      }
    ]
  }

  // Handle document registration with simulated backend events
  const handleRegisterDocument = async (enableDocumentTracking: boolean) => {
    if (!enableDocumentTracking) return
    
    // Generate mock data
    const mockData = generateMockRegistrationData()
    const events = createRegistrationEvents(mockData)
    
    // Initialize registration state
    setRegistrationState({
      isActive: true,
      currentStep: 0,
      events: [],
      isComplete: false,
    })
    setShowRegistrationDrawer(true)

    // Initialize with all events pending
    setRegistrationState(prev => ({
      ...prev,
      events: events,
      recordId: mockData.recordId,
      txHash: mockData.txHash,
      explorerUrl: mockData.explorerUrl,
      tokenId: mockData.tokenId.toString()
    }))

    // Simulate processing each event with delays
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Update event to processing
      setRegistrationState(prev => ({
        ...prev,
        currentStep: i + 1,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'processing' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))

      // Update event to completed
      setRegistrationState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          e.id === event.id 
            ? { ...e, status: 'completed' as const, timestamp: new Date().toISOString() }
            : e
        )
      }))

      // Show toast notifications for key events
      if (event.name === 'RegistrationInitiated') {
        toast({
          title: "Registration Started",
          description: "Document registration has been initiated",
        })
      } else if (event.name === 'DataNFTMinted') {
        toast({
          title: `✓ Data NFT minted (#${mockData.tokenId})`,
          description: "View on PolygonScan",
        })
      } else if (event.name === 'RegistrationCompleted') {
        toast({
          title: `✓ Registration tx confirmed (${mockData.txHash.substring(0, 8)}...)`,
          description: "Document is now cryptographically verifiable",
        })
      }
    }

    // Mark registration as complete
    setRegistrationState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      currentStep: events.length
    }))

    // Show success dialog after a brief delay
    setTimeout(() => {
      setShowRegistrationDialog(true)
    }, 500)
  }

  return {
    // State
    registrationState,
    showRegistrationDrawer,
    showRegistrationDialog,
    copySuccess,
    
    // Actions
    handleRegisterDocument,
    handleCopyToClipboard,
    getRegistrationJson,
    setShowRegistrationDrawer,
    setShowRegistrationDialog,
  }
} 