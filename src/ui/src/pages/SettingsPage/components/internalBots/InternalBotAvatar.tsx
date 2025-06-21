import AvatarUploader from "@/components/AvatarUploader";
import { Flex, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotAvatar = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const avatar = internalBot.useField("avatar");
    const { navigateRef } = useAppSetting();
    const dataTransferRef = useRef<DataTransfer>(new DataTransfer());
    const isAvatarDeletedRef = useRef(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });

    const onChange = useCallback(
        (files: File[] | FileList) => {
            if (isValidating || !files.length) {
                return;
            }

            setIsValidating(true);

            const file = files[0];
            const hasAvatar = !!avatar;

            const promise = mutateAsync({
                avatar: file,
            });

            showToast(promise, () => {
                if (hasAvatar) {
                    return t("settings.successes.Internal bot avatar changed successfully.");
                } else {
                    return t("settings.successes.Internal bot avatar uploaded successfully.");
                }
            });
        },
        [isValidating]
    );

    const onDeleted = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            delete_avatar: true,
        });

        showToast(promise, () => {
            return t("settings.successes.Internal bot avatar deleted successfully.");
        });
    };

    const showToast = (promise: Promise<unknown>, onSuccess: () => string) => {
        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: onSuccess,
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Flex items="center" direction="col" gap="2">
            <AvatarUploader
                isBot
                notInForm
                initialAvatarUrl={avatar}
                dataTransferRef={dataTransferRef}
                isDeletedRef={isAvatarDeletedRef}
                isValidating={isValidating}
                avatarSize={{
                    initial: "lg",
                    md: "2xl",
                }}
                onChange={onChange}
                onDeleted={onDeleted}
            />
        </Flex>
    );
});

export default InternalBotAvatar;
