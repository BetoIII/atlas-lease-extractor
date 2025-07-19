"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Database,
  DollarSign,
  Info,
} from "lucide-react"

interface CoopSectionProps {
  documentRegistered: boolean;
  onShareWithCoop?: (priceUSDC: number, licenseTemplate: string) => void;
}

export function CoopSection({ documentRegistered, onShareWithCoop }: CoopSectionProps) {
  // Co-op license template state
  const [coopLicenseTemplate, setCoopLicenseTemplate] = useState("CBE-4 Non-Exclusive")

  return (
    <div className="border-t bg-gray-50 p-3 space-y-4">
      <div className="space-y-3">
        <Label className="font-medium">
          Data Co-op Marketplace
        </Label>
        <div className="text-xs text-gray-600 mb-3">
          Your selected data will be available for licensing through the Atlas Data Co-op marketplace. You&apos;ll earn revenue while contributing to industry-wide benchmarks.
        </div>
        
        {/* License Template Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium">License Template</Label>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Recommended
            </Badge>
          </div>
          <Select value={coopLicenseTemplate} onValueChange={setCoopLicenseTemplate}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CBE-4 Non-Exclusive">
                <div className="flex flex-col">
                  <span className="font-medium">CBE-4 Non-Exclusive</span>
                  <span className="text-xs text-gray-500">Broadest distribution • Recommended</span>
                </div>
              </SelectItem>
              <SelectItem value="CBE-2 Commercial">
                <div className="flex flex-col">
                  <span className="font-medium">CBE-2 Commercial</span>
                  <span className="text-xs text-gray-500">Hate-speech protection • Revocable</span>
                </div>
              </SelectItem>
              <SelectItem value="CBE-3 Exclusive">
                <div className="flex flex-col">
                  <span className="font-medium">CBE-3 Exclusive</span>
                  <span className="text-xs text-gray-500">Single buyer • Higher pricing</span>
                </div>
              </SelectItem>
              <SelectItem value="CBE-1 Personal">
                <div className="flex flex-col">
                  <span className="font-medium">CBE-1 Personal</span>
                  <span className="text-xs text-gray-500">Non-commercial only • Limited use</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-gray-500">
            CBE-4 maximizes marketplace reach. Choose CBE-3 for premium pricing or CBE-2 for content protection.
          </div>
        </div>

        {/* Price Input */}
        <div className="space-y-2">
          <Label className="font-medium">Price per License (USDC)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              min="0"
              step="0.01"
              defaultValue="1"
              placeholder="1.00"
              className="pl-10 bg-white"
            />
          </div>
          <div className="text-xs text-gray-500">
            Co-op recommends $1 per unit. Price is per lease package; you keep 95% after DAO fee.
          </div>
        </div>

        {/* DAO Fee Display */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-800 font-medium">Revenue Split</span>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center">
              <Database className="h-3 w-3 mr-1" />
              95% / 5%
            </Badge>
          </div>
          <div className="text-xs text-purple-700 mt-1">
            DAO fee: 5% fixed • You keep 95% of all license sales
          </div>
        </div>
      </div>

      {!documentRegistered && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Document registration is required before publishing to the Data Co-op. Please register your document first.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={() => onShareWithCoop && onShareWithCoop(1, coopLicenseTemplate)}
        disabled={!documentRegistered}
        className="w-full"
        size="sm"
      >
        <Database className="h-4 w-4 mr-2" />
        Publish to Co-op
      </Button>
    </div>
  )
} 