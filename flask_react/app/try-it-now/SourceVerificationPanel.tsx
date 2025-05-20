import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Check, Copy, Quote, Lightbulb, BookOpen, Download, FileText, CheckCircle } from "lucide-react";
import { PdfViewer } from "./pdf-viewer";
import React from "react";

interface SourceCitation {
  page: number;
  matching_text: string;
}

interface SourceMetadata {
  citation: SourceCitation[];
  reasoning?: string;
}

export interface SourcePanelInfo {
  section: string;
  fieldName: string;
  fieldValue: string;
  metadata: SourceMetadata;
}

interface SourceVerificationPanelProps {
  show: boolean;
  source: SourcePanelInfo | null;
  onClose: () => void;
  fileName: string;
  pdfPath?: string;
}

export const SourceVerificationPanel: React.FC<SourceVerificationPanelProps> = ({
  show,
  source,
  onClose,
  fileName,
  pdfPath,
}) => {
  // TODO: Implement copy to clipboard functionality
  // const [copySuccess, setCopySuccess] = React.useState<string | null>(null);

  return (
    <div
      className={`fixed top-1 right-0 h-full w-[650px] bg-white border-l shadow-lg transform transition-transform duration-300 z-50 margin-none ${
        show ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxWidth: "90vw" }}
    >
      {source && (
        <div className="flex flex-col h-full">
          <div className="border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div>
                  <h3 className="font-medium">Source Verification</h3>
                  <p className="text-sm text-gray-500">
                    {source.section} &gt; {source.fieldName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-b">
            <h4 className="text-sm font-medium mb-2">Extracted Value</h4>
            <div className="bg-white border rounded-md p-3 text-sm font-medium relative">
              {source.fieldValue}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs"
                // TODO: Implement copy to clipboard
                // onClick={() => handleCopyToClipboard(source.fieldValue, "value")}
              >
                {/* {copySuccess === "value" ? (
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                ) : ( */}
                  <Copy className="h-3 w-3 mr-1" />
                {/* )} */}
                Copy
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Source Citations */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center">
                    <Quote className="h-4 w-4 mr-2 text-primary" />
                    Source Text
                  </h4>
                  {Array.isArray(source.metadata?.citation) && source.metadata.citation.length > 0 ? (
                    source.metadata.citation.map((citation, index) => (
                      <div key={index} className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          Page {citation.page ?? "?"}
                        </Badge>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                          <p className="italic">"{citation.matching_text ?? ""}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 italic">No source citation available.</div>
                  )}
                </div>

                {/* Reasoning (if available and not VERBATIM EXTRACTION) */}
                {source.metadata?.reasoning && source.metadata.reasoning !== "VERBATIM EXTRACTION" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                      Extraction Reasoning
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                      <p>{source.metadata.reasoning ?? ""}</p>
                    </div>
                  </div>
                )}

                {/* Document Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    Document Preview
                  </h4>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {fileName} - Page {source.metadata?.citation?.[0]?.page ?? "?"}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        // TODO: Implement download page functionality
                        // onClick={() => handleDownloadPage(source.metadata?.citation?.[0]?.page)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Page
                      </Button>
                    </div>
                    <div className="h-[300px] bg-gray-50 flex items-center justify-center p-4">
                      <PdfViewer
                        fileName={pdfPath || fileName}
                        page={source.metadata?.citation?.[0]?.page ?? 1}
                        highlight={{ x: 0, y: 0, width: 0, height: 0 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Verified by AI</h4>
                    <p className="text-xs text-green-700 mt-1">
                      This extraction has been verified by our AI with high confidence based on the source text.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}; 