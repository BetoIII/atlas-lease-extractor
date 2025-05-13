"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Lock, Users, Building, Globe } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Key, FileText, CheckCircle, Info, Database } from "lucide-react"

export function PrivacySettings() {
  const [sharingLevel, setSharingLevel] = useState("private")
  const [allowAnonymousData, setAllowAnonymousData] = useState(false)
  const [tokenizeData, setTokenizeData] = useState(true)
  const [tokenizationLevel, setTokenizationLevel] = useState("metadata")
  const [blockchainAnchor, setBlockchainAnchor] = useState(false)
  const [auditTrail, setAuditTrail] = useState(true)
  const [verificationRequired, setVerificationRequired] = useState(false)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="privacy">Privacy Controls</TabsTrigger>
          <TabsTrigger value="tokenization">Tokenization</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-6 mt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Visibility</h3>
            <RadioGroup value={sharingLevel} onValueChange={setSharingLevel} className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center cursor-pointer">
                  <Lock className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <div className="font-medium">Only Me</div>
                    <div className="text-xs text-gray-500">Only you can access this data</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="flex items-center cursor-pointer">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <div className="font-medium">My Team</div>
                    <div className="text-xs text-gray-500">Your team members can access this data</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="firm" id="firm" />
                <Label htmlFor="firm" className="flex items-center cursor-pointer">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  <div>
                    <div className="font-medium">My Firm</div>
                    <div className="text-xs text-gray-500">Everyone at your firm can access this data</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Contribution</h3>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Anonymous Market Data</div>
                  <div className="text-xs text-gray-500">Allow anonymized data to contribute to market insights</div>
                </div>
              </div>
              <Switch checked={allowAnonymousData} onCheckedChange={setAllowAnonymousData} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Note: When enabled, only non-identifying information like rent rates and terms will be used to improve market insights. No tenant names or specific property details will be shared.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tokenization" className="space-y-6 mt-6">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertDescription>
              Tokenization creates a cryptographically anchored metadata record that proves authorship, verification status, and maintains an immutable audit trail.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Enable Tokenization</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Recommended
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center">
                <Key className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Tokenize Extracted Data</div>
                  <div className="text-xs text-gray-500">Create a verifiable, immutable record of this document's data</div>
                </div>
              </div>
              <Switch checked={tokenizeData} onCheckedChange={setTokenizeData} />
            </div>
            {tokenizeData && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/10">
                <div>
                  <div className="flex items-center mb-2">
                    <h4 className="text-sm font-medium">Tokenization Level</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                            <Info className="h-4 w-4 text-gray-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">Metadata tokenization is recommended for most use cases. Full document tokenization includes more data but requires more storage.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <RadioGroup value={tokenizationLevel} onValueChange={setTokenizationLevel} className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value="metadata" id="metadata" />
                      <Label htmlFor="metadata" className="flex items-center cursor-pointer">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Metadata Only</div>
                          <div className="text-xs text-gray-500">Tokenize extraction data and verification status</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="flex items-center cursor-pointer">
                        <Shield className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Full Document</div>
                          <div className="text-xs text-gray-500">Tokenize all document data with complete audit trail</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">Blockchain Anchor</div>
                        <div className="text-xs text-gray-500">Add an optional blockchain reference for additional verification</div>
                      </div>
                    </div>
                    <Switch checked={blockchainAnchor} onCheckedChange={setBlockchainAnchor} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">Maintain Audit Trail</div>
                        <div className="text-xs text-gray-500">Track all access and modifications to this document</div>
                      </div>
                    </div>
                    <Switch checked={auditTrail} onCheckedChange={setAuditTrail} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">Require Verification</div>
                        <div className="text-xs text-gray-500">Document must be verified by a second team member</div>
                      </div>
                    </div>
                    <Switch checked={verificationRequired} onCheckedChange={setVerificationRequired} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Token Preview</CardTitle>
              <CardDescription className="text-xs">Sample of the token that will be created</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono overflow-auto rounded-md max-h-[200px]">
                {`{
  "document_type": "Lease Agreement",
  "token_id": "a6d29e7b-8345-4ec9-9c02-b79fe0231c5d",
  "issued_timestamp": "${new Date().toISOString()}",
  "source_hash": "0x43adf7810ffb325b...9f78bca",
  "qa_verified": ${verificationRequired},
  "authors": [
    {
      "name": "Current User",
      "role": "Abstractor"
    }
  ],
  "owning_firm": {
    "name": "Atlas Data Co-op User",
    "firm_id": "FIRM-0193"
  },
  "data_fields": {
    "term_start": "2023-07-01",
    "base_rent": "$48.00/SF",
    "tenant": "Acme Corporation"
  },
  "permissioning": {
    "visibility": "${sharingLevel}",
    "allowed_viewers": ["internal"${sharingLevel === "team" ? ', "team"' : ""}${sharingLevel === "firm" ? ', "team", "firm"' : ""}],
    "revocable": true
  }${
    blockchainAnchor
      ? `,
  "blockchain_anchor": {
    "chain": "Ethereum",
    "tx_hash": "0x920ec...fa92d7",
    "explorer_url": "https://etherscan.io/tx/0x920ec..."
  }`
      : ""
  }
}`}
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="w-full flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span className="flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-green-600" />
                    Tamper-proof and verifiable
                  </span>
                </div>
                <Button variant="outline" size="sm" disabled={!tokenizeData}>
                  <Key className="h-3 w-3 mr-2" />
                  Generate Token
                </Button>
              </div>
            </CardFooter>
          </Card>
          <div className="text-xs text-gray-500 mt-2">
            <p className="mb-1">Benefits of tokenization:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Regulatory compliance (ASC 842, FIRREA)</li>
              <li>Legal protection with immutable proof of methodology</li>
              <li>Defensible audit trail for internal reviews</li>
              <li>Cryptographically secured chain of custody</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
