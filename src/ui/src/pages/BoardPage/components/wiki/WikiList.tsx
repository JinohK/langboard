import { Box, Button, Flex, IconComponent, Skeleton, Tabs } from "@/components/base";
import { useTabsContext } from "@/components/base/Tabs";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { ROUTES } from "@/core/routing/constants";
import { getEditorStore } from "@/core/stores/EditorStore";
import WikiContent, { SkeletonWikiContent } from "@/pages/BoardPage/components/wiki/WikiContent";
import WikiCreateButton from "@/pages/BoardPage/components/wiki/WikiCreateButton";
import WikiTabList, { SkeletonWikiTabList } from "@/pages/BoardPage/components/wiki/WikiTabList";
import { memo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

export function SkeletonWikiList() {
    return (
        <Box p="2">
            <Flex items="center" justify="between" gap="1">
                <SkeletonWikiTabList />
                <Flex h="full" pb="2" gap="1">
                    <Skeleton size="8" />
                    <Skeleton size="8" />
                </Flex>
            </Flex>
            <SkeletonWikiContent />
        </Box>
    );
}

const WikiList = memo(() => {
    const { wikiUID } = useParams();
    const navigate = usePageNavigateRef();
    const { projectUID, canAccessWiki } = useBoardWiki();

    useEffect(() => {
        if (!canAccessWiki(true, wikiUID)) {
            getEditorStore().setCurrentEditor(null);
            navigate(ROUTES.BOARD.WIKI(projectUID));
        }
    }, [wikiUID]);

    return (
        <Tabs.Provider value={wikiUID}>
            <WikiListDisplay wikiUID={wikiUID} />
        </Tabs.Provider>
    );
});

interface IWikiListDisplayProps {
    wikiUID?: string;
}

function WikiListDisplay({ wikiUID }: IWikiListDisplayProps) {
    const [t] = useTranslation();
    const { wikis, canAccessWiki, modeType, setModeType, wikiTabListId } = useBoardWiki();
    const { updateUI } = useTabsContext();
    const { onPointerDown } = useGrabbingScrollHorizontal(wikiTabListId);
    const handleDeleteMode = useCallback(() => {
        setModeType(modeType === "delete" ? "view" : "delete");
    }, [modeType, setModeType]);
    const handleReorderMode = useCallback(() => {
        setModeType(modeType === "reorder" ? "view" : "reorder");
    }, [modeType, setModeType]);

    useEffect(() => {
        setTimeout(() => {
            updateUI();
        }, 200);
    }, [modeType, wikis]);

    return (
        <Box p="2">
            <Flex items="center" justify="between" gap="1">
                <Box id={wikiTabListId} pb="0.5" w="full" className="max-w-[calc(100%_-_theme(spacing.20))] overflow-x-scroll">
                    <Tabs.List className="justify-start gap-1 border-none p-0" onPointerDown={onPointerDown}>
                        <WikiTabList />
                    </Tabs.List>
                </Box>
                <Flex h="full" pb="2" gap="1">
                    <Button
                        variant={modeType !== "delete" ? "ghost" : "default"}
                        size="icon-sm"
                        title={t("wiki.Toggle delete mode")}
                        titleAlign="end"
                        onClick={handleDeleteMode}
                    >
                        <IconComponent icon="trash-2" size="4" />
                    </Button>
                    <Button
                        variant={modeType !== "reorder" ? "ghost" : "default"}
                        size="icon-sm"
                        title={t("wiki.Toggle reorder mode")}
                        titleAlign="end"
                        onClick={handleReorderMode}
                    >
                        <IconComponent icon="replace-all" size="4" />
                    </Button>
                    <WikiCreateButton />
                </Flex>
            </Flex>
            {wikis.map((wiki) =>
                wikiUID === wiki.uid && canAccessWiki(false, wiki.uid) ? (
                    <Tabs.Content key={`board-wiki-${wiki.uid}-content`} value={wiki.uid}>
                        <WikiContent wiki={wiki} />
                    </Tabs.Content>
                ) : null
            )}
        </Box>
    );
}

export default WikiList;
