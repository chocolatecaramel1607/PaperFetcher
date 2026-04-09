import { X } from "lucide-react";

interface PdfViewerProps {
  url: string;
  onClose: () => void;
}

export default function PdfViewer({ url, onClose }: PdfViewerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
        <span className="text-white text-sm truncate flex-1 mr-4">{url}</span>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title="PDF Viewer"
      />
    </div>
  );
}
