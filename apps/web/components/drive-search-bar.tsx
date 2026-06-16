"use client";

import { useState, useDeferredValue, useMemo } from "react";
import { Search, X } from "lucide-react";
export function DriveSearchBar() {
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const deferredQuery = useDeferredValue(query);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (!newQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      params.append("q", newQuery);
      params.append("workspaceId", "default");
      if (fileType) params.append("fileType", fileType);

      const response = await fetch(`/api/drive/files?${params}`);
      const data = await response.json();
      setResults(data.files || []);
    } catch (error) {
      console.error("[v0] Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getCategoryIcon = (file: any) => {
    if (file.listing) return "Property";
    if (file.deal) return "Deal";
    if (file.client) return "Client";
    if (file.lease) return "Lease";
    return "File";
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5">
          <Search className="size-4 text-[color:var(--muted)]" />
          <input
            type="text"
            placeholder="Search files by name, property, deal, or client..."
            value={query}
            onChange={handleSearch}
            className="flex-1 bg-transparent text-[13px] placeholder-[color:var(--muted)] outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="text-[color:var(--muted)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-[13px] outline-none"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
          <option value="document">Documents</option>
          <option value="spreadsheet">Spreadsheets</option>
          <option value="presentation">Presentations</option>
          <option value="video">Videos</option>
          <option value="archive">Archives</option>
        </select>
      </div>

      {/* Search Results */}
      {query && (
        <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-medium text-[color:var(--muted)]">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {isSearching && (
              <p className="text-[11px] text-[color:var(--muted)]">Searching...</p>
            )}
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {results.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-[8px] bg-[color:var(--surface-muted)] p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12px] font-medium text-[color:var(--foreground)]">
                    {file.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-[color:rgba(39,26,0,0.1)] px-2 py-0.5 text-[9px] font-medium text-[color:var(--muted)]">
                      {getCategoryIcon(file)}
                    </span>
                    {file.listing && (
                      <span className="text-[9px] text-[color:var(--muted)]">
                        {file.listing.title}
                      </span>
                    )}
                    {file.deal && (
                      <span className="text-[9px] text-[color:var(--muted)]">
                        {file.deal.title}
                      </span>
                    )}
                    {file.client && (
                      <span className="text-[9px] text-[color:var(--muted)]">
                        {file.client.fullName}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={file.blobUrl}
                  download
                  className="rounded-full p-1.5 transition-colors hover:bg-[color:var(--surface)]"
                >
                  <Search className="size-3.5 text-[color:var(--muted)]" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
