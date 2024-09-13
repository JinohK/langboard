import "@/assets/styles/App.scss";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import ToastList from "@/components/ToastList";
import { AuthProvider } from "@/core/providers/AuthProvider";
import "@/i18n";
import Router from "@/Router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
    const queryClient = new QueryClient();
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <SuspenseComponent shouldWrapChildren={false}>
                        <Router />
                    </SuspenseComponent>
                    <ToastList />
                </AuthProvider>
            </QueryClientProvider>
        </>
    );
}

export default App;
