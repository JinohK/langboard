import { Box, Button, Flex, IconComponent, Skeleton, Tabs } from "@/components/base";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import WikiContent, { SkeletonWikiContent } from "@/pages/BoardPage/components/wiki/WikiContent";
import WikiCreateButton from "@/pages/BoardPage/components/wiki/WikiCreateButton";
import WikiTabList, { SkeletonWikiTabList } from "@/pages/BoardPage/components/wiki/WikiTabList";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
    const { setIsLoadingRef } = usePageHeader();
    const [t] = useTranslation();
    const [wikiUID, setWikiUID] = useState(location.pathname.split("/")[4]);
    const { projectUID, wikis, navigate, canAccessWiki, setCurrentEditor, disabledReorder, setDisabledReorder, wikiTabListId } = useBoardWiki();
    const paramsLastCheckedRef = useRef("");
    const { onPointerDown } = useGrabbingScrollHorizontal(wikiTabListId);

    useEffect(() => {
        if (paramsLastCheckedRef.current === wikiUID) {
            setIsLoadingRef.current(false);
            return;
        }

        if (!canAccessWiki(true, wikiUID)) {
            setCurrentEditor("");
            setWikiUID("");
        }

        paramsLastCheckedRef.current = wikiUID;
        setIsLoadingRef.current(false);
    }, [wikiUID]);

    const changeTab = (uid: string) => {
        if (uid === wikiUID) {
            return;
        }

        if (canAccessWiki(true, uid)) {
            if (!uid) {
                navigate(ROUTES.BOARD.WIKI(projectUID));
            } else {
                navigate(ROUTES.BOARD.WIKI_PAGE(projectUID, uid));
            }
            setCurrentEditor("");
            setWikiUID(uid);
        } else {
            navigate(ROUTES.BOARD.WIKI(projectUID));
            setCurrentEditor("");
            setWikiUID("");
        }
    };

    return (
        <Tabs.Root value={wikiUID} className="p-2">
            <Flex items="center" justify="between" gap="1">
                <Box id={wikiTabListId} pb="0.5" w="full" className="max-w-[calc(100%_-_theme(spacing.20))] overflow-x-scroll">
                    <Tabs.List className="gap-1" onPointerDown={onPointerDown}>
                        <WikiTabList changeTab={changeTab} />
                    </Tabs.List>
                </Box>
                <Flex h="full" pb="2" gap="1">
                    <Button
                        variant={disabledReorder ? "ghost" : "default"}
                        size="icon-sm"
                        title={t("wiki.Toggle reorder mode")}
                        titleAlign="end"
                        onClick={() => setDisabledReorder(() => !disabledReorder)}
                    >
                        <IconComponent icon="replace-all" size="4" />
                    </Button>
                    <WikiCreateButton changeTab={changeTab} />
                </Flex>
            </Flex>
            {wikis.map((wiki) =>
                wikiUID === wiki.uid && canAccessWiki(false, wiki.uid) ? (
                    <Tabs.Content key={`board-wiki-${wiki.uid}-content`} value={wiki.uid}>
                        <WikiContent wiki={wiki} changeTab={changeTab} />
                    </Tabs.Content>
                ) : null
            )}
        </Tabs.Root>
    );
});

export default WikiList;
