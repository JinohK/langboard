import { Box, Flex } from "@/components/base";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import BoardSettingsBasic from "@/pages/BoardPage/components/settings/BoardSettingsBasic";
import BoardSettingsLabelList from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelList";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonSettingsList() {
    return <></>;
}

const BoardSettingsList = memo(() => {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <BoardSettingsSection title="project.settings.Basic info">
                <BoardSettingsBasic />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Label">
                <BoardSettingsLabelList />
            </BoardSettingsSection>
        </Flex>
    );
});

interface IBoardSettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

const BoardSettingsSection = memo(({ title, children }: IBoardSettingsSectionProps) => {
    const [t] = useTranslation();

    return (
        <Box w="full" className="max-w-screen-sm">
            <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">{t(title)}</h2>
            {children}
        </Box>
    );
});

export default BoardSettingsList;
