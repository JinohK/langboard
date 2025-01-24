import { Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteSelectedSettings from "@/controllers/api/settings/useDeleteSelectedSettings";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import WebhookList from "@/pages/SettingsPage/components/webhook/WebhookList";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function WebhooksPage() {
    const [t] = useTranslation();
    const { navigate, isValidating, setIsValidating } = useAppSetting();
    const [selectedWebhooks, setSelectedWebhooks] = useState<string[]>([]);
    const { mutate: deleteSelectedSettingsMutate } = useDeleteSelectedSettings();

    const openCreateDialog = () => {
        navigate.current(ROUTES.SETTINGS.CREATE_WEBHOOK);
    };

    const deleteSelectedSettings = () => {
        if (isValidating || !selectedWebhooks.length) {
            return;
        }

        setIsValidating(true);

        deleteSelectedSettingsMutate(
            {
                setting_uids: selectedWebhooks,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("settings.successes.Selected webhooks deleted successfully."));
                    setSelectedWebhooks([]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("errors.Malformed request"));
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
        <>
            <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 tracking-tight">
                <span className="w-36">{t("settings.Webhooks")}</span>
                <Flex gap="2" wrap justify="end">
                    {selectedWebhooks.length > 0 && (
                        <Button variant="destructive" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={deleteSelectedSettings}>
                            <IconComponent icon="trash" size="4" />
                            {t("common.Delete")}
                        </Button>
                    )}
                    <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={openCreateDialog}>
                        <IconComponent icon="plus" size="4" />
                        {t("settings.Add new")}
                    </Button>
                </Flex>
            </Flex>
            <WebhookList selectedWebhooks={selectedWebhooks} setSelectedWebhooks={setSelectedWebhooks} />
        </>
    );
}

export default WebhooksPage;
