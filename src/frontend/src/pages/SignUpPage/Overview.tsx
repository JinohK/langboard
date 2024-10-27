import { Avatar, Button, Card, IconComponent, Toast } from "@/components/base";
import useSignUp, { ISignUpForm } from "@/controllers/signup/useSignUp";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { createNameInitials } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

function Overview({ values, nextStep }: Omit<ISignUpFormProps, "validateForm">): JSX.Element {
    const cardContentList: (keyof ISignUpForm)[] = ["email", "industry", "purpose", "affiliation", "position"];
    const [t, i18n] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutate } = useSignUp();

    const translate = (key: string, value: string) => {
        if (key === "industry") {
            return t(`signUp.industries.${value}`);
        } else if (key === "purpose") {
            return t(`signUp.purposes.${value}`);
        } else {
            return value;
        }
    };

    const handleSubmit = async () => {
        setIsValidating(true);
        mutate(
            { ...values, lang: i18n.language },
            {
                onSuccess: () => {
                    const searchParams = new URLSearchParams(location.search);
                    navigate(`${ROUTES.SIGN_UP.COMPLETE}?${searchParams.toString()}`, { state: { email: values.email } });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            Toast.Add.error(t("signUp.errors.invalid.email-exists"));
                            nextStep(values, ROUTES.SIGN_UP.REQUIRED);
                        },
                        [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                            Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <Card.Root className="relative">
                <div className="absolute left-0 top-0 h-24 w-full rounded-t-lg bg-primary" />
                <Card.Header className="relative space-y-0 bg-transparent">
                    <Avatar.Root className="absolute top-10" size="2xl">
                        <Avatar.Image src={(values as unknown as Record<string, string>).avatarUrl} alt="" />
                        <Avatar.Fallback>{createNameInitials(values.firstname, values.lastname)}</Avatar.Fallback>
                    </Avatar.Root>
                    <Card.Title className="ml-24 pt-6">
                        {values.firstname} {values.lastname}
                        <Card.Description className="mt-1">
                            @{values.email.split("@")[0]}-{values.email.split("@")[1].split(".")[0]}
                        </Card.Description>
                    </Card.Title>
                </Card.Header>
                <Card.Content className="pt-3">
                    {cardContentList.map((key) => {
                        const value = values[key];
                        if (!value) {
                            return null;
                        }

                        return (
                            <div key={key} className="border-card-border flex items-center justify-between border-b py-4">
                                <p className="text-sm text-muted-foreground">{t(`signUp.overview.${key}`)}</p>
                                <p className="text-sm">{translate(key, value)}</p>
                            </div>
                        );
                    })}
                </Card.Content>
            </Card.Root>
            <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                <Button type="button" variant="outline" onClick={() => nextStep(values, ROUTES.SIGN_UP.OPTIONAL)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("signUp.Sign up")}
                </Button>
            </div>
        </>
    );
}

export default Overview;
