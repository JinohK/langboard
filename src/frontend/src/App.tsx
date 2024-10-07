import "@/assets/styles/App.scss";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import ToastList from "@/components/ToastList";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { SocketProvider } from "@/core/providers/SocketProvider";
import "@/i18n";
import Router from "@/Router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
    const queryClient = new QueryClient();
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <SocketProvider>
                        <SuspenseComponent shouldWrapChildren={false}>
                            <Router />
                        </SuspenseComponent>
                        <ToastList />
                    </SocketProvider>
                </AuthProvider>
            </QueryClientProvider>
        </>
    );
}

export default App;
