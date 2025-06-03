import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { QUERY_NAMES } from "@/constants";
import { FormOnlyLayout } from "@/components/Layout";
import { Button, Flex } from "@/components/base";
import useActivateUser from "@/controllers/api/auth/useActivateUser";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { useNavigate } from "react-router-dom";

function ActivatePage(): JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate } = useActivateUser();
    const [description, setDescription] = useState<JSX.Element | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setPageAliasRef.current("Activate Account");
        if (!isLoaded) {
            setIsLoaded(true);
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get(QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN);

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
                        [EHttpStatus.HTTP_404_NOT_FOUND]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)),
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: {
                            after: () => navigate(ROUTES.SIGN_IN.EMAIL),
                        },
                    });

                    handle(error);
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
