import { Box, Flex, Input, Label, Textarea } from "@/components/base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsBasic = memo(() => {
    const { project } = useBoardSettings();
    const [t] = useTranslation();

    return (
        <Flex direction="col" py="4" gap="4" items="center">
            <Label display="inline-grid" items="center" gap="1.5" w="full" maxW="64">
                <Box>{t("project.Project title")}</Box>
                <Input defaultValue={project.title} />
            </Label>
            <Label display="inline-grid" items="center" gap="1.5">
                <Box>{t("project.Project description")}</Box>
                <Textarea defaultValue={project.description} />
            </Label>
        </Flex>
    );
});

export default BoardSettingsBasic;
