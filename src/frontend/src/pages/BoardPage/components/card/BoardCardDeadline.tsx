import { Button, DateTimePicker, IconComponent, Skeleton, Toast } from "@/components/base";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import useCardDeadlineChangedHandlers from "@/controllers/socket/card/useCardDeadlineChangedHandlers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardDeadline() {
    return <Skeleton h={{ initial: "8", lg: "10" }} className="w-1/3" />;
}

const BoardCardDeadline = memo(() => {
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const { t } = useTranslation();
    const { mutate: changeCardDetailsMutate } = useChangeCardDetails("deadline_at");
    const [deadline, setDeadline] = useState<Date | undefined>(card.deadline_at);
    const [isSaving, setIsSaving] = useState(false);
    const editable = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const { on: onCardDeadlineChanged } = useCardDeadlineChangedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.deadline_at = data.deadline_at;
            setDeadline(data.deadline_at);
        },
    });
    const changeDeadline = (date: Date | undefined) => {
        if (!editable) {
            return;
        }

        if (deadline?.getTime() === date?.getTime()) {
            return;
        }

        setIsSaving(true);

        changeCardDetailsMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                deadline_at: date,
            },
            {
                onSuccess: (data) => {
                    card.deadline_at = data.deadline_at;
                    setDeadline(data.deadline_at);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("card.errors.Comment not found."));
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    useEffect(() => {
        const { off } = onCardDeadlineChanged();

        return () => {
            off();
        };
    }, []);

    return (
        <>
            {!editable ? (
                <span
                    className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                        "h-8 px-4 py-2 lg:h-10",
                        deadline ? "bg-primary text-primary-foreground shadow" : "border border-input bg-background shadow-sm"
                    )}
                >
                    {deadline?.toLocaleString() ?? t("card.No deadline")}
                </span>
            ) : (
                <DateTimePicker
                    value={deadline}
                    min={new Date(new Date().setMinutes(new Date().getMinutes() + 30))}
                    onChange={(date) => {
                        date?.setSeconds(0);
                        changeDeadline(date);
                    }}
                    disabled={isSaving}
                    timePicker={{
                        hour: true,
                        minute: true,
                        second: false,
                    }}
                    renderTrigger={() => (
                        <Button
                            variant={deadline ? "default" : "outline"}
                            className="h-8 gap-2 lg:h-10"
                            title={t("card.Set deadline")}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" />
                            ) : (
                                <>
                                    <IconComponent icon="calendar" size="4" />
                                    {deadline?.toLocaleString() ?? t("card.Set deadline")}
                                </>
                            )}
                        </Button>
                    )}
                />
            )}
        </>
    );
});

export default BoardCardDeadline;
