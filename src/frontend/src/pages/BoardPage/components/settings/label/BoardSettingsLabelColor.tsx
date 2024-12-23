import { ColorPicker, Toast } from "@/components/base";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import useProjectLabelColorChangedHandlers from "@/controllers/socket/project/label/useProjectLabelColorChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useBoardSettingsLabel } from "@/core/providers/BoardSettingsLabelProvider";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsLabelColor = memo(() => {
    const { project, socket } = useBoardSettings();
    const { label, isValidating, setIsValidating, sharedErrorHandler } = useBoardSettingsLabel();
    const [t] = useTranslation();
    const [labelColor, setLabelColor] = useState(label.color);
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("color");
    const handlers = useProjectLabelColorChangedHandlers({
        socket,
        projectUID: project.uid,
        labelUID: label.uid,
        callback: (data) => {
            label.color = data.color;
            setLabelColor(data.color);
        },
    });
    useSwitchSocketHandlers({ socket, handlers });

    const changeColor = (color: string, endCallback: () => void) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (!color) {
            Toast.Add.error(t("project.settings.errors.Color cannot be empty."));
            setIsValidating(false);
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            color,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("project.settings.successes.Color changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                endCallback();
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <ColorPicker
            size="icon"
            value={labelColor}
            isValidating={isValidating}
            onSave={changeColor}
            popoverContentAlign="start"
            className="min-h-9 min-w-9 transition-all hover:opacity-80"
        />
    );
});

export default BoardSettingsLabelColor;
