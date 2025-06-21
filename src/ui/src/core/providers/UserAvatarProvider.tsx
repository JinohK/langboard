import { createContext, memo, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, Project, User } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { NavigateFunction } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";
import useIsProjectAssignee from "@/controllers/api/board/useIsProjectAssignee";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";

export interface IUserAvatarContext {
    socket: ISocketContext;
    navigate: NavigateFunction;
    user: User.TModel;
    project?: Project.TModel;
    currentUser: AuthUser.TModel;
    hasRoleAction: ReturnType<typeof useRoleActionFilter<Project.TRoleActions>>["hasRoleAction"];
    isAssignee: bool;
    setIsAssignee: React.Dispatch<React.SetStateAction<bool>>;
    setIsBotDisabled: React.Dispatch<React.SetStateAction<bool | undefined>>;
    isBotDisabled?: bool;
}

interface IUserAvatarProviderProps {
    navigate: NavigateFunction;
    projectUID?: string;
    user: User.TModel;
    children: React.ReactNode;
}

const initialContext = {
    socket: {} as ISocketContext,
    navigate: () => {},
    user: {} as User.TModel,
    project: {} as Project.TModel,
    currentUser: {} as AuthUser.TModel,
    hasRoleAction: () => false,
    isAssignee: false,
    setIsAssignee: () => {},
    setIsBotDisabled: () => {},
    isBotDisabled: undefined,
};

const UserAvatarContext = createContext<IUserAvatarContext>(initialContext);

export const UserAvatarProvider = memo(({ navigate, projectUID, user, children }: IUserAvatarProviderProps): React.ReactNode => {
    const socket = useSocket();
    const project = useMemo(() => {
        if (projectUID) {
            return Project.Model.getModel(projectUID);
        } else {
            return undefined;
        }
    }, [projectUID]);
    const { currentUser } = useAuth();
    const currentUserRoleActions = useMemo(() => {
        if (project) {
            return project.current_auth_role_actions;
        } else {
            return [];
        }
    }, [project, project?.current_auth_role_actions]);
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const { mutateAsync: isProjectAssigneeMutateAsync } = useIsProjectAssignee();
    const [isAssignee, setIsAssignee] = useState(false);
    const [isBotDisabled, setIsBotDisabled] = useState<bool | undefined>(undefined);

    useEffect(() => {
        if (!project || !user.isValidUser()) {
            setIsAssignee(() => false);
            return;
        }

        isProjectAssigneeMutateAsync(
            {
                project_uid: project.uid,
                assignee_uid: user.uid,
            },
            {
                onSuccess: (res) => {
                    setIsAssignee(() => res.result);
                    setIsBotDisabled(() => res.is_bot_disabled!);
                    if (user.isBot()) {
                        socket.subscribe(ESocketTopic.ProjectBot, [`${user.uid}-${project.uid}`]);
                    }
                },
            }
        );

        return () => {
            if (user.isBot()) {
                socket.unsubscribe(ESocketTopic.ProjectBot, [`${user.uid}-${project.uid}`]);
            }
        };
    }, [user, project]);

    if (!currentUser) {
        return <></>;
    }

    return (
        <UserAvatarContext.Provider
            value={{
                socket,
                navigate,
                user,
                project,
                currentUser,
                hasRoleAction,
                isAssignee,
                setIsAssignee,
                setIsBotDisabled,
                isBotDisabled,
            }}
        >
            {children}
        </UserAvatarContext.Provider>
    );
});

export const useUserAvatar = () => {
    const context = useContext(UserAvatarContext);
    if (!context) {
        throw new Error("useUserAvatar must be used within a UserAvatarProvider");
    }
    return context;
};
