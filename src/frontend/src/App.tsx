import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "@/Router";
import { Toast } from "@/components/base";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { SocketProvider } from "@/core/providers/SocketProvider";
import "@/i18n";
import { BrowserRouter } from "react-router-dom";
import { PageLoaderProvider } from "@/core/providers/PageLoaderProvider";
import { GlobalSocketHandlersSubscriber } from "@/core/providers/GlobalSocketHandlersSubscriber";

function App() {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <PageLoaderProvider>
                <AuthProvider>
                    <SocketProvider>
                        <GlobalSocketHandlersSubscriber>
                            <BrowserRouter>
                                <Router />
                            </BrowserRouter>
                            <Toast.Area richColors />
                        </GlobalSocketHandlersSubscriber>
                    </SocketProvider>
                </AuthProvider>
            </PageLoaderProvider>
        </QueryClientProvider>
    );
}

export default App;
