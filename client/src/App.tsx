import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useStore } from "@/lib/store";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import Home from "@/pages/Home";
import { LoginScreen } from "@/components/auth/LoginScreen";
import DashboardPage from "@/pages/DashboardPage";
import AccountsPage from "@/pages/AccountsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import AgentsPage from "@/pages/AgentsPage";
import StatusPage from "@/pages/StatusPage";
import ProofPage from "@/pages/ProofPage";
import UsdtCalcPage from "@/pages/UsdtCalcPage";
import SettingsPage from "@/pages/SettingsPage";
import BulkCalcPage from "@/pages/BulkCalcPage";
import RiskAnalysisPage from "@/pages/RiskAnalysisPage";

// The Grok panel pulls in the markdown/syntax-highlighting stack (Streamdown +
// Shiki), so load it only when the operator actually opens the chat.
const GrokPanel = lazy(() =>
  import("@/components/GrokPanel").then((m) => ({ default: m.GrokPanel }))
);

function PageRenderer() {
  const { currentPage } = useStore();
  switch (currentPage) {
    case 'dashboard': return <DashboardPage />;
    case 'accounts': return <AccountsPage />;
    case 'expenses': return <ExpensesPage />;
    case 'agents': return <AgentsPage />;
    case 'status': return <StatusPage />;
    case 'proof': return <ProofPage />;
    case 'usdt-calc': return <UsdtCalcPage />;
    case 'bulk-calc': return <BulkCalcPage />;
    case 'risk-analysis': return <RiskAnalysisPage />;
    case 'settings': return <SettingsPage />;
    default: return <DashboardPage />;
  }
}
function AppLayout() {
  // make sure to consider if you need authentication for certain routes
  const grokOpen = useStore((s) => s.grokOpen);
  return (
    <div className="min-h-screen bg-[#0F1419]">
      <TopBar />
      <div className="flex max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6">
        <Sidebar />
        <main className="flex-1 py-4 lg:pl-4 min-w-0 pb-20 lg:pb-4">
          <PageRenderer />
        </main>
      </div>
      <BottomNav />
      {grokOpen && (
        <Suspense fallback={null}>
          <GrokPanel />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  // Flow: command-center landing → single-operator login → dashboard.
  // A successful login persists for the browser session so reloads skip ahead;
  // logout (from the top bar) clears it and returns to the login screen.
  const stage = useStore((s) => s.authStage);
  const setStage = useStore((s) => s.setAuthStage);

  const renderStage = () => {
    switch (stage) {
      case "landing":
        return <Home onEnter={() => setStage("login")} />;
      case "login":
        return <LoginScreen onSuccess={() => setStage("app")} />;
      default:
        return <AppLayout />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {renderStage()}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
