import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Paper } from "@/types";
import PaperCard from "@/components/PaperCard";
import PdfViewer from "@/components/PdfViewer";
import {
  RefreshCw,
  LogOut,
  Settings,
  Filter,
  SortAsc,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Newspaper,
} from "lucide-react";

interface DashboardProps {
  onOpenSettings: () => void;
}

export default function Dashboard({ onOpenSettings }: DashboardProps) {
  const { user, logout } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string>("");
  const [error, setError] = useState("");

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [userDomains, setUserDomains] = useState<string[]>([]);

  // PDF viewer
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const loadPapers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.getPapers({
        page,
        page_size: PAGE_SIZE,
        domain: selectedDomain || undefined,
        sort_by: sortBy,
        bookmarked_only: bookmarkedOnly,
      });
      setPapers(result.papers);
      setTotal(result.total);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load papers");
    } finally {
      setLoading(false);
    }
  }, [page, selectedDomain, sortBy, bookmarkedOnly]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        setUserDomains(settings.domains.map((d) => d.name));
      })
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const result = await api.refresh();
      setActiveSource(result.source_used);
      setLastRefresh(result.timestamp);
      setPage(1);
      await loadPapers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePaperUpdate = (updatedPaper: Paper) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === updatedPaper.id ? updatedPaper : p))
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* PDF Viewer Overlay */}
      {pdfUrl && <PdfViewer url={pdfUrl} onClose={() => setPdfUrl(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-blue-400" />
            <h1 className="text-xl font-bold text-white">PaperFetcher</h1>
          </div>

          <div className="flex items-center gap-2">
            {activeSource && (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-xs">
                Source: {activeSource}
              </span>
            )}
            {lastRefresh && (
              <span className="hidden md:inline-flex text-xs text-blue-400/60">
                Updated: {new Date(lastRefresh).toLocaleString()}
              </span>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-300"
              title="Refresh papers"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-300"
              title="Domain settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
              <span className="text-sm text-blue-200 hidden sm:inline">
                {user?.username}
              </span>
              <button
                onClick={logout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-300"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
          {/* Domain Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setPage(1);
              }}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-800">
                All Domains
              </option>
              {userDomains.map((d) => (
                <option key={d} value={d} className="bg-slate-800">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-blue-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date" className="bg-slate-800">
                Newest First
              </option>
              <option value="citations" className="bg-slate-800">
                Most Cited
              </option>
            </select>
          </div>

          {/* Bookmarked Only */}
          <button
            onClick={() => {
              setBookmarkedOnly(!bookmarkedOnly);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              bookmarkedOnly
                ? "bg-yellow-600/30 text-yellow-200 border border-yellow-500/30"
                : "bg-white/10 text-blue-200 border border-white/10 hover:bg-white/15"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            Bookmarked
          </button>

          <span className="text-sm text-blue-400/60 ml-auto">
            {total} paper{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No papers yet
            </h2>
            <p className="text-blue-300/60 mb-6">
              Click the refresh button to fetch papers for your selected domains
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {refreshing ? "Fetching..." : "Fetch Papers Now"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onUpdate={handlePaperUpdate}
                  onViewPdf={(url) => setPdfUrl(url)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-blue-200">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={!hasMore}
                  className="p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
