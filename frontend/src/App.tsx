import { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import DomainSelector from "@/pages/DomainSelector";
import Dashboard from "@/pages/Dashboard";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, loading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!user.domains_selected || showSettings) {
    return (
      <DomainSelector
        onComplete={() => setShowSettings(false)}
      />
    );
  }

  return <Dashboard onOpenSettings={() => setShowSettings(true)} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
