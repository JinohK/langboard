import { Box, IconComponent, Input, Toast } from "@/components/base";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface ICopyInputProps {
    value?: string;
    className?: string;
}

function CopyInput({ value, className }: ICopyInputProps) {
    const [t] = useTranslation();
    const [isCopied, setIsCopied] = useState(false);

    const copy = async (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if (!value) {
            return;
        }

        selectAllText(e.currentTarget);
        await copyToClipboard(value);
        setIsCopied(true);
        Toast.Add.success(t("common.Copied."));
    };

    return (
        <Box position="relative" className={className}>
            <Input value={value} readOnly onFocus={copy} onClick={copy} className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""} />
            {isCopied && <IconComponent icon="check" size="5" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
        </Box>
    );
}

export default CopyInput;
