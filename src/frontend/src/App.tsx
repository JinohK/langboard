import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "@/Router";
import { Toast } from "@/components/base";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { SocketProvider } from "@/core/providers/SocketProvider";
import "@/i18n";

function App() {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SocketProvider>
                    <Router />
                    <Toast.Area richColors />
                </SocketProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
