import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Check, Plus, X, Sparkles } from "lucide-react";

interface DomainSelectorProps {
  onComplete: () => void;
}

export default function DomainSelector({ onComplete }: DomainSelectorProps) {
  const { updateUser, user } = useAuth();
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    new Set()
  );
  const [customDomain, setCustomDomain] = useState("");
  const [customDomains, setCustomDomains] = useState<string[]>([]);
  const [domainSource, setDomainSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const [domainsRes, settingsRes] = await Promise.all([
        api.getDomains(),
        api.getSettings(),
      ]);
      setAvailableDomains(domainsRes.domains);
      setDomainSource(domainsRes.source);

      if (settingsRes.domains.length > 0) {
        const presetSelected = new Set<string>();
        const customList: string[] = [];
        for (const d of settingsRes.domains) {
          if (d.is_custom) {
            customList.push(d.name);
          } else {
            presetSelected.add(d.name);
          }
        }
        setSelectedDomains(presetSelected);
        setCustomDomains(customList);
      }
    } catch {
      setError("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  const toggleDomain = (domain: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domain)) {
      newSelected.delete(domain);
    } else {
      newSelected.add(domain);
    }
    setSelectedDomains(newSelected);
  };

  const addCustomDomain = () => {
    const trimmed = customDomain.trim();
    if (trimmed && !customDomains.includes(trimmed)) {
      setCustomDomains([...customDomains, trimmed]);
      setCustomDomain("");
    }
  };

  const removeCustomDomain = (domain: string) => {
    setCustomDomains(customDomains.filter((d) => d !== domain));
  };

  const handleSave = async () => {
    const allDomains = [
      ...Array.from(selectedDomains).map((name) => ({
        name,
        is_custom: false,
      })),
      ...customDomains.map((name) => ({ name, is_custom: true })),
    ];

    if (allDomains.length === 0) {
      setError("Please select at least one domain");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.updateSettings(allDomains);
      if (user) {
        updateUser({ ...user, domains_selected: true });
      }
      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading domains...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Choose Your Research Domains
          </h1>
          <p className="text-blue-300">
            Select topics you're interested in to get personalized paper
            recommendations
          </p>
          {domainSource && domainSource !== "preset" && (
            <p className="text-blue-400/70 text-sm mt-1">
              Domains from: {domainSource}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Available Domains
          </h2>
          <div className="flex flex-wrap gap-3">
            {availableDomains.map((domain) => (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDomains.has(domain)
                    ? "bg-blue-600 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/25"
                    : "bg-white/10 text-blue-200 border-2 border-transparent hover:bg-white/20"
                }`}
              >
                {selectedDomains.has(domain) && (
                  <Check className="w-4 h-4 inline mr-1" />
                )}
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Custom Domains
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomDomain()}
              placeholder="Enter a custom research domain..."
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCustomDomain}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {customDomains.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600/50 text-purple-200 rounded-full text-sm"
                >
                  {domain}
                  <button
                    onClick={() => removeCustomDomain(domain)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={
              saving ||
              (selectedDomains.size === 0 && customDomains.length === 0)
            }
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-lg shadow-lg shadow-blue-500/25"
          >
            {saving ? "Saving..." : "Save & Start Exploring"}
          </button>
          <p className="text-blue-400/60 text-sm mt-3">
            {selectedDomains.size + customDomains.length} domain(s) selected
          </p>
        </div>
      </div>
    </div>
  );
}
