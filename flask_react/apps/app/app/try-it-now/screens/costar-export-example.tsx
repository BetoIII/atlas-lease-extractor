"use client"

import { Button } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { useLeaseContext } from "./lease-context"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"

export function CoStarExportExample() {
  const {
    uploadedFile,
    extractedData,
    assetTypeClassification,
    riskFlags,
    hasCompleteData,
    isSummaryLoading,
    isAssetTypeLoading,
    isRiskFlagsLoading,
  } = useLeaseContext();

  const handleExportToCoStar = () => {
    if (!hasCompleteData()) {
      console.log("Data not ready for export");
      return;
    }

    // Here you would implement the actual CoStar export logic
    const exportData = {
      fileName: uploadedFile?.name,
      tenant: extractedData?.tenant_info?.tenant,
      property: extractedData?.property_info?.property_address,
      assetType: assetTypeClassification?.asset_type,
      confidence: assetTypeClassification?.confidence,
      riskFlagsCount: riskFlags.length,
      baseRent: extractedData?.financial_terms?.base_rent,
      leaseStart: extractedData?.lease_dates?.lease_commencement_date,
      leaseEnd: extractedData?.lease_dates?.lease_expiration_date,
      // Add any other relevant data fields...
    };

    console.log("Exporting to CoStar:", exportData);
    
    // Example of what you might do:
    // - Call CoStar API
    // - Transform data to CoStar format
    // - Handle authentication
    // - Show success/error messages
    
    alert("Export to CoStar feature - data is ready! Check console for example data structure.");
  };

  const isLoading = isSummaryLoading || isAssetTypeLoading || isRiskFlagsLoading;
  const hasData = hasCompleteData();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          CoStar Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          {isLoading ? (
            <Badge variant="outline" className="text-yellow-600">
              Processing...
            </Badge>
          ) : hasData ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              No Data
            </Badge>
          )}
        </div>
        
        {hasData && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>File: {uploadedFile?.name}</div>
            <div>Tenant: {extractedData?.tenant_info?.tenant}</div>
            <div>Asset Type: {assetTypeClassification?.asset_type}</div>
            <div>Risk Flags: {riskFlags.length}</div>
          </div>
        )}

        <Button 
          onClick={handleExportToCoStar}
          disabled={!hasData || isLoading}
          className="w-full"
        >
          {isLoading ? "Processing..." : "Export to CoStar"}
        </Button>
      </CardContent>
    </Card>
  );
} 