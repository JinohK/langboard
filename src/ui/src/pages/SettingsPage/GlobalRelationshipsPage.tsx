import { Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteSelectedGlobalRelationships from "@/controllers/api/settings/relationships/useDeleteSelectedGlobalRelationships";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import GlobalRelationshipList from "@/pages/SettingsPage/components/relationships/GlobalRelationshipList";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function GlobalRelationshipsPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { navigateRef, isValidating, setIsValidating } = useAppSetting();
    const [selectedGlobalRelationships, setSelectedGlobalRelationships] = useState<string[]>([]);
    const { mutate: deleteSelectedGlobalRelationshipsMutate } = useDeleteSelectedGlobalRelationships();

    useEffect(() => {
        setPageAliasRef.current("Global relationships");
    }, []);

    const deleteSelectedGlobalRelationships = () => {
        if (isValidating || !selectedGlobalRelationships.length) {
            return;
        }

        setIsValidating(true);

        deleteSelectedGlobalRelationshipsMutate(
            {
                relationship_type_uids: selectedGlobalRelationships,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("settings.successes.Selected global relationship types deleted successfully."));
                    setSelectedGlobalRelationships([]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
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

    const openCreateDialog = () => {
        navigateRef.current(ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP);
    };

    return (
        <>
            <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 tracking-tight">
                <span className="max-w-72 truncate">{t("settings.Global relationships")}</span>
                <Flex gap="2" wrap justify="end">
                    {selectedGlobalRelationships.length > 0 && (
                        <Button variant="destructive" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={deleteSelectedGlobalRelationships}>
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
            <GlobalRelationshipList
                selectedGlobalRelationships={selectedGlobalRelationships}
                setSelectedGlobalRelationships={setSelectedGlobalRelationships}
            />
        </>
    );
}

export default GlobalRelationshipsPage;
