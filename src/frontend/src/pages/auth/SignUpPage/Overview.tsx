import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Box, Button, Card, Flex, SubmitButton, Toast } from "@/components/base";
import useSignUp, { ISignUpForm } from "@/controllers/api/auth/useSignUp";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import { StringCase, createNameInitials } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/auth/SignUpPage/types";
import { useNavigate } from "react-router-dom";

function Overview({ values, moveStep }: Omit<ISignUpFormProps, "initialErrorsRef">): JSX.Element {
    const cardContentList: (keyof ISignUpForm)[] = ["email", "industry", "purpose", "affiliation", "position"];
    const [t] = useTranslation();
    const navigate = useNavigate();
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
        },
        failCallback,
        mutate,
        mutateOnSuccess: () => {
            navigate(ROUTES.SIGN_UP.COMPLETE, { state: { email: values.email } });
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_409_CONFLICT]: () => {
                Toast.Add.error(t("signUp.errors.invalid.email-exists"));
                moveStep(values, ROUTES.SIGN_UP.REQUIRED, { email: t("signUp.errors.invalid.email-exists") });
            },
            [EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE]: () => {
                navigate(ROUTES.SIGN_UP.COMPLETE, { state: { email: values.email } });
                setTimeout(() => {
                    Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
                }, 0);
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
                <Box position="absolute" left="0" top="0" h="24" w="full" className="rounded-t-lg bg-primary" />
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
                            <Flex items="center" justify="between" py="4" key={key} className="border-card-border border-b">
                                <p className="text-sm text-muted-foreground">{t(`user.${new StringCase(key).toPascal()}`)}</p>
                                <p className="text-sm">{translate(key, value)}</p>
                            </Flex>
                        );
                    })}
                </Card.Content>
            </Card.Root>
            <Flex items="center" justify={{ initial: "between", xs: "end" }} gap="8" mt="16">
                <Button type="button" variant="outline" onClick={() => moveStep(values, ROUTES.SIGN_UP.OPTIONAL)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <SubmitButton type="button" onClick={() => handleSubmit({ ...values })} isValidating={isValidating}>
                    {t("signUp.Sign up")}
                </SubmitButton>
            </Flex>
        </>
    );
}

export default Overview;
