import { Box, Button, Toast } from "@/components/base";
import useChangeInternalBotDefault from "@/controllers/api/settings/internalBots/useChangeDefaultInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotDefault = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const isDefault = internalBot.useField("is_default");
    const { mutateAsync } = useChangeInternalBotDefault(internalBot, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating) {
            return;
        }

        const promise = mutateAsync({});

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
            success: () => {
                return t("successes.Internal bot default changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Button size="sm" onClick={change} disabled={isDefault || isValidating}>
                {t("settings.Set as default")}
            </Button>
        </Box>
    );
});

export default InternalBotDefault;
