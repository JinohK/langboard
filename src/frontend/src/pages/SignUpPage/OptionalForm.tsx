import { Button, Form, IconComponent, Input } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { createNameInitials } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/AvatarUploader";
import useForm from "@/core/hooks/form/useForm";
import { setInitialErrorsWithFocusingElement } from "@/pages/SignUpPage/utils";

function OptionalForm({ values, moveStep, initialErrorsRef }: ISignUpFormProps): JSX.Element {
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
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={handleSubmit} ref={formRef}>
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
            <div className="mt-16 flex items-center gap-6 max-xs:justify-between xs:justify-end xs:gap-8">
                <Button type="button" variant="outline" onClick={() => moveStep(values, ROUTES.SIGN_UP.ADDITIONAL)} disabled={isValidating}>
                    {t("common.Back")}
                </Button>
                <Button type="button" variant="ghost" onClick={skipStep} disabled={isValidating}>
                    {t("common.Skip")}
                </Button>
                <Button type="submit" disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                </Button>
            </div>
        </Form.Root>
    );
}

export default OptionalForm;
