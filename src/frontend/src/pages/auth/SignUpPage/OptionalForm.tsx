import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/AvatarUploader";
import { Button, Flex, Form, Input } from "@/components/base";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import { createNameInitials } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/auth/SignUpPage/types";
import { setInitialErrorsWithFocusingElement } from "@/pages/auth/SignUpPage/utils";
import SubmitButton from "@/components/SubmitButton";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";

function OptionalForm({ values, moveStep, initialErrorsRef }: ISignUpFormProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const { t } = useTranslation();
    const dataTransferRef = useRef(new DataTransfer());
    const avatarUrlRef = useRef<string | undefined>((values as unknown as Record<string, string>).avatarUrl ?? undefined);
    const { errors, setErrors, isValidating, handleSubmit, formRef } = useForm<Record<string, unknown>>({
        errorLangPrefix: "signUp.errors",
        schema: {
            avatar: { mimeType: "image/*" },
            affiliation: {},
            position: {},
        },
        inputRefs: {
            avatar: dataTransferRef,
        },
        successCallback: (data) => {
            const newValues = {
                ...values,
                ...data,
                avatar: dataTransferRef.current.files[0],
                avatarUrl: avatarUrlRef.current,
            };

            moveStep(newValues, ROUTES.SIGN_UP.OVERVIEW);
        },
    });

    useEffect(() => {
        setIsLoadingRef.current(false);
        setInitialErrorsWithFocusingElement(["avatar", "affiliation", "position"], initialErrorsRef, setErrors, formRef);
    }, []);

    if (values.avatar) {
        if (!dataTransferRef.current.items.length) {
            dataTransferRef.current.items.add(values.avatar);
        }
    }

    const skipStep = () => {
        const newValues = { ...values };
        moveStep(newValues, ROUTES.SIGN_UP.OVERVIEW);
    };

    return (
        <Form.Root className="mt-11 flex flex-col gap-4 xs:mt-0" onSubmit={handleSubmit} ref={formRef}>
            <AvatarUploader
                userInitials={createNameInitials(values.firstname, values.lastname)}
                initialAvatarUrl={(values as unknown as Record<string, string>).avatarUrl ?? undefined}
                dataTransferRef={dataTransferRef}
                avatarUrlRef={avatarUrlRef}
                errorMessage={errors.avatar}
                isValidating={isValidating}
                avatarSize="3xl"
            />
            <Form.Field name="affiliation">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("user.What organization are you affiliated with?")}
                        autoFocus
                        autoComplete="affiliation"
                        defaultValue={values.affiliation ?? ""}
                        disabled={isValidating}
                    />
                </Form.Control>
            </Form.Field>
            <Form.Field name="position">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("user.What is your position in your organization?")}
                        autoComplete="position"
                        defaultValue={values.position ?? ""}
                        disabled={isValidating}
                    />
                </Form.Control>
            </Form.Field>
            <Flex
                items="center"
                justify={{
                    initial: "between",
                    xs: "end",
                }}
                gap={{
                    initial: "6",
                    xs: "8",
                }}
                mt="16"
            >
                <Button type="button" variant="outline" onClick={() => moveStep(values, ROUTES.SIGN_UP.ADDITIONAL)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="button" variant="ghost" onClick={skipStep} disabled={isValidating}>
                    {t("common.Skip")}
                </Button>
                <SubmitButton type="submit" isValidating={isValidating}>
                    {t("common.Next")}
                </SubmitButton>
            </Flex>
        </Form.Root>
    );
}

export default OptionalForm;
