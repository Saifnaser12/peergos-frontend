import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/auth-context";
import { LanguageProvider } from "./context/language-context";
import { NotificationProvider } from "./context/notification-context";
import { TaxClassificationProvider } from "./context/tax-classification-context";
import { NavigationProvider } from "./context/navigation-context";
import { ErrorBoundary } from "./components/ui/error-boundary";
import EnhancedMainLayout from "./components/layout/enhanced-main-layout";
import { Suspense, useEffect } from "react";
import { registerServiceWorker } from "./hooks/use-offline";
import Dashboard from "./pages/dashboard";
import Bookkeeping from "./pages/Bookkeeping";
import Taxes from "./pages/Taxes";
import ComingSoonPage from "./pages/ComingSoonPage";
import Accounting from "./pages/accounting";
import CIT from "./pages/cit";
import VAT from "./pages/vat";
import Financials from "./pages/financials";
import Invoicing from "./pages/invoicing";
import TransferPricing from "./pages/transfer-pricing";
import TaxAssistant from "./pages/tax-assistant";
import Calendar from "./pages/calendar";
import Compliance from "./pages/compliance";
import Admin from "./pages/admin";
import Setup from "./pages/setup";
import Workflow from "./pages/workflow";
import Documents from "./pages/documents";
import EnhancedDataEntryPage from "./pages/enhanced-data-entry";
import CreditDebitNotes from "./components/financial/credit-debit-notes";
import CalculationTransparencyPage from "./pages/calculation-transparency";
import CalculationAudit from "./pages/calculation-audit";
import VisualDesignDemo from "./pages/visual-design-demo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <EnhancedMainLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          
          {/* New flat navigation routes */}
          <Route path="/bookkeeping" component={Bookkeeping} />
          <Route path="/taxes" component={Taxes} />
          <Route path="/ai" component={TaxAssistant} />
          <Route path="/roadmap" component={ComingSoonPage} />
          
          {/* Legacy routes for direct access */}
          <Route path="/accounting" component={Accounting} />
          <Route path="/cit" component={CIT} />
          <Route path="/vat" component={VAT} />
          <Route path="/financials" component={Financials} />
          <Route path="/invoicing" component={Invoicing} />
          <Route path="/credit-debit-notes" component={CreditDebitNotes} />
          <Route path="/transfer-pricing" component={TransferPricing} />
          <Route path="/tax-assistant" component={TaxAssistant} />
          <Route path="/assistant" component={TaxAssistant} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/admin" component={Admin} />
          <Route path="/setup" component={Setup} />
          <Route path="/workflow" component={Workflow} />
          <Route path="/documents" component={Documents} />
          <Route path="/enhanced-data-entry" component={EnhancedDataEntryPage} />
          <Route path="/calculation-transparency" component={CalculationTransparencyPage} />
          <Route path="/calculation-audit" component={CalculationAudit} />
          <Route path="/visual-design-demo" component={VisualDesignDemo} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </EnhancedMainLayout>
  );
}

function App() {
  // Register service worker for offline capabilities
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <NotificationProvider>
                <TaxClassificationProvider>
                  <NavigationProvider>
                    <Toaster />
                    <Router />
                  </NavigationProvider>
                </TaxClassificationProvider>
              </NotificationProvider>
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
