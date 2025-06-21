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
                <BrowserRouter>
                    <AuthProvider>
                        <SocketProvider>
                            <GlobalSocketHandlersSubscriber>
                                <Router />
                                <Toast.Area richColors />
                            </GlobalSocketHandlersSubscriber>
                        </SocketProvider>
                    </AuthProvider>
                </BrowserRouter>
            </PageHeaderProvider>
        </QueryClientProvider>
    );
}

export default App;
