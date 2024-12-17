import { Flex, Skeleton, Tabs } from "@/components/base";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { ROUTES } from "@/core/routing/constants";
import WikiContent, { SkeletonWikiContent } from "@/pages/BoardPage/components/wiki/WikiContent";
import WikiCreateButton from "@/pages/BoardPage/components/wiki/WikiCreateButton";
import WikiTabList, { SkeletonWikiTabList } from "@/pages/BoardPage/components/wiki/WikiTabList";
import { memo, useEffect, useRef, useState } from "react";

export function SkeletonWikiList() {
    return (
        <div className="p-2">
            <Flex items="center" justify="between" gap="1">
                <SkeletonWikiTabList />
                <Skeleton className="size-8 rounded-md" />
            </Flex>
            <SkeletonWikiContent />
        </div>
    );
}

const WikiList = memo(() => {
    const { setIsLoadingRef } = usePageLoader();
    const [wikiUID, setWikiUID] = useState(location.pathname.split("/")[4]);
    const { projectUID, wikis, navigate, canAccessWiki, setCurrentEditor } = useBoardWiki();
    const paramsLastCheckedRef = useRef<string>();
    const wikiTabListId = `board-wiki-tab-list-${projectUID}`;

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

        if (canAccessWiki(true, wikiUID)) {
            navigate(ROUTES.BOARD.WIKI_PAGE(projectUID, uid));
            setCurrentEditor("");
            setWikiUID(uid);
        } else {
            setCurrentEditor("");
            setWikiUID("");
        }
    };

    return (
        <Tabs.Root value={wikiUID} className="p-2">
            <Flex items="center" justify="between" gap="1">
                <div id={wikiTabListId} className="max-w-[calc(100%_-_theme(spacing.10))] overflow-x-scroll pb-0.5">
                    <Tabs.List className="gap-1">
                        <WikiTabList wikiUID={wikiUID} changeTab={changeTab} />
                    </Tabs.List>
                </div>
                <Flex h="full" pb="2">
                    <WikiCreateButton wikiTabListId={wikiTabListId} changeTab={changeTab} />
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
