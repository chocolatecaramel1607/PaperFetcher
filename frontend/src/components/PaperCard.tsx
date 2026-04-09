import { useState } from "react";
import { Paper } from "@/types";
import { api } from "@/lib/api";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Download,
  Lock,
  Quote,
  Calendar,
  Users,
} from "lucide-react";

interface PaperCardProps {
  paper: Paper;
  onUpdate: (paper: Paper) => void;
  onViewPdf: (url: string) => void;
}

export default function PaperCard({
  paper,
  onUpdate,
  onViewPdf,
}: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleBookmark = async () => {
    setBookmarking(true);
    try {
      const result = await api.toggleBookmark(paper.id);
      onUpdate({ ...paper, is_bookmarked: result.bookmarked });
    } catch {
      // silently fail
    } finally {
      setBookmarking(false);
    }
  };

  const handleMarkRead = async () => {
    try {
      const result = await api.toggleRead(paper.id);
      onUpdate({ ...paper, is_read: result.is_read });
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-xl border transition-all hover:bg-white/15 ${
        paper.is_read
          ? "border-white/10 opacity-75"
          : "border-white/20"
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-white leading-tight flex-1">
            <a
              href={paper.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition-colors"
            >
              {paper.title}
            </a>
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={paper.is_bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {paper.is_bookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-yellow-400" />
              ) : (
                <Bookmark className="w-5 h-5 text-blue-300" />
              )}
            </button>
            <button
              onClick={handleMarkRead}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={paper.is_read ? "Mark as unread" : "Mark as read"}
            >
              {paper.is_read ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-blue-300" />
              )}
            </button>
          </div>
        </div>

        {/* Authors & Date */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-blue-300/80 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {paper.authors.length > 3
              ? `${paper.authors.slice(0, 3).join(", ")} +${paper.authors.length - 3} more`
              : paper.authors.join(", ")}
          </span>
          {paper.pub_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {paper.pub_date}
            </span>
          )}
          {paper.venue && (
            <span className="text-blue-400/60 italic">{paper.venue}</span>
          )}
        </div>

        {/* Tags & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {paper.domain_tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-blue-600/30 text-blue-200 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {paper.domain_tags.length > 4 && (
            <span className="px-2.5 py-0.5 bg-blue-600/30 text-blue-200 rounded-full text-xs font-medium">
              +{paper.domain_tags.length - 4}
            </span>
          )}

          {paper.citation_count > 0 && (
            <span className="px-2.5 py-0.5 bg-amber-600/30 text-amber-200 rounded-full text-xs font-medium flex items-center gap-1">
              <Quote className="w-3 h-3" />
              {paper.citation_count} citations
            </span>
          )}

          {!paper.is_open_access && (
            <span className="px-2.5 py-0.5 bg-red-600/30 text-red-200 rounded-full text-xs font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Paywalled
            </span>
          )}

          <span className="px-2.5 py-0.5 bg-slate-600/30 text-slate-300 rounded-full text-xs">
            {paper.source}
          </span>
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200 transition-colors mb-2"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {expanded ? "Hide abstract" : "Show abstract"}
            </button>
            {expanded && (
              <p className="text-sm text-blue-100/70 leading-relaxed pl-5 border-l-2 border-blue-500/30">
                {paper.abstract}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
          {paper.external_link && (
            <a
              href={paper.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Paper
            </a>
          )}

          {paper.is_open_access && paper.pdf_link && (
            <>
              <button
                onClick={() => onViewPdf(paper.pdf_link)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-200 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View PDF
              </button>
              <a
                href={paper.pdf_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-200 rounded-lg text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
