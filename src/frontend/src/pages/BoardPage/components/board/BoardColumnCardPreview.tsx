import { Box, Checkbox, Flex, HoverCard, ScrollArea, Separator } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { UserAvatarBadgeList } from "@/components/UserAvatarList";
import { BotModel, ProjectChecklist, ProjectLabel, User } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { Fragment, memo, useMemo, useState } from "react";
import { LabelBadge, LabelModelBadge } from "@/components/LabelBadge";
import BoardLabelListItem from "@/pages/BoardPage/components/board/BoardLabelListItem";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { HOVER_CARD_UID_ATTR, IBoardColumnCardContextParams } from "@/pages/BoardPage/components/board/BoardData";

function BoardColumnCardPreview() {
    const { project, currentUser } = useBoard();
    const { model: card } = ModelRegistry.ProjectCard.useContext<IBoardColumnCardContextParams>();
    const projectMembers = project.useForeignField<User.TModel>("members");
    const projectBots = project.useForeignField<BotModel.TModel>("bots");
    const mentionables = useMemo(() => [...projectMembers, ...projectBots.map((bot) => bot.as_user)], [projectMembers, projectBots]);
    const description = card.useField("description");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const cardMembers = card.useForeignField<User.TModel>("members");
    const flatChecklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
    const checklists = useMemo(() => flatChecklists.sort((a, b) => a.order - b.order).slice(0, 3), [flatChecklists]);

    return (
        <Flex direction="col" gap="1.5">
            {!!labels.length && <BoardColumnCardPreviewLabelList labels={labels} />}
            {!!cardMembers.length && (
                <UserAvatarBadgeList
                    users={cardMembers}
                    maxVisible={2}
                    listAlign="start"
                    projectUID={project.uid}
                    avatarHoverProps={{ ...{ [HOVER_CARD_UID_ATTR]: card.uid } }}
                />
            )}
            {!!description.content.trim().length && (
                <ScrollArea.Root>
                    <Box p="4" className="max-h-48 break-all [&_img]:max-w-full">
                        <PlateEditor
                            value={description}
                            mentionables={mentionables}
                            currentUser={currentUser}
                            readOnly
                            editorType="view"
                            form={{ project_uid: project.uid }}
                        />
                    </Box>
                </ScrollArea.Root>
            )}
            {!!checklists.length && (
                <Box>
                    {checklists.map((checklist) => (
                        <Flex key={`board-card-preview-checklist-${checklist.uid}`} items="center" gap="1.5">
                            <BoardColumnCardPreviewChecklist checklist={checklist} />
                        </Flex>
                    ))}
                    {flatChecklists.length > 1 && (
                        <Box mt="-2" ml="0.5">
                            ...
                        </Box>
                    )}
                </Box>
            )}
        </Flex>
    );
}
BoardColumnCardPreview.displayName = "Board.ColumnCard.Preview";

const BoardColumnCardPreviewLabelList = memo(({ labels }: { labels: ProjectLabel.TModel[] }) => {
    const [isOpened, setIsOpened] = useState(false);
    const { model: card } = ModelRegistry.ProjectCard.useContext<IBoardColumnCardContextParams>();

    return (
        <Flex items="center" gap="1.5">
            {labels.slice(0, 2).map((label) => (
                <LabelModelBadge key={`board-card-preview-label-${label.uid}`} model={label} />
            ))}
            {labels.length > 2 && (
                <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
                    <HoverCard.Trigger asChild>
                        <Box cursor="pointer" onClick={() => setIsOpened(!isOpened)}>
                            <LabelBadge
                                name={`+${labels.length - 2}`}
                                color="hsl(var(--secondary))"
                                textColor="hsl(var(--secondary-foreground))"
                                noTooltip
                            />
                        </Box>
                    </HoverCard.Trigger>
                    <HoverCard.Content className="z-50 w-auto p-0" align="end" {...{ [HOVER_CARD_UID_ATTR]: card.uid }}>
                        <ScrollArea.Root>
                            <Box maxH="52" minW="40" py="1">
                                {labels.slice(2).map((label, i) => (
                                    <Fragment key={`board-card-preview-label-${label.uid}`}>
                                        {i !== 0 && <Separator className="my-1 h-px bg-muted" />}
                                        <BoardLabelListItem label={label} />
                                    </Fragment>
                                ))}
                            </Box>
                        </ScrollArea.Root>
                    </HoverCard.Content>
                </HoverCard.Root>
            )}
        </Flex>
    );
});

const BoardColumnCardPreviewChecklist = memo(({ checklist }: { checklist: ProjectChecklist.TModel }) => {
    const isChecked = checklist.useField("is_checked");

    return (
        <Flex items="center" gap="1.5">
            <Checkbox checked={isChecked} disabled />
            <span className="text-sm">{checklist.title}</span>
        </Flex>
    );
});

export default BoardColumnCardPreview;
