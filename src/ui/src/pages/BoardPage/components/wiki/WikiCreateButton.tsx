import { Button, IconComponent, Toast } from "@/components/base";
import useCreateWiki from "@/controllers/api/wiki/useCreateWiki";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiCreateButtonProps {
    changeTab: (uid: string) => void;
}

const WikiCreateButton = memo(({ changeTab }: IWikiCreateButtonProps) => {
    const { projectUID, wikiTabListId } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: createWikiMutateAsync } = useCreateWiki({ interceptToast: true });

    const createWiki = () => {
        const promise = createWikiMutateAsync({
            project_uid: projectUID,
            title: "New page",
        });

        Toast.Add.promise(promise, {
            loading: t("common.Creating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: (data) => {
                const changeCreatedTab = () => {
                    const wikiTab = document.getElementById(`board-wiki-${data.wiki.uid}-tab`);
                    if (!wikiTab) {
                        return setTimeout(changeCreatedTab, 50);
                    }

                    const wikiTabList = document.getElementById(wikiTabListId);
                    wikiTabList?.scrollTo({
                        left: wikiTabList.scrollWidth,
                        behavior: "smooth",
                    });
                    changeTab(data.wiki.uid);
                };
                changeCreatedTab();
                return t("successes.New wiki page created successfully.");
            },
            finally: () => {},
        });
    };

    return (
        <Button variant="ghost" size="icon-sm" title={t("wiki.New wiki page")} titleAlign="end" onClick={createWiki}>
            <IconComponent icon="plus" size="4" />
        </Button>
    );
});

export default WikiCreateButton;
