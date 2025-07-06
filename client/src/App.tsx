import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/auth-context";
import { LanguageProvider } from "./context/language-context";
import { NotificationProvider } from "./context/notification-context";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import Accounting from "./pages/accounting";
import CIT from "./pages/cit";
import VAT from "./pages/vat";
import Financials from "./pages/financials";
import Invoicing from "./pages/invoicing";
import TransferPricing from "./pages/transfer-pricing";
import Assistant from "./pages/assistant";
import Calendar from "./pages/calendar";
import Admin from "./pages/admin";
import Setup from "./pages/setup";
import Workflow from "./pages/workflow";
import CreditDebitNotes from "./components/financial/credit-debit-notes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/cit" component={CIT} />
        <Route path="/vat" component={VAT} />
        <Route path="/financials" component={Financials} />
        <Route path="/invoicing" component={Invoicing} />
        <Route path="/credit-debit-notes" component={CreditDebitNotes} />
        <Route path="/transfer-pricing" component={TransferPricing} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/admin" component={Admin} />
        <Route path="/setup" component={Setup} />
        <Route path="/workflow" component={Workflow} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <Toaster />
              <Router />
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
