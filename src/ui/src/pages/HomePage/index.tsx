import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useEffect } from "react";

function HomePage(): JSX.Element {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
        } else {
            navigate(ROUTES.SIGN_IN.EMAIL);
        }
    }, []);

    return <></>;
}

export default HomePage;
