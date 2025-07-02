import { Utils } from "@langboard/core/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const useUpdateDateDistance = (date: Date | undefined, timeout: number = 60000) => {
    const [t, i18n] = useTranslation();
    const [distance, setDistance] = useState(date ? Utils.String.formatDateDistance(i18n, t, date) : "");

    useEffect(() => {
        let runningTimeout: NodeJS.Timeout | undefined;
        const updateCommentedAt = () => {
            if (runningTimeout) {
                clearTimeout(runningTimeout);
                runningTimeout = undefined;
            }

            if (date) {
                setDistance(Utils.String.formatDateDistance(i18n, t, date));
            }

            runningTimeout = setTimeout(updateCommentedAt, timeout);
        };

        updateCommentedAt();

        return () => {
            clearTimeout(runningTimeout);
            runningTimeout = undefined;
        };
    }, [date]);

    useEffect(() => {
        if (date) {
            setDistance(Utils.String.formatDateDistance(i18n, t, date));
        }
    }, [date]);

    return distance;
};

export default useUpdateDateDistance;
