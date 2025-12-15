import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CRMProvider } from "./contexts/CRMContext";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import CallLogPage from "./pages/CallLogPage";
import LeadsPage from "./pages/LeadsPage";
import OrdersPage from "./pages/OrdersPage";
import AgingTrackerPage from "./pages/AgingTrackerPage";
import TasksPage from "./pages/TasksPage";
import HandoverPage from "./pages/HandoverPage";
import MasterDataPage from "./pages/MasterDataPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CRMProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calls" element={<CallLogPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/aging" element={<AgingTrackerPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/handover" element={<HandoverPage />} />
              <Route path="/master" element={<MasterDataPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CRMProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
