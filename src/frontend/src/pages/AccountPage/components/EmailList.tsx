import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import { Badge, Card, Flex, IconComponent, Separator, Skeleton, SubmitButton, Toast } from "@/components/base";
import useAddNewEmail from "@/controllers/api/account/useAddNewEmail";
import useDeleteSubEmail from "@/controllers/api/account/useDeleteSubEmail";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IEmailComponentProps } from "@/pages/AccountPage/components/types";

function SkeletonEmails(): JSX.Element {
    return (
        <>
            <Flex gap="3" p="3">
                <Skeleton h="6" w="16" />
                <Skeleton h="6" className="w-1/3" />
            </Flex>
            <Separator />
            <Flex items="center" justify="between" p="3">
                <Flex gap="3" w="full">
                    <Skeleton h="6" w="16" />
                    <Skeleton h="6" className="w-1/3" />
                </Flex>
                <Skeleton size="8" />
            </Flex>
        </>
    );
}

function EmailList({ user, updatedUser, isValidating, setIsValidating }: IEmailComponentProps): JSX.Element {
    const [t, i18n] = useTranslation();
    const { mutate: deleteSubEmailMutate, createRevertToastButton } = useDeleteSubEmail(updatedUser);
    const { mutate: resendNewEmailLinkMutate } = useAddNewEmail();

    const handleSubmit = (email: string) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        deleteSubEmailMutate(
            { email },
            {
                onSuccess: (data) => {
                    updatedUser();
                    const toastId = Toast.Add.success(t("myAccount.successes.Email deleted successfully."), {
                        actions: [createRevertToastButton(data.revert_key, () => toastId)],
                    });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: () => {
                            Toast.Add.error(t("myAccount.errors.Cannot delete primary email."));
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

    const handleResend = (email: string) => {
        setIsValidating(true);

        resendNewEmailLinkMutate(
            { is_resend: true, new_email: email, lang: i18n.language },
            {
                onSuccess: () => {
                    Toast.Add.success(t("myAccount.successes.Please check your inbox to verify your email."));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_304_NOT_MODIFIED]: () => {
                            updatedUser();
                            Toast.Add.error(t("myAccount.errors.The email is already verified."));
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("errors.Malformed request"));
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
        <Card.Root>
            <Card.Content className="p-0">
                {!user && <SkeletonEmails />}
                {user && (
                    <Flex gap="3" p="3">
                        <Badge>{t("myAccount.Primary")}</Badge>
                        <span>{user.email}</span>
                    </Flex>
                )}
                {user?.subemails.map((subEmail) => (
                    <Fragment key={`email-list-${subEmail.email}`}>
                        <Separator />
                        <Flex items="center" justify="between" p="3">
                            <Flex gap="3">
                                <Badge variant="secondary">{t(`myAccount.${subEmail.verified_at ? "Sub" : "Unverified"}`)}</Badge>
                                <span>{subEmail.email}</span>
                            </Flex>
                            <Flex gap="3">
                                {!subEmail.verified_at && (
                                    <SubmitButton
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleResend(subEmail.email)}
                                        isValidating={isValidating}
                                    >
                                        {t("myAccount.Resend")}
                                    </SubmitButton>
                                )}
                                <SubmitButton
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    onClick={() => handleSubmit(subEmail.email)}
                                    isValidating={isValidating}
                                >
                                    <IconComponent icon="trash-2" size="4" />
                                </SubmitButton>
                            </Flex>
                        </Flex>
                    </Fragment>
                ))}
            </Card.Content>
        </Card.Root>
    );
}

export default EmailList;
