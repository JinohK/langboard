import { SubmitButton, Toast } from "@/components/base";
import useCreateProjectLabel from "@/controllers/api/board/settings/useCreateProjectLabel";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelAddButton() {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: createProjectLabelMutateAsync } = useCreateProjectLabel();

    const createLabel = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = createProjectLabelMutateAsync({
            project_uid: project.uid,
            name: "New Label",
            color: new ColorGenerator(createShortUUID()).generateRandomColor(),
            description: "Sample label description",
        });

        Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("project.errors.Project not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Label added successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <SubmitButton
            type="button"
            isValidating={isValidating}
            variant="outline"
            className="mb-4 w-full border-2 border-dashed"
            onClick={createLabel}
        >
            {t("project.settings.Add a label")}
        </SubmitButton>
    );
}

export default BoardSettingsLabelAddButton;
