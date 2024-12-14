import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "@/Router";
import { Toast } from "@/components/base";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { SocketProvider } from "@/core/providers/SocketProvider";
import "@/i18n";
import { BrowserRouter } from "react-router-dom";
import { PageLoaderdProvider } from "@/core/providers/PageLoaderProvider";

function App() {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <PageLoaderdProvider>
                <AuthProvider>
                    <SocketProvider>
                        <BrowserRouter>
                            <Router />
                        </BrowserRouter>
                        <Toast.Area richColors />
                    </SocketProvider>
                </AuthProvider>
            </PageLoaderdProvider>
        </QueryClientProvider>
    );
}

export default App;
