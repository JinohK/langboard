import { Navigate } from "react-router-dom";
import { REDIRECT_QUERY_NAME, ROUTES } from "@/core/routing/constants";

export const redirectToSignIn = () => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has(REDIRECT_QUERY_NAME)) {
        searchParams.set(REDIRECT_QUERY_NAME, location.href);
    }

    location.href = `${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`;
};

export const RedirectToSignIn = (): JSX.Element => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has(REDIRECT_QUERY_NAME)) {
        searchParams.set(REDIRECT_QUERY_NAME, location.href);
    }

    return <Navigate to={`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`} />;
};
