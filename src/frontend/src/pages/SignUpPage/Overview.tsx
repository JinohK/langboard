import { Avatar, Button, Card, IconComponent, Toast } from "@/components/base";
import useSignUp, { ISignUpForm } from "@/controllers/signup/useSignUp";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import { createNameInitials, StringCase } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

function Overview({ values, moveStep }: Omit<ISignUpFormProps, "initialErrorsRef">): JSX.Element {
    const cardContentList: (keyof ISignUpForm)[] = ["email", "industry", "purpose", "affiliation", "position"];
    const [t, i18n] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate } = useSignUp();
    const failCallback = useCallback((errors?: Record<string, string>) => {
        if (!errors) {
            return;
        }

        const requiredFormFields = ["email", "firstname", "lastname", "password"];
        const additionalFormFields = ["industry", "purpose"];
        const optionalFormFields = ["avatar", "affiliation", "position"];

        for (let i = 0; i < requiredFormFields.length; ++i) {
            const key = requiredFormFields[i];
            if (errors[key]) {
                moveStep(values, ROUTES.SIGN_UP.REQUIRED, errors);
                return;
            }
        }

        for (let i = 0; i < additionalFormFields.length; ++i) {
            const key = additionalFormFields[i];
            if (errors[key]) {
                moveStep(values, ROUTES.SIGN_UP.ADDITIONAL, errors);
                return;
            }
        }

        for (let i = 0; i < optionalFormFields.length; ++i) {
            const key = optionalFormFields[i];
            if (errors[key]) {
                moveStep(values, ROUTES.SIGN_UP.OPTIONAL, errors);
                return;
            }
        }
    }, []);
    const { isValidating, handleSubmit } = useForm({
        errorLangPrefix: "signUp.errors",
        schema: {
            email: { required: true, email: true },
            firstname: { required: true },
            lastname: { required: true },
            password: { required: true },
            industry: { required: true },
            purpose: { required: true },
            avatar: { mimeType: "image/*" },
            affiliation: {},
            position: {},
            lang: { required: true },
        },
        failCallback,
        mutate,
        mutateOnSuccess: () => {
            const searchParams = new URLSearchParams(location.search);
            navigate(`${ROUTES.SIGN_UP.COMPLETE}?${searchParams.toString()}`, { state: { email: values.email } });
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_409_CONFLICT]: () => {
                Toast.Add.error(t("signUp.errors.invalid.email-exists"));
                moveStep(values, ROUTES.SIGN_UP.REQUIRED, { email: t("signUp.errors.invalid.email-exists") });
            },
            [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
            },
        },
        useDefaultBadRequestHandler: true,
        badRequestHandlerCallback: (errors) => {
            failCallback(errors);
        },
    });

    const translate = (key: string, value: string) => {
        if (key === "industry") {
            return t(`user.industries.${value}`);
        } else if (key === "purpose") {
            return t(`signUp.purposes.${value}`);
        } else {
            return value;
        }
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
                                <p className="text-sm text-muted-foreground">{t(`user.${new StringCase(key).toPascal()}`)}</p>
                                <p className="text-sm">{translate(key, value)}</p>
                            </div>
                        );
                    })}
                </Card.Content>
            </Card.Root>
            <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                <Button type="button" variant="outline" onClick={() => moveStep(values, ROUTES.SIGN_UP.OPTIONAL)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="button" onClick={() => handleSubmit({ ...values, lang: i18n.language })} disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("signUp.Sign up")}
                </Button>
            </div>
        </>
    );
}

export default Overview;
