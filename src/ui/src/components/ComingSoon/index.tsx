import { memo } from "react";
import { useTranslation } from "react-i18next";

const ComingSoon = memo(() => {
    const [t] = useTranslation();
    return <>{t("common.Coming soon")}</>;
});

export default ComingSoon;
