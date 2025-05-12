import { Box, Dialog } from "@/components/base";
import { MetadataList } from "@/components/MetadataList";
import MetadataAddButton from "@/components/MetadataList/MetadataAddButton";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const WikiMetadataDialog = memo(() => {
    const { setIsLoadingRef } = usePageHeader();
    const navigateRef = useRef(useNavigate());
    const [t] = useTranslation();
    const [projectUID, _, wikiUID] = location.pathname.split("/").slice(2);
    const errorsMap = (messageRef: { message: string }) => ({
        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
            messageRef.message = t("errors.Forbidden");
        },
        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
            messageRef.message = t("card.errors.Wiki not found.");
        },
        nonApiError: () => {
            messageRef.message = t("errors.Unknown error");
        },
        wildcardError: () => {
            messageRef.message = t("errors.Internal server error");
        },
    });

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const close = () => {
        navigateRef.current(ROUTES.BOARD.WIKI_PAGE(projectUID, wikiUID));
    };

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Content>
                <Dialog.Title>{t("metadata.Metadata")}</Dialog.Title>
                <Dialog.Description asChild className="text-base text-primary-foreground">
                    <Box>
                        <MetadataList
                            form={{
                                type: "project_wiki",
                                project_uid: projectUID,
                                uid: wikiUID,
                            }}
                            errorsMap={errorsMap}
                            canEdit={() => true}
                        />
                    </Box>
                </Dialog.Description>
                <Dialog.Footer>
                    <MetadataAddButton
                        form={{
                            type: "project_wiki",
                            project_uid: projectUID,
                            uid: wikiUID,
                        }}
                        errorsMap={errorsMap}
                    />
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
});

export default WikiMetadataDialog;
