import { Button } from "@atlas/ui"
import { Card, CardHeader } from "@atlas/ui"
import { FileText, Share2 } from "lucide-react"

interface DocumentInfoProps {
  fileName?: string
  onShare: () => void
}

export function DocumentInfo({ 
  fileName, 
  onShare 
}: DocumentInfoProps) {
  if (!fileName) return null

  return (
    <Card className="w-fit">
      <div className="flex flex-row items-center justify-between gap-4 p-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-primary mr-2" />
          <span className="font-medium">{fileName}</span>
        </div>                    
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  )
} 