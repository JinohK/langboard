import type { SlateElementProps, TDateElement } from "platejs";
import { SlateElement } from "platejs";
import { useTranslation } from "react-i18next";

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
    const [t] = useTranslation();
    const { element } = props;

    return (
        <SlateElement className="inline-block" {...props}>
            <span className="w-fit rounded-sm bg-muted px-1 text-muted-foreground">
                {element.date ? (
                    (() => {
                        const today = new Date();
                        const elementDate = new Date(element.date);
                        const isToday =
                            elementDate.getDate() === today.getDate() &&
                            elementDate.getMonth() === today.getMonth() &&
                            elementDate.getFullYear() === today.getFullYear();

                        const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === elementDate.toDateString();
                        const isTomorrow = new Date(today.setDate(today.getDate() + 2)).toDateString() === elementDate.toDateString();

                        if (isToday) return t("editor.Today");
                        if (isYesterday) return t("editor.Yesterday");
                        if (isTomorrow) return t("editor.Tomorrow");

                        return elementDate.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        });
                    })()
                ) : (
                    <span>{t("editor.Pick a date")}</span>
                )}
            </span>
            {props.children}
        </SlateElement>
    );
}
