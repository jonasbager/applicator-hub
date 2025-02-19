import { Dialog, DialogContent } from "./dialog";
import { Button } from "./button";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import logo from "/logo.png";

interface PdfViewerProps {
  url: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfViewer({ url, title, open, onOpenChange }: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <div className="flex flex-col">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">Time Machine Snapshot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(url, '_blank')}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-muted overflow-hidden">
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-full border-none"
            title={title}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-2 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Time Machine
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
