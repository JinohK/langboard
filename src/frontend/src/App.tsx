import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "@/Router";
import { Toast } from "@/components/base";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { SocketProvider } from "@/core/providers/SocketProvider";
import "@/i18n";
import { BrowserRouter } from "react-router-dom";
import { PageHeaderProvider } from "@/core/providers/PageHeaderProvider";
import { GlobalSocketHandlersSubscriber } from "@/core/providers/GlobalSocketHandlersSubscriber";

function App() {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <PageHeaderProvider>
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
            </PageHeaderProvider>
        </QueryClientProvider>
    );
}

export default App;
