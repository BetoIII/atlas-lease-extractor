"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Lock, Users, Building, Globe } from "lucide-react"

export function PrivacySettings() {
  const [sharingLevel, setSharingLevel] = useState("private")
  const [allowAnonymousData, setAllowAnonymousData] = useState(false)

  return (
    <div className="space-y-6">
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
          Note: When enabled, only non-identifying information like rent rates and terms will be used to improve market
          insights. No tenant names or specific property details will be shared.
        </div>
      </div>
    </div>
  )
}
