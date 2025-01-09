import { useRef } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/AvatarUploader";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Box, Flex, Form, Input, Label, SubmitButton } from "@/components/base";
import useUpdateProfile from "@/controllers/api/account/useUpdateProfile";
import useForm from "@/core/hooks/form/useForm";
import { createNameInitials } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";

function ProfilePage(): JSX.Element {
    const { currentUser, updatedUser } = useAccountSetting();
    const [t] = useTranslation();
    const { mutate } = useUpdateProfile(updatedUser);
    const dataTransferRef = useRef(new DataTransfer());
    const isAvatarDeletedRef = useRef(false);
    const { errors, isValidating, handleSubmit, formRef, focusComponentRef } = useForm({
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
            delete_avatar: {},
        },
        inputRefs: {
            avatar: dataTransferRef,
            delete_avatar: isAvatarDeletedRef,
        },
        mutate,
        mutateOnSuccess: (data) => {
            updatedUser();
            data.createToast(t("myAccount.successes.Profile updated successfully."));
        },
        mutateOnSettled: () => {
            if (!focusComponentRef.current) {
                return;
            }

            setTimeout(() => {
                if (TypeUtils.isElement(focusComponentRef.current)) {
                    focusComponentRef.current.focus();
                } else if (TypeUtils.isString(focusComponentRef.current)) {
                    formRef.current?.[focusComponentRef.current]?.focus();
                }
            }, 0);
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Profile")}</h2>
            <Form.Root onSubmit={handleSubmit} ref={formRef}>
                <Flex
                    gap="10"
                    mt="11"
                    items={{
                        initial: "center",
                        md: "start",
                    }}
                    direction={{
                        initial: "col",
                        md: "row",
                    }}
                    justify={{
                        md: "center",
                    }}
                >
                    <AvatarUploader
                        userInitials={createNameInitials(currentUser.firstname, currentUser.lastname)}
                        initialAvatarUrl={currentUser.avatar}
                        dataTransferRef={dataTransferRef}
                        isDeletedRef={isAvatarDeletedRef}
                        isValidating={isValidating}
                        canRevertUrl
                        avatarSize={{
                            initial: "4xl",
                            md: "5xl",
                        }}
                    />
                    <Flex direction="col" gap="4" w="full" className="max-w-sm">
                        <Label display="grid" w="full" items="center" gap="1.5">
                            <Box>{t("user.Username")}</Box>
                            <Input disabled defaultValue={currentUser.username} />
                        </Label>
                        <Form.Field name="firstname">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.First Name")}</Box>
                                <Form.Control asChild>
                                    <Input autoComplete="firstname" disabled={isValidating} defaultValue={currentUser.firstname} />
                                </Form.Control>
                            </Label>
                            {errors.firstname && <FormErrorMessage error={errors.firstname} />}
                        </Form.Field>
                        <Form.Field name="lastname">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Last Name")}</Box>
                                <Form.Control asChild>
                                    <Input autoComplete="lastname" disabled={isValidating} defaultValue={currentUser.lastname} />
                                </Form.Control>
                            </Label>
                            {errors.lastname && <FormErrorMessage error={errors.lastname} />}
                        </Form.Field>
                        <Form.Field name="affiliation">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Affiliation")}</Box>
                                <Form.Control asChild>
                                    <Input
                                        autoComplete="affiliation"
                                        placeholder={t("user.What organization are you affiliated with?")}
                                        disabled={isValidating}
                                        defaultValue={currentUser.affiliation}
                                    />
                                </Form.Control>
                            </Label>
                        </Form.Field>
                        <Form.Field name="position">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Position")}</Box>
                                <Form.Control asChild>
                                    <Input
                                        autoComplete="position"
                                        placeholder={t("user.What is your position in your organization?")}
                                        disabled={isValidating}
                                        defaultValue={currentUser.position}
                                    />
                                </Form.Control>
                            </Label>
                        </Form.Field>
                    </Flex>
                </Flex>
                <Flex items="center" justify="center" gap="8" mt="16">
                    <SubmitButton type="submit" isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Form.Root>
        </>
    );
}

export default ProfilePage;
