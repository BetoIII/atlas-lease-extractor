"use client"

import { AlertTriangle, DollarSign, Eye, Gavel, Scale } from "lucide-react"
import { Alert, AlertDescription, Button } from "@/components/ui"

interface InfringementData {
  infringingAddress: string
  similarityScore: number
  klerosCaseId?: string
  proposedResolution?: { amount: number; currency: string }
}

interface InfringementAlertProps {
  visible: boolean
  stage: 'none' | 'detected' | 'notice_sent' | 'counter_response' | 'resolution_proposed' | 'arbitration_started' | 'verdict_enforced'
  data: InfringementData
  onDismiss: () => void
}

export function InfringementAlert({ visible, stage, data, onDismiss }: InfringementAlertProps) {
  if (!visible) return null

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="ml-2">
        <div className="font-semibold text-orange-800">
          ! Unlicensed near-duplicate spotted ({data.similarityScore}% match)
        </div>
        <AlertDescription className="text-orange-700 mt-1">
          {stage === 'detected' && (
            <>
              <strong>What happened:</strong> Our Atlas scanner detected an unlicensed copy of your document on address {data.infringingAddress} with {data.similarityScore}% similarity.
              <br />
              <strong>Why this matters:</strong> Unauthorized use of your intellectual property could impact your licensing revenue and data rights.
              <br />
              <strong>Next steps:</strong> We've automatically initiated our conflict resolution process. A formal notice will be sent to the alleged infringer shortly.
            </>
          )}
          {stage === 'notice_sent' && (
            <>A conflict notice has been emailed to the alleged infringer. They have 48 hours to respond with either a license request or dispute claim.</>
          )}
          {stage === 'counter_response' && (
            <>The alleged infringer has responded requesting a retroactive license. You can now propose licensing terms or escalate to arbitration.</>
          )}
          {stage === 'resolution_proposed' && (
            <>You've proposed a retroactive license for {data.proposedResolution?.amount} {data.proposedResolution?.currency}. Awaiting the other party's response.</>
          )}
          {stage === 'arbitration_started' && (
            <>The case has been escalated to Kleros arbitration (Case {data.klerosCaseId}). Independent jurors are now reviewing the evidence and will render a binding decision.</>
          )}
          {stage === 'verdict_enforced' && (
            <>✓ Case resolved! The arbitration panel ruled in your favor. A retroactive license has been minted and payment has been transferred to your wallet.</>
          )}
          <div className="mt-2 flex gap-2">
            {stage === 'detected' && (
              <Button size="sm" variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                <Eye className="h-3 w-3 mr-1" />
                Review Claim
              </Button>
            )}
            {stage === 'counter_response' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Propose License
                </Button>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                  <Scale className="h-3 w-3 mr-1" />
                  Escalate to Arbitration
                </Button>
              </div>
            )}
            {stage === 'arbitration_started' && (
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                <Gavel className="h-3 w-3 mr-1" />
                View Kleros Case
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDismiss}
              className="text-gray-600 hover:text-gray-800"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  )
}

export default InfringementAlert


