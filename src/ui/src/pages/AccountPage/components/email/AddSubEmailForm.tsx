import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Box, Flex, Floating, Form, Skeleton, SubmitButton, Toast } from "@/components/base";
import useAddNewEmail from "@/controllers/api/account/useAddNewEmail";
import useForm from "@/core/hooks/form/useForm";
import TypeUtils from "@/core/utils/TypeUtils";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";

export function SkeletonAddSubEmailForm(): JSX.Element {
    const [t] = useTranslation();

    return (
        <Box>
            <h4 className="pb-2 text-lg font-semibold tracking-tight">{t("myAccount.Add new email")}</h4>
            <Flex items="center" gap="2">
                <Flex items="center" w="64" rounded="md" h="9" border py="2" px="3" className="whitespace-nowrap border-input">
                    <Skeleton h="4" w="full" />
                </Flex>
                <Skeleton w="12" h="8" />
            </Flex>
        </Box>
    );
}

function AddSubEmailForm(): JSX.Element {
    const { currentUser, updatedUser, isValidating, setIsValidating } = useAccountSetting();
    const [t] = useTranslation();
    const { mutate } = useAddNewEmail();
    const { errors, setErrors, handleSubmit, formRef } = useForm({
        errorLangPrefix: "myAccount.errors",
        schema: {
            new_email: {
                required: true,
                email: true,
                custom: {
                    errorKey: "exists",
                    validate: (value) => {
                        if (!TypeUtils.isString(value) || currentUser.email === value) {
                            return false;
                        }

                        for (let i = 0; i < currentUser.subemails.length; ++i) {
                            if (currentUser.subemails[i].email === value) {
                                return false;
                            }
                        }

                        return true;
                    },
                },
            },
        },
        isValidatingState: [isValidating, setIsValidating],
        mutate,
        mutateOnSuccess: () => {
            setErrors({});
            Toast.Add.success(t("successes.Please check your inbox to verify your email."));
            formRef.current?.reset();
            updatedUser();
        },
        useDefaultBadRequestHandler: true,
    });

    return (
        <Box>
            <h4 className="pb-2 text-lg font-semibold tracking-tight">{t("myAccount.Add new email")}</h4>
            <Form.Root className="flex items-center gap-2" onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="new_email">
                    <Floating.LabelInput
                        label={t("user.Email")}
                        isFormControl
                        autoComplete="email"
                        disabled={isValidating}
                        className="h-9 w-64 py-2"
                    />
                    {errors.new_email && <FormErrorMessage error={errors.new_email} icon="circle-alert" />}
                </Form.Field>
                <SubmitButton type="submit" size="sm" isValidating={isValidating}>
                    {t("common.Save")}
                </SubmitButton>
            </Form.Root>
        </Box>
    );
}

export default AddSubEmailForm;
