import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Dashboard } from "@/pages/dashboard";
import { AddTransaction } from "@/pages/add-transaction";
import { History } from "@/pages/history";
import { Achievements } from "@/pages/achievements";
import { Settings } from "@/pages/settings";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "next-themes";
import { CurrencyProvider } from "@/hooks/use-currency";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add" component={AddTransaction} />
      <Route path="/history" component={History} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <CurrencyProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Layout>
                <Router />
              </Layout>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
