import { Box, Button, Checkbox, Flex, Loading } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useSelectedUsersDeletedHandlers from "@/controllers/socket/settings/users/useSelectedUsersDeletedHandlers";
import useUserCreatedHandlers from "@/controllers/socket/settings/users/useUserCreatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { User } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { RefreshableListProvider, useRefreshableList } from "@/core/providers/RefreshableListProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import UserRow from "@/pages/SettingsPage/components/users/UserRow";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface IUserListProps {
    selectedUsers: string[];
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
}

const PAGE_LIMIT = 30;

function UserList(props: IUserListProps) {
    const { currentUser } = useAppSetting();
    const allUsers = User.Model.useModels(
        (model) => model.isValidUser() && !model.isDeletedUser() && !!model.created_at && model.uid !== currentUser?.uid
    );

    return (
        <RefreshableListProvider models={allUsers} form={{ listType: "User" }} limit={PAGE_LIMIT}>
            <UserListInner {...props} />
        </RefreshableListProvider>
    );
}

function UserListInner({ selectedUsers, setSelectedUsers }: IUserListProps) {
    const [t] = useTranslation();
    const socket = useSocket();
    const { signOut } = useAuth();
    const { currentUser } = useAppSetting();
    const {
        models: users,
        listIdRef,
        isLastPage,
        countNewRecords,
        isRefreshing,
        nextPage,
        refreshList,
        checkOutdated,
        checkOutdatedOnScroll,
    } = useRefreshableList<"User">();
    const virtualizerRef = useRef<ReturnType<typeof useVirtualizer>>(undefined);
    const scrollableRef = useRef<HTMLDivElement>(null);
    const userCreatedHandlers = useMemo(
        () =>
            useUserCreatedHandlers({
                callback: () => {
                    checkOutdated().finally(() => {
                        virtualizerRef.current?.measure();
                    });
                },
            }),
        [checkOutdated]
    );
    const selectedUsersDeletedHandlers = useMemo(
        () =>
            useSelectedUsersDeletedHandlers({
                currentUser,
                signOut,
                callback: () => {
                    virtualizerRef.current?.measure();
                },
            }),
        [currentUser, signOut]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [userCreatedHandlers, selectedUsersDeletedHandlers],
        dependencies: [userCreatedHandlers, selectedUsersDeletedHandlers],
    });
    const selectAll = () => {
        setSelectedUsers((prev) => {
            if (prev.length === users.length) {
                return [];
            } else {
                return users.map((user) => user.uid);
            }
        });
    };

    return (
        <Box position="relative" h="full">
            {countNewRecords > 0 && !isRefreshing && (
                <Box position="sticky" w="full" className="-top-8 z-50">
                    <Button onClick={refreshList} size="sm" className="absolute left-1/2 top-14 -translate-x-1/2">
                        {t("settings.{count} New Users", { count: countNewRecords })}
                    </Button>
                </Box>
            )}
            <Box
                id={listIdRef.current}
                className={cn(
                    "max-h-[calc(100vh_-_theme(spacing.44))]",
                    "md:max-h-[calc(100vh_-_theme(spacing.48))]",
                    "lg:max-h-[calc(100vh_-_theme(spacing.52))]",
                    "overflow-y-auto"
                )}
                onScroll={checkOutdatedOnScroll}
                ref={scrollableRef}
            >
                {isRefreshing && <Loading variant="secondary" size="4" my="2" />}
                <InfiniteScroller.Table.Default
                    columns={[
                        {
                            name: <Checkbox checked={!!users.length && users.length === selectedUsers.length} onClick={selectAll} />,
                            className: "w-12 text-center",
                        },
                        { name: t("user.Email"), className: "w-[calc(calc(100%_/_12_*_3)_-_theme(spacing.12))] text-center" },
                        { name: t("user.First Name"), className: "w-1/6 text-center" },
                        { name: t("user.Last Name"), className: "w-1/6 text-center" },
                        { name: t("settings.Activation"), className: "w-1/12 text-center" },
                        { name: t("settings.Admin"), className: "w-1/12 text-center" },
                        { name: t("settings.Created"), className: "w-1/6 text-center" },
                        { name: t("common.More"), className: "w-1/12 text-center" },
                    ]}
                    headerClassName="sticky top-0 z-50 bg-background"
                    scrollable={() => scrollableRef.current}
                    loadMore={nextPage}
                    hasMore={!isLastPage}
                    totalCount={users.length}
                    loader={
                        <Flex justify="center" py="6" key={createShortUUID()}>
                            <Loading variant="secondary" />
                        </Flex>
                    }
                    virtualizerRef={virtualizerRef}
                >
                    {users.map((user) =>
                        user.isDeletedUser() ? null : (
                            <UserRow
                                key={user.uid}
                                user={user}
                                selectedUsers={selectedUsers}
                                virtualizerRef={virtualizerRef}
                                setSelectedUsers={setSelectedUsers}
                            />
                        )
                    )}
                </InfiniteScroller.Table.Default>
                {!users.length && (
                    <Flex justify="center" items="center" h="full" mt="2" key={createShortUUID()}>
                        {t("settings.No Users")}
                    </Flex>
                )}
            </Box>
        </Box>
    );
}

export default UserList;
