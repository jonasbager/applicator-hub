import React from 'react';
import { Upload } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  description?: string;
}

export function UploadArea({ onFileSelect, accept = '.pdf,.docx', label = 'Upload PDF Documents', description = 'PDF files only' }: UploadAreaProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
        hover:border-primary hover:bg-primary/5 transition-colors
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-lg font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
