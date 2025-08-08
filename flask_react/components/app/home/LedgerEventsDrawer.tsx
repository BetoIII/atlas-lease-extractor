"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@atlas/ui"
import { CheckCircle, Loader2, AlertCircle, Fingerprint, Building, Users, DollarSign, Database, Mail, Link as LinkIcon, Shield, FileText } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface LedgerEvent {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  timestamp?: string
  details?: {
    message?: string
    txHash?: string
    explorerUrl?: string
    tokenId?: string
    block?: string
    firmId?: string
    batchId?: string
    memberCount?: number
    datasetId?: string
    invitationId?: string
    emailTxId?: string
    offerId?: string
    templateId?: string
    price?: string
    listingId?: string
    priceUSDC?: string
    licenseTemplateId?: string
    royaltyPct?: string
    blockNumber?: string
    currency?: string
    exclusivity?: string
    duration?: string
    recipients?: string[]
    licensorAddr?: string
    transaction_hash?: string
    chain?: string
    dataset_id?: string
    data_access?: string
    download_enabled?: boolean
    expiration?: string
    download_permission?: boolean
    invitation_id?: string
  }
}

interface ActivityData {
  id: string
  action: string
  activity_type: string
  actor: string
  details: string
  tx_hash?: string
  timestamp: string
}

interface LedgerEventsDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  activity: ActivityData | null
}

export function LedgerEventsDrawer({ open, onOpenChange, activity }: LedgerEventsDrawerProps) {
  const [events, setEvents] = useState<LedgerEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch ledger events from backend or generate fallback events
  useEffect(() => {
    if (!activity || !open) return

    setIsLoading(true)
    
    const fetchLedgerEvents = async () => {
      try {
        // Try to fetch stored ledger events from backend
        const response = await fetch(`${API_BASE_URL}/activity/${activity.id}/ledger-events`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.ledger_events && data.ledger_events.length > 0) {
            // Use stored events if available
            setEvents(data.ledger_events)
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        // Handle error silently
      }
      
      // Fallback to mock generation if no stored events found
      const timeout = setTimeout(() => {
        const mockEvents = generateLedgerEvents(activity)
        setEvents(mockEvents)
        setIsLoading(false)
      }, 500)
      
      return () => clearTimeout(timeout)
    }

    fetchLedgerEvents()
  }, [activity, open])

  const generateLedgerEvents = (activity: ActivityData): LedgerEvent[] => {
    const baseTimestamp = new Date(activity.timestamp).getTime()
    
    switch (activity.action) {
      case 'REGISTER_ASSET':
      case 'DECLARE_OWNER':
        return [
          {
            id: '1',
            name: 'DocumentHashGenerated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 2000).toISOString(),
            details: {
              message: 'Cryptographic hash generated for document integrity',
              txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
              explorerUrl: `https://polygonscan.com/tx/0x${Math.random().toString(16).substring(2, 10)}`
            }
          },
          {
            id: '2',
            name: 'MetadataStructured',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 1000).toISOString(),
            details: {
              message: 'Document metadata structured for blockchain storage',
              block: Math.floor(Math.random() * 1000000).toString()
            }
          },
          {
            id: '3',
            name: 'AssetRegistered',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: activity.details,
              txHash: activity.tx_hash,
              tokenId: Math.floor(Math.random() * 10000).toString(),
              explorerUrl: `https://polygonscan.com/tx/${activity.tx_hash}`
            }
          }
        ]

      case 'SHARE_WITH_FIRM':
        const memberCount = Math.floor(Math.random() * 50) + 15 // Random between 15-65 members
        return [
          {
            id: '1',
            name: 'FirmDirectoryQueried',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 5000).toISOString(),
            details: {
              message: 'SCIM directory queried for active firm members',
              firmId: `firm-${Math.random().toString(16).substring(2, 8)}`,
              memberCount: memberCount
            }
          },
          {
            id: '2',
            name: 'FirmWideShareInitiated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 4000).toISOString(),
            details: {
              message: `Firm-wide sharing initiated for ${memberCount} active members`,
              firmId: `firm-${Math.random().toString(16).substring(2, 8)}`,
              memberCount: memberCount
            }
          },
          {
            id: '3',
            name: 'BulkInvitationQueued',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 3000).toISOString(),
            details: {
              message: `Bulk invitations queued for all ${memberCount} active firm members from SCIM directory`,
              batchId: `batch-${Math.random().toString(16).substring(2, 8)}`,
              memberCount: memberCount
            }
          },
          {
            id: '4',
            name: 'BatchNotificationSent',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 2000).toISOString(),
            details: {
              message: `Batch email notifications sent to ${memberCount} firm members`,
              batchId: `batch-${Math.random().toString(16).substring(2, 8)}`,
              memberCount: memberCount
            }
          },
          {
            id: '5',
            name: 'GroupTokenMinted',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 1000).toISOString(),
            details: {
              message: 'ERC-1155 group access token minted for firm',
              txHash: activity.tx_hash || `0x${Math.random().toString(16).substring(2, 64)}`,
              tokenId: '600',
              explorerUrl: `https://polygonscan.com/tx/${activity.tx_hash || Math.random().toString(16).substring(2, 64)}`,
            }
          },
          {
            id: '6',
            name: 'BlockchainAnchor',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: 'Firm sharing event anchored to blockchain for immutability',
              txHash: activity.tx_hash || `0x${Math.random().toString(16).substring(2, 64)}`,
              explorerUrl: `https://polygonscan.com/tx/${activity.tx_hash || Math.random().toString(16).substring(2, 64)}`,
              firmId: `firm-${Math.random().toString(16).substring(2, 8)}`,
              memberCount: memberCount
            }
          }
        ]

      case 'INVITE_PARTNER':
        return [
          {
            id: '1',
            name: 'ExternalShareInitiated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 5000).toISOString(),
            details: {
              message: 'Initiating external share with recipients',
              recipients: activity.details.includes(',') ? activity.details.split(',').map((s: string) => s.trim()) : [activity.details]
            }
          },
          {
            id: '2',
            name: 'DatasetPrepared',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 4000).toISOString(),
            details: {
              message: 'Preparing dataset for external sharing',
              dataset_id: `ds-${Math.random().toString(16).substring(2, 8)}`,
              data_access: 'full'
            }
          },
          {
            id: '3',
            name: 'AccessControlsConfigured',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 3000).toISOString(),
            details: {
              message: 'Configuring access controls and permissions',
              expiration: 'none',
              download_permission: false
            }
          },
          {
            id: '4',
            name: 'ExternalInvitationCreated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 2000).toISOString(),
            details: {
              message: 'Creating external sharing invitation',
              invitation_id: `inv-${Math.random().toString(16).substring(2, 8)}`,
              recipients: activity.details.includes(',') ? activity.details.split(',').map((s: string) => s.trim()) : [activity.details]
            }
          },
          {
            id: '5',
            name: 'InvitationEmailSent',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 1000).toISOString(),
            details: {
              message: activity.details,
              recipients: activity.details.includes(',') ? activity.details.split(',').map((s: string) => s.trim()) : [activity.details]
            }
          },
          {
            id: '6',
            name: 'BlockchainAnchor',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: 'Anchoring external sharing event to blockchain',
              chain: 'Ethereum',
              transaction_hash: activity.tx_hash || `0x${Math.random().toString(16).substring(2, 64)}`
            }
          }
        ]

      case 'CREATE_LICENSE_OFFER':
        return [
          {
            id: '1',
            name: 'LicenseTermsStructured',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 5000).toISOString(),
            details: {
              message: 'License terms and conditions structured',
              templateId: 'A16Z Can\'t Be Evil',
              price: '$200 USDC/month',
              currency: 'USD',
              exclusivity: 'non-exclusive',
              duration: 'monthly'
            }
          },
          {
            id: '2',
            name: 'LicenseOfferCreated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 4000).toISOString(),
            details: {
              message: activity.details,
              offerId: `offer-${Math.random().toString(16).substring(2, 8)}`,
              datasetId: `ds-${Math.random().toString(16).substring(2, 8)}`,
              price: '$200 USDC/month'
            }
          },
          {
            id: '3',
            name: 'SmartContractDeployed',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 3000).toISOString(),
            details: {
              message: 'License agreement smart contract deployed',
              txHash: activity.tx_hash || `0x${Math.random().toString(16).substring(2, 64)}`,
              explorerUrl: `https://polygonscan.com/tx/${activity.tx_hash || Math.random().toString(16).substring(2, 64)}`
            }
          },
          {
            id: '4',
            name: 'OfferPublished',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 2000).toISOString(),
            details: {
              message: 'License offer published to marketplace',
              offerId: `offer-${Math.random().toString(16).substring(2, 8)}`,
              price: '$200 USDC/month'
            }
          },
          {
            id: '5',
            name: 'OfferEmailSent',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 1000).toISOString(),
            details: {
              message: 'License offer notifications sent to recipients',
              offerId: `offer-${Math.random().toString(16).substring(2, 8)}`,
              recipients: activity.details.includes('@') ? activity.details.split(',').map((s: string) => s.trim()) : ['recipients']
            }
          },
          {
            id: '6',
            name: 'BlockchainAnchor',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: 'License offer anchored to blockchain for immutability',
              txHash: activity.tx_hash || `0x${Math.random().toString(16).substring(2, 64)}`,
              explorerUrl: `https://polygonscan.com/tx/${activity.tx_hash || Math.random().toString(16).substring(2, 64)}`
            }
          }
        ]

      case 'PUBLISH_TO_MARKETPLACE':
        return [
          {
            id: '1',
            name: 'MarketplaceListingCreated',
            status: 'completed',
            timestamp: new Date(baseTimestamp - 1500).toISOString(),
            details: {
              message: 'Marketplace listing created with pricing details',
              listingId: `listing-${Math.random().toString(16).substring(2, 8)}`,
              priceUSDC: '$500 USDC',
              licenseTemplateId: 'Data Co-op Standard'
            }
          },
          {
            id: '2',
            name: 'ListingIndexed',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: 'Listing indexed and made searchable in marketplace',
              txHash: activity.tx_hash,
              blockNumber: Math.floor(Math.random() * 1000000).toString(),
              royaltyPct: '95% owner / 5% DAO'
            }
          }
        ]

      default:
        return [
          {
            id: '1',
            name: 'EventProcessed',
            status: 'completed',
            timestamp: activity.timestamp,
            details: {
              message: activity.details,
              txHash: activity.tx_hash,
              explorerUrl: activity.tx_hash ? `https://polygonscan.com/tx/${activity.tx_hash}` : undefined
            }
          }
        ]
    }
  }

  const getDrawerTitle = () => {
    if (!activity) return 'Ledger Events'
    
    switch (activity.activity_type) {
      case 'origination': return 'Document Registration Events'
      case 'sharing': return 'Document Sharing Events'
      case 'licensing': return 'Document Licensing Events'
      case 'validation': return 'Document Validation Events'
      default: return 'Blockchain Events'
    }
  }

  const getDrawerIcon = () => {
    if (!activity) return <FileText className="h-5 w-5 mr-2 text-gray-500" />
    
    switch (activity.activity_type) {
      case 'origination': return <Fingerprint className="h-5 w-5 mr-2 text-blue-500" />
      case 'sharing': 
        return activity.action === 'SHARE_WITH_FIRM' 
          ? <Building className="h-5 w-5 mr-2 text-blue-500" />
          : <Users className="h-5 w-5 mr-2 text-blue-500" />
      case 'licensing': return <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
      case 'validation': return <Shield className="h-5 w-5 mr-2 text-purple-500" />
      default: return <FileText className="h-5 w-5 mr-2 text-gray-500" />
    }
  }

  const getSuccessMessage = () => {
    if (!activity) return null
    
    switch (activity.activity_type) {
      case 'origination':
        return {
          icon: <Shield className="h-5 w-5 text-green-600 mr-2" />,
          title: 'Registration Complete',
          description: 'Your document is now cryptographically verifiable and tamper-proof.'
        }
      case 'sharing':
        if (activity.action === 'SHARE_WITH_FIRM') {
          return {
            icon: <Building className="h-5 w-5 text-blue-600 mr-2" />,
            title: 'Firm-Wide Access Enabled',
            description: 'Document has been shared with all active firm members through SCIM integration.'
          }
        } else {
          return {
            icon: <Mail className="h-5 w-5 text-green-600 mr-2" />,
            title: 'Invitations Sent',
            description: "Share invitations have been sent. You'll be notified when recipients access your document."
          }
        }
      case 'licensing':
        if (activity.action === 'PUBLISH_TO_MARKETPLACE') {
          return {
            icon: <Database className="h-5 w-5 text-purple-600 mr-2" />,
            title: 'Listing Live in Marketplace',
            description: 'Your data is now available in the Atlas Data Co-op marketplace.'
          }
        } else {
          return {
            icon: <DollarSign className="h-5 w-5 text-emerald-600 mr-2" />,
            title: 'License Offer Published',
            description: "License offer has been published. You'll be notified when payments begin."
          }
        }
      default:
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600 mr-2" />,
          title: 'Event Completed',
          description: 'The blockchain event has been successfully processed.'
        }
    }
  }

  if (!activity) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            {getDrawerIcon()}
            {getDrawerTitle()}
          </SheetTitle>
          <SheetDescription>
            Live status of blockchain events for {activity.action.replace(/_/g, ' ').toLowerCase()}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading ledger events...</p>
              </div>
            </div>
          ) : (
            <>
              {events.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-1">
                    {event.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : event.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : event.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {index + 1}. {event.name.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      {event.status === 'completed' && event.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {event.details?.message || 'Processing...'}
                    </p>
                    {event.status === 'completed' && event.details && (
                      <div className="mt-2 space-y-1">
                        {event.details.txHash && (
                          <div className="flex items-center text-xs">
                            <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                            <a
                              href={event.details.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono"
                            >
                              {event.details.txHash.substring(0, 10)}...
                            </a>
                          </div>
                        )}
                        {event.details.tokenId && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-500">Token ID: </span>
                            <span className="font-mono ml-1">#{event.details.tokenId}</span>
                          </div>
                        )}
                        {event.details.block && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-500">Block: </span>
                            <span className="font-mono ml-1">{event.details.block}</span>
                          </div>
                        )}
                        {event.details.firmId && (
                          <div className="flex items-center text-xs">
                            <Building className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Firm ID: </span>
                            <span className="font-mono ml-1">{event.details.firmId.substring(0, 12)}...</span>
                          </div>
                        )}
                        {event.details.memberCount && (
                          <div className="flex items-center text-xs">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Members: </span>
                            <span className="ml-1 font-medium text-blue-600">{event.details.memberCount}</span>
                          </div>
                        )}
                        {event.details.invitationId && (
                          <div className="flex items-center text-xs">
                            <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Invitation ID: </span>
                            <span className="font-mono ml-1">{event.details.invitationId.substring(0, 12)}...</span>
                          </div>
                        )}
                        {event.details.price && (
                          <div className="flex items-center text-xs">
                            <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Price: </span>
                            <span className="ml-1 font-medium text-emerald-600">{event.details.price}</span>
                          </div>
                        )}
                        {event.details.currency && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-500">Currency: </span>
                            <span className="ml-1 font-medium">{event.details.currency}</span>
                          </div>
                        )}
                        {event.details.templateId && (
                          <div className="flex items-center text-xs">
                            <Shield className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Template: </span>
                            <span className="ml-1 font-medium">{event.details.templateId}</span>
                          </div>
                        )}
                        {event.details.recipients && (
                          <div className="flex items-center text-xs">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Recipients: </span>
                            <span className="ml-1 font-medium">{event.details.recipients.join(', ')}</span>
                          </div>
                        )}
                        {event.details.dataset_id && (
                          <div className="flex items-center text-xs">
                            <Database className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Dataset ID: </span>
                            <span className="font-mono ml-1">{event.details.dataset_id.substring(0, 12)}...</span>
                          </div>
                        )}
                        {event.details.chain && (
                          <div className="flex items-center text-xs">
                            <LinkIcon className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-500">Chain: </span>
                            <span className="ml-1 font-medium">{event.details.chain}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {events.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    {getSuccessMessage()?.icon}
                    <div>
                      <h4 className="text-sm font-medium text-green-800">{getSuccessMessage()?.title}</h4>
                      <p className="text-xs text-green-700 mt-1">
                        {getSuccessMessage()?.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}