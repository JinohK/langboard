import { Avatar, Button, Form, IconComponent, Input } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { createNameInitials } from "@/core/utils/StringUtils";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";

function OptionalForm({ values, nextStep }: Omit<ISignUpFormProps, "validateForm">): JSX.Element {
    const { t } = useTranslation();
    const dataTransfer = new DataTransfer();
    const [isValidating, setIsValidating] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>((values as unknown as Record<string, string>).avatarUrl ?? undefined);
    const handleUpload = useCallback((files: File[] | FileList | null) => {
        if (!files || !files.length) {
            setAvatarUrl(undefined);
            dataTransfer.items.clear();
            return;
        }

        const file = files[0];
        dataTransfer.items.add(file);

        const reader = new FileReader();
        reader.onload = () => {
            setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        onDrop: handleUpload,
        onFileDialogCancel: () => handleUpload(null),
    });

    if (values.avatar) {
        if (!dataTransfer.items.length) {
            dataTransfer.items.add(values.avatar);
        }

        if (!avatarUrl) {
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(values.avatar);
        }
    }

    const skipStep = () => {
        const newValues = { ...values };
        nextStep(newValues, ROUTES.SIGN_UP.OVERVIEW);
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const newValues = {
            ...values,
            avatar: dataTransfer?.files[0],
            avatarUrl,
            affiliation: event.currentTarget.affiliation.value,
            position: event.currentTarget.position.value,
        };

        nextStep(newValues, ROUTES.SIGN_UP.OVERVIEW);
    };

    return (
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={submitForm}>
            <Form.Field
                className="relative flex cursor-pointer justify-center transition-all duration-200 hover:opacity-80"
                {...getRootProps({ name: "avatar" })}
            >
                {isDragActive && (
                    // eslint-disable-next-line @/max-len
                    <div className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center border-2 border-dashed border-primary bg-background">
                        {t("signUp.Drop your avatar here")}
                    </div>
                )}
                <Avatar.Root className="h-20 w-20">
                    <Avatar.Image src={avatarUrl} alt="" />
                    <Avatar.Fallback className="text-4xl">{createNameInitials(values.firstname, values.lastname)}</Avatar.Fallback>
                </Avatar.Root>
                <Form.Control asChild>
                    <Input className="hidden" disabled={isValidating} {...getInputProps()} />
                </Form.Control>
            </Form.Field>
            <Form.Field name="affiliation">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("signUp.Affiliation")}
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
                        placeholder={t("signUp.Position")}
                        autoComplete="position"
                        defaultValue={values.position ?? ""}
                        disabled={isValidating}
                    />
                </Form.Control>
            </Form.Field>
            <div className="mt-16 flex items-center gap-6 max-xs:justify-between xs:justify-end xs:gap-8">
                <Button type="button" variant="outline" onClick={() => nextStep(values, ROUTES.SIGN_UP.ADDITIONAL)} disabled={isValidating}>
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
