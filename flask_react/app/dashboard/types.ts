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

export interface DocumentUpdate {
  id: string
  title: string
  lastActivity: {
    action: string
    timestamp: string
    color: string
  }
  totalEvents: number
  hasMoreEvents: boolean
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
