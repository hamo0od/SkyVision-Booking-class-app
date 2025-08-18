"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, X } from "lucide-react"

interface PDFViewerProps {
  filePath: string
  fileName: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ filePath, fileName, isOpen, onClose }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = `/api/files/${encodeURIComponent(filePath)}`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading PDF...</span>
              </div>
            </div>
          )}
          <iframe
            src={`/api/files/${encodeURIComponent(filePath)}`}
            className="w-full h-full"
            onLoad={() => setIsLoading(false)}
            title={fileName}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
