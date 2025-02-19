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
        {/* Ultra-compact header */}
        <div className="flex items-center justify-between py-1 px-2 border-b bg-background">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex-shrink-0">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xs font-medium leading-none">{title}</h3>
              <p className="text-[9px] text-muted-foreground">Time Machine</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => window.open(url, '_blank')}
              title="Download PDF"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onOpenChange(false)}
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer - Maximized space */}
        <div className="flex-1 bg-muted overflow-hidden">
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-full border-none"
            title={title}
          />
        </div>

        {/* Ultra-compact footer */}
        <div className="flex items-center justify-between py-0.5 px-1.5 border-t bg-background">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[10px] px-0.5">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground">
            Time Machine
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
