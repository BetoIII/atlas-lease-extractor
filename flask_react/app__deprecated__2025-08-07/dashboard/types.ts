export interface DocumentShare {
  name: string
  type: string
  since: string
  expires: string
  amount?: string
}

export interface Document {
  id: number
  title: string
  description: string
  docType: string
  region: string
  status: string
  price: number
  duration: string
  scope: string
  trending: boolean
  relationship: string
  isLicensed: boolean
  isShared: boolean
  expirationDate: string
  sharedWith: DocumentShare[]
  licensedTo: DocumentShare[]
  owner: string
  revenue: number
  licenseAmount?: string
  firmAccess?: boolean
}

// Document Update: Represents a document with summary of its latest activity
// totalActivities = number of high-level activities (share, license, etc.)
// Each activity contains multiple ledger events
export interface DocumentUpdate {
  id: string
  title: string
  lastActivity: {
    action: string
    timestamp: string
    color: string
  }
  totalActivities: number
  hasMoreActivities: boolean
}

export interface Transaction {
  id: number
  type: 'credit' | 'debit'
  description: string
  asset: string
  amount: string
  timestamp: string
  status: string
  counterparty: string
}

export interface AuditEvent {
  action: string
  timestamp: string
  actor: string
  txHash: string
  status: string
}

export interface Property {
  id: string
  address: string
  type: string
  size: string
  value?: number
  source: 'owned' | 'shared' | 'firm'
  documentIds: string[]  // Changed to array since properties can come from multiple documents
  sharedBy?: string
  lastUpdated: string
}

export interface Portfolio {
  id: string
  name: string
  description: string
  propertyIds: string[]  // Changed to reference properties by ID
  totalValue: number
  lastUpdated: string
  owner: string
}
