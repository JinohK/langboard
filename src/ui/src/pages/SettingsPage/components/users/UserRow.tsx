import { Checkbox, Table } from "@/components/base";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { User } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import UserFirstname from "@/pages/SettingsPage/components/users/UserFirstname";
import UserLastname from "@/pages/SettingsPage/components/users/UserLastname";
import UserAdmin from "@/pages/SettingsPage/components/users/UserAdmin";
import UserActivation from "@/pages/SettingsPage/components/users/UserActivation";
import { memo } from "react";
import UserMoreMenu from "@/pages/SettingsPage/components/users/UserMoreMenu";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface IUserRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    user: User.TModel;
    selectedUsers: string[];
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
    virtualizerRef: React.RefObject<ReturnType<typeof useVirtualizer> | undefined>;
}

const UserRow = memo(({ user, selectedUsers, setSelectedUsers, virtualizerRef, ...props }: IUserRowProps) => {
    const type = user.useField("type");
    const email = user.useField("email");
    const rawCreatedAt = user.useField("created_at");
    const createdAt = useUpdateDateDistance(rawCreatedAt);

    if (user.isDeletedUser(type)) {
        return null;
    }

    const toggleSelect = () => {
        setSelectedUsers((prev) => {
            if (prev.some((value) => value === user.uid)) {
                return prev.filter((value) => value !== user.uid);
            } else {
                return [...prev, user.uid];
            }
        });
    };

    return (
        <Table.FlexRow {...props}>
            <ModelRegistry.User.Provider model={user} params={{ virtualizerRef }}>
                <Table.FlexCell className="w-12 text-center">
                    <Checkbox checked={selectedUsers.some((value) => value === user.uid)} onClick={toggleSelect} />
                </Table.FlexCell>
                <Table.FlexCell className="w-[calc(calc(100%_/_12_*_3)_-_theme(spacing.12))] truncate text-center">{email}</Table.FlexCell>
                <UserFirstname />
                <UserLastname />
                <UserActivation />
                <UserAdmin />
                <Table.FlexCell className="w-1/6 truncate text-center">{createdAt}</Table.FlexCell>
                <Table.FlexCell className="w-1/12 truncate text-center">
                    <UserMoreMenu />
                </Table.FlexCell>
            </ModelRegistry.User.Provider>
        </Table.FlexRow>
    );
});

export default UserRow;
