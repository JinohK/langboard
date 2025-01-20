import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { FormOnlyLayout } from "@/components/Layout";
import { Button, Flex, Toast } from "@/components/base";
import useActivateUser from "@/controllers/api/auth/useActivateUser";
import { SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME } from "@/controllers/api/auth/useSignUp";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import usePageNavigate from "@/core/hooks/usePageNavigate";

function ActivatePage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const navigate = usePageNavigate();
    const location = useLocation();
    const { mutate } = useActivateUser();
    const [description, setDescription] = useState<JSX.Element | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!isLoaded) {
            setIsLoaded(true);
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get(SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME);

        if (!token) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }

        mutate(
            { signup_token: token },
            {
                onSuccess: () => {
                    setDescription(
                        <>
                            <h2 className="text-center text-2xl font-normal xs:text-3xl">{t("signUp.activate.Welcome to {app}!")}</h2>
                            <p className="mt-8 text-sm xs:text-base">
                                {t("signUp.activate.Your account is now active and ready to go!")}&nbsp;
                                {t("signUp.activate.Dive in and discover all the amazing features we have in store for you.")}
                            </p>
                            <p className="mt-4 text-sm xs:text-base">
                                {t("signUp.activate.Simply sign in with your email and password to get started.")}
                            </p>
                            <Flex justify="center" mt="8">
                                <Button onClick={() => navigate(ROUTES.SIGN_IN.EMAIL)}>{t("signIn.Sign in")}</Button>
                            </Flex>
                        </>
                    );
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            Toast.Add.error(t("signUp.errors.Account already activated. Please sign in."));
                            navigate(ROUTES.SIGN_IN.EMAIL);
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsLoadingRef.current(false);
                },
            }
        );
    }, [isLoaded]);

    return (
        <FormOnlyLayout size="sm" useLogo>
            {description}
        </FormOnlyLayout>
    );
}

export default ActivatePage;
