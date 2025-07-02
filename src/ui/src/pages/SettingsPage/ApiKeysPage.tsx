import { Button, Flex, IconComponent, Toast } from "@/components/base";
import ComingSoon from "@/components/ComingSoon";
import useDeleteSelectedSettings from "@/controllers/api/settings/useDeleteSelectedSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import ApiKeyList from "@/pages/SettingsPage/components/keys/ApiKeyList";
import { EHttpStatus } from "@langboard/core/enums";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function ApiKeysPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { isValidating, setIsValidating } = useAppSetting();
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const { mutate: deleteSelectedSettingsMutate } = useDeleteSelectedSettings();
    const navigate = usePageNavigateRef();

    useEffect(() => {
        setPageAliasRef.current("API keys");
    }, []);

    const openCreateDialog = () => {
        navigate(ROUTES.SETTINGS.CREATE_API_KEY);
    };

    const deleteSelectedSettings = () => {
        if (isValidating || !selectedKeys.length) {
            return;
        }

        setIsValidating(true);

        deleteSelectedSettingsMutate(
            {
                setting_uids: selectedKeys,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Selected API keys deleted successfully."));
                    setSelectedKeys([]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
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
                <span className="w-36">{t("settings.API keys")}</span>
                <Flex gap="2" wrap justify="end">
                    {selectedKeys.length > 0 && (
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
            <ApiKeyList selectedKeys={selectedKeys} setSelectedKeys={setSelectedKeys} />
        </>
    );
}
ApiKeysPage.displayName = "ApiKeysPage";

function CommingSoonApiKeysPage() {
    const [t] = useTranslation();
    return (
        <>
            <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 tracking-tight">
                <span className="w-36">{t("settings.API keys")}</span>
            </Flex>
            <ComingSoon />
        </>
    );
}

export default CommingSoonApiKeysPage;
