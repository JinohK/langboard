import AvatarUploader from "@/components/AvatarUploader";
import { Flex, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const BotAvatar = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const avatar = bot.useField("avatar");
    const navigate = usePageNavigateRef();
    const dataTransferRef = useRef<DataTransfer>(new DataTransfer());
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(bot, { interceptToast: true });

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
                    return t("successes.Bot avatar changed successfully.");
                } else {
                    return t("successes.Bot avatar uploaded successfully.");
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
            return t("successes.Bot avatar deleted successfully.");
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
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
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
                isValidating={isValidating}
                avatarSize={{
                    initial: "lg",
                    md: "2xl",
                }}
                rootClassName="max-w-screen-xs"
                onChange={onChange}
                onDeleted={onDeleted}
            />
        </Flex>
    );
});

export default BotAvatar;
