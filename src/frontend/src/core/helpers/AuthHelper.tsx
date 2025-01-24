import { Navigate } from "react-router-dom";
import { QUERY_NAMES } from "@/constants";
import { ROUTES } from "@/core/routing/constants";

export const redirectToSignIn = () => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has(QUERY_NAMES.REDIRECT)) {
        searchParams.set(QUERY_NAMES.REDIRECT, location.href);
    }

    location.href = `${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`;
};

export const RedirectToSignIn = (): JSX.Element => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has(QUERY_NAMES.REDIRECT)) {
        searchParams.set(QUERY_NAMES.REDIRECT, location.href);
    }

    return <Navigate to={`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`} />;
};
