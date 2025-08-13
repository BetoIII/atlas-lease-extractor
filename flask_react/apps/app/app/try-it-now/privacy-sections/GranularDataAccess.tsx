"use client"

import { Switch, Label, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@atlas/ui"
import { Database, Lock } from "lucide-react"

interface GranularDataAccessProps {
  shareAllData: boolean;
  setShareAllData: (value: boolean) => void;
  sharedFields: Record<string, boolean>;
  setSharedFields: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  fieldPrefix: string; // "external" or "license"
}

export function GranularDataAccess({ 
  shareAllData, 
  setShareAllData, 
  sharedFields, 
  setSharedFields, 
  fieldPrefix 
}: GranularDataAccessProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Granular Data Access</h3>
      <div className="flex items-center justify-between rounded-lg border p-3 bg-white">
        <div className="flex items-center">
          <Database className="h-4 w-4 mr-2 text-primary" />
          <div>
            <div className="text-sm">Share All Data</div>
            <div className="text-xs text-gray-500">Share all extracted data with selected audience</div>
          </div>
        </div>
        <Switch checked={shareAllData} onCheckedChange={setShareAllData} />
      </div>
      {shareAllData && (
        <div className="text-xs text-gray-500 m-2">
          Note: When enabled, all extracted data will be shared. When disabled, you can select specific fields to share below.
        </div>
      )}

      {!shareAllData && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p className="font-medium">Why are some fields always shared?</p>
            <p className="mt-1">
              Fields marked with a lock icon are essential for creating accurate market benchmarks. These fields are
              anonymized and only used in aggregate form.
            </p>
          </div>

          {[
            {
              name: "General Information",
              fields: ["Property Address", "Landlord", "Tenant", "Leased Area (sq ft)", "Commencement Date", "Expiration Date"],
            },
            {
              name: "Financial Terms",
              fields: ["Base Rent", "Operating Expenses", "Utilities", "Real Estate Taxes", "CAM"],
            },
            {
              name: "Lease Terms",
              fields: ["Term Length", "Renewal Options", "Early Termination", "Lease Type"],
            },
            {
              name: "Other Details",
              fields: ["Concessions", "Subordination", "Insurance/Condemnation", "Purchase Options"],
            },
          ].map((group) => (
            <div key={group.name} className="space-y-3">
              <h4 className="font-medium text-gray-700">{group.name}</h4>
              <div className="space-y-3">
                {group.fields.map((field) => {
                  const isNonHideableField = ["Property Address", "Leased Area (sq ft)", "Commencement Date"].includes(field)
                  const getTooltipForField = (field: string) => {
                    if (field === "Property Address") {
                      return "Required for geographical benchmarking and comparables accuracy."
                    }
                    if (field === "Leased Area (sq ft)") {
                      return "Needed for computing market averages and regional benchmarking."
                    }
                    if (field === "Commencement Date") {
                      return "Essential for reliable temporal benchmarking and lease trends."
                    }
                    return "Toggle to share this field with the selected audience."
                  }
                  return (
                    <div key={field} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`field-${fieldPrefix}-${field}`} className="cursor-pointer">
                          {field}
                        </Label>
                        {isNonHideableField && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Lock className="h-3.5 w-3.5 text-gray-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getTooltipForField(field)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <Switch
                        id={`field-${fieldPrefix}-${field}`}
                        checked={isNonHideableField || sharedFields[field]}
                        onCheckedChange={(checked) => setSharedFields(prev => ({ ...prev, [field]: checked }))}
                        disabled={isNonHideableField}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 