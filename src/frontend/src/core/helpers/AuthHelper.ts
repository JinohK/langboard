import { REDIRECT_QUERY_NAME } from "@/controllers/constants";
import { ROUTES } from "@/core/routing/constants";

export const redirectToSignIn = () => {
    const searchParams = new URLSearchParams();
    searchParams.set(REDIRECT_QUERY_NAME, window.location.href);

    location.href = `${ROUTES.SIGN_IN}?${searchParams.toString()}`;
};
