import { Flex, IconComponent, Toast } from "@/components/base";
import useDeleteWiki from "@/controllers/api/wiki/useDeleteWiki";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { IDraggableProjectWiki, TMoreWikiTabDropzonCallbacks } from "@/pages/BoardPage/components/wiki/types";
import { useDroppable } from "@dnd-kit/core";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiBinProps {
    moreDroppableZoneCallbacksRef: React.MutableRefObject<TMoreWikiTabDropzonCallbacks>;
}

const WIKI_BIN_ID = "WikiBin";

const WikiBin = memo(({ moreDroppableZoneCallbacksRef }: IWikiBinProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: WIKI_BIN_ID,
    });
    const { projectUID, wikis, setWikis } = useBoardWiki();
    const { mutateAsync: deleteWikiMutateAsync } = useDeleteWiki();
    const [t] = useTranslation();

    moreDroppableZoneCallbacksRef.current[WIKI_BIN_ID] = {
        onDragEnd: (originalWiki) => {
            setWikis((prev) => prev.filter((wiki) => wiki.uid !== originalWiki.uid));

            const promise = deleteWikiMutateAsync({
                project_uid: projectUID,
                wiki_uid: originalWiki.uid,
            });

            const toastId = Toast.Add.promise(promise, {
                loading: t("common.Deleting..."),
                error: (error) => {
                    let message = "";
                    const { handle } = setupApiErrorHandler({
                        nonApiError: () => {
                            message = t("errors.Unknown error");
                        },
                        wildcardError: () => {
                            message = t("errors.Internal server error");
                        },
                    });

                    handle(error);
                    return message;
                },
                success: () => {
                    setWikis((prev) => prev.filter((wiki) => wiki.uid !== originalWiki.uid));
                    return t("wiki.successes.Wiki page deleted successfully.");
                },
                finally: () => {
                    Toast.Add.dismiss(toastId);
                },
            });
        },
        onDragOverOrMove: (activeWiki) => {
            if (activeWiki.isInBin) {
                return;
            }

            const targetWiki = wikis.find((wiki) => wiki.uid === activeWiki.uid);
            if (!targetWiki) {
                return;
            }

            (targetWiki as IDraggableProjectWiki).isInBin = true;
            setWikis((prev) => [...prev]);
        },
    };

    return (
        <Flex
            items="center"
            justify="center"
            position="fixed"
            bottom="2"
            size="14"
            rounded="full"
            className={cn("left-1/2 -translate-x-1/2 bg-secondary transition-all duration-200", isOver ? "bg-destructive" : "opacity-80")}
            ref={setNodeRef}
        >
            <IconComponent icon="trash-2" size="6" />
        </Flex>
    );
});

export default WikiBin;
