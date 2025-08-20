"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

interface PDFViewerProps {
  filePath: string
  fileName: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ filePath, fileName, isOpen, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = `/api/files/${filePath}`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const zoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const zoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= 50}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
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

        <div className="flex-1 p-4 pt-0">
          <div className="border rounded-lg overflow-hidden bg-gray-100 h-[70vh]">
            <iframe
              src={`/api/files/${filePath}#zoom=${zoom}`}
              className="w-full h-full"
              title={fileName}
              style={{ border: "none" }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
