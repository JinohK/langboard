import usePageNavigate from "@/core/hooks/usePageNavigate";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useEffect } from "react";

function HomePage(): JSX.Element {
    const navigate = usePageNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated()) {
            navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
        } else {
            navigate(ROUTES.SIGN_IN.EMAIL);
        }
    }, []);

    return <></>;
}

export default HomePage;
