import { Button, Flex, IconComponent } from "@/components/base";
import CachedImage from "@/components/CachedImage";
import { IBoardCardFile } from "@/controllers/board/useGetCardDetails";
import { formatDateDistance } from "@/core/utils/StringUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import mimeTypes from "react-native-mime-types";
import { tv } from "tailwind-variants";

export interface IBoardCardFileProps {
    file: IBoardCardFile;
    orderable: bool;
    isOverlay?: bool;
}

interface IBoardCardFileragData {
    type: "File";
    data: IBoardCardFile;
}

function BoardCardFile({ file, isOverlay, orderable }: IBoardCardFileProps): JSX.Element {
    const [t, i18n] = useTranslation();
    const mimeType = mimeTypes.lookup(file.url) || "file";
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: file.uid,
        data: {
            type: "File",
            data: file,
        } satisfies IBoardCardFileragData,
        attributes: {
            roleDescription: "SubCheckitem",
        },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        variants: {
            dragging: {
                over: "border-b-2 border-primary/50 [&>div]:opacity-30",
                overlay: "",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (orderable) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    return (
        <Flex items="center" gap="2.5" {...props}>
            {orderable && (
                <Button type="button" variant="ghost" size="icon-sm" title={t("common.Drag to reorder")} {...attributes} {...listeners}>
                    <IconComponent icon="grip-vertical" size="4" />
                </Button>
            )}
            <Flex items="center" justify="center" inline w="16" h="12" className="rounded-sm bg-muted">
                {mimeType.startsWith("image/") ? (
                    <CachedImage src={file.url} alt={mimeType} h="full" className="min-w-full" />
                ) : (
                    (file.name.split(".").at(-1)?.toUpperCase() ?? "FILE")
                )}
            </Flex>
            <div>
                <div className="text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground">{t("card.Added {date}", { date: formatDateDistance(i18n, t, file.created_at) })}</div>
            </div>
        </Flex>
    );
}

export default BoardCardFile;
