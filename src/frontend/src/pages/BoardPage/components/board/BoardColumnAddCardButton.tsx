import { Button, Flex, IconComponent, SubmitButton } from "@/components/base";
import { useBoardAddCard } from "@/core/providers/BoardAddCardProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnAddCardButton = memo(() => {
    const { isAddingCard, setIsAddingCard, isValidating, changeMode, canWrite, textareaRef } = useBoardAddCard();
    const [t] = useTranslation();

    if (!canWrite) {
        return null;
    }

    const save = () => {
        const newValue = textareaRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length) {
            textareaRef.current?.focus();
            return;
        }

        changeMode("view");
    };

    return (
        <>
            {!isAddingCard ? (
                <Button variant="ghost" className="w-full justify-start gap-2 p-2" onClick={() => changeMode("create")}>
                    <IconComponent icon="plus" size="5" />
                    {t("board.Add a card")}
                </Button>
            ) : (
                <Flex items="center" gap="2">
                    <SubmitButton type="button" className="h-8 px-3 py-2" isValidating={isValidating} onClick={save}>
                        {t("board.Add card")}
                    </SubmitButton>
                    <Button variant="ghost" size="icon-sm" disabled={isValidating} onClick={() => setIsAddingCard(false)}>
                        <IconComponent icon="x" size="5" />
                    </Button>
                </Flex>
            )}
        </>
    );
});

export default BoardColumnAddCardButton;
