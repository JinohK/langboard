import AvatarUploader from "@/components/AvatarUploader";
import { Button, Form, IconComponent, Input, Label, Toast } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import useUpdateProfile from "@/controllers/account/useUpdateProfile";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";
import { createNameInitials } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function ProfilePage(): JSX.Element {
    const { aboutMe, updatedUser } = useAuth();
    const [t] = useTranslation();
    const { mutate, createRevertToastButton } = useUpdateProfile(updatedUser);
    const dataTransferRef = useRef(new DataTransfer());
    const isAvatarDeletedRef = useRef(false);
    const user = aboutMe();
    const { errors, isValidating, handleSubmit, formRef, focusElementRef } = useForm({
        errorLangPrefix: "myAccount.errors",
        schema: {
            firstname: {
                required: true,
            },
            lastname: {
                required: true,
            },
            affiliation: {},
            position: {},
            avatar: { mimeType: "image/*" },
        },
        inputRefs: {
            avatar: dataTransferRef,
        },
        mutate,
        mutateOnSuccess: (data) => {
            updatedUser();
            const toastId = Toast.Add.success(t("myAccount.Profile updated successfully."), {
                actions: [createRevertToastButton(data.revert_key, () => toastId)],
            });
        },
        mutateOnSettled: () => {
            if (!focusElementRef.current) {
                return;
            }

            setTimeout(() => {
                if (TypeUtils.isElement(focusElementRef.current)) {
                    focusElementRef.current.focus();
                } else if (TypeUtils.isString(focusElementRef.current)) {
                    formRef.current?.[focusElementRef.current]?.focus();
                }
            }, 0);
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <>
            {user && (
                <>
                    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Profile")}</h2>
                    <Form.Root onSubmit={handleSubmit} ref={formRef}>
                        <div className="mt-11 flex gap-10 max-md:flex-col max-md:items-center md:justify-center">
                            <AvatarUploader
                                userInitials={createNameInitials(user.firstname, user.lastname)}
                                initialAvatarUrl={user.avatar}
                                dataTransferRef={dataTransferRef}
                                isDeletedRef={isAvatarDeletedRef}
                                isValidating={isValidating}
                                canRevertUrl
                                avatarSize={{
                                    initial: "4xl",
                                    md: "5xl",
                                }}
                            />
                            <div className="flex w-full max-w-sm flex-col gap-4">
                                <Label className="grid w-full items-center gap-1.5">
                                    <div>{t("user.Username")}</div>
                                    <Input disabled defaultValue={user.username} />
                                </Label>
                                <Form.Field name="firstname">
                                    <Label className="grid w-full items-center gap-1.5">
                                        <div>{t("user.First Name")}</div>
                                        <Form.Control asChild>
                                            <Input autoComplete="firstname" disabled={isValidating} defaultValue={user.firstname} />
                                        </Form.Control>
                                    </Label>
                                    {errors.firstname && <FormErrorMessage error={errors.firstname} />}
                                </Form.Field>
                                <Form.Field name="lastname">
                                    <Label className="grid w-full items-center gap-1.5">
                                        <div>{t("user.Last Name")}</div>
                                        <Form.Control asChild>
                                            <Input autoComplete="lastname" disabled={isValidating} defaultValue={user.lastname} />
                                        </Form.Control>
                                    </Label>
                                    {errors.lastname && <FormErrorMessage error={errors.lastname} />}
                                </Form.Field>
                                <Form.Field name="affiliation">
                                    <Label className="grid w-full items-center gap-1.5">
                                        <div>{t("user.Affiliation")}</div>
                                        <Form.Control asChild>
                                            <Input
                                                autoComplete="affiliation"
                                                placeholder={t("user.What organization are you affiliated with?")}
                                                disabled={isValidating}
                                                defaultValue={user.affiliation}
                                            />
                                        </Form.Control>
                                    </Label>
                                </Form.Field>
                                <Form.Field name="position">
                                    <Label className="grid w-full items-center gap-1.5">
                                        <div>{t("user.Position")}</div>
                                        <Form.Control asChild>
                                            <Input
                                                autoComplete="position"
                                                placeholder={t("user.What is your position in your organization?")}
                                                disabled={isValidating}
                                                defaultValue={user.position}
                                            />
                                        </Form.Control>
                                    </Label>
                                </Form.Field>
                            </div>
                        </div>
                        <div className="mt-16 flex items-center justify-center gap-8">
                            <Button type="submit" disabled={isValidating}>
                                {isValidating ? (
                                    <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" />
                                ) : (
                                    t("common.Save")
                                )}
                            </Button>
                        </div>
                    </Form.Root>
                </>
            )}
        </>
    );
}

export default ProfilePage;
