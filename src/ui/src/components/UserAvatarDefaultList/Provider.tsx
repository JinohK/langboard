import { createContext, memo, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, Project } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAuth } from "@/core/providers/AuthProvider";
import useIsProjectAssignee from "@/controllers/api/board/useIsProjectAssignee";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUserAvatarDefaultListContext {
    socket: ISocketContext;
    userOrBot: TUserLikeModel;
    project?: Project.TModel;
    currentUser: AuthUser.TModel;
    hasRoleAction: ReturnType<typeof useRoleActionFilter<Project.TRoleActions>>["hasRoleAction"];
    isAssignee: bool;
    setIsAssignee: React.Dispatch<React.SetStateAction<bool>>;
    setIsBotDisabled: React.Dispatch<React.SetStateAction<bool | undefined>>;
    isBotDisabled?: bool;
}

interface IUserAvatarDefaultListProviderProps {
    projectUID?: string;
    userOrBot: TUserLikeModel;
    children: React.ReactNode;
}

const initialContext = {
    socket: {} as ISocketContext,
    userOrBot: {} as TUserLikeModel,
    project: {} as Project.TModel,
    currentUser: {} as AuthUser.TModel,
    hasRoleAction: () => false,
    isAssignee: false,
    setIsAssignee: () => {},
    setIsBotDisabled: () => {},
    isBotDisabled: undefined,
};

const UserAvatarDefaultListContext = createContext<IUserAvatarDefaultListContext>(initialContext);

export const UserAvatarDefaultListProvider = memo(({ projectUID, userOrBot, children }: IUserAvatarDefaultListProviderProps): React.ReactNode => {
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
    const isValidUser = useMemo(() => {
        if (isModel(userOrBot, "User")) {
            return userOrBot.isValidUser();
        } else if (isModel(userOrBot, "BotModel")) {
            return true;
        }
        return false;
    }, [userOrBot]);

    useEffect(() => {
        if (!project || !isValidUser) {
            setIsAssignee(() => false);
            return;
        }

        isProjectAssigneeMutateAsync(
            {
                project_uid: project.uid,
                assignee_uid: userOrBot.uid,
            },
            {
                onSuccess: (res) => {
                    setIsAssignee(() => res.result);
                    setIsBotDisabled(() => res.is_bot_disabled!);
                    if (isModel(userOrBot, "BotModel")) {
                        socket.subscribe(ESocketTopic.ProjectBot, [`${userOrBot.uid}-${project.uid}`]);
                    }
                },
            }
        );

        return () => {
            if (isModel(userOrBot, "BotModel")) {
                socket.unsubscribe(ESocketTopic.ProjectBot, [`${userOrBot.uid}-${project.uid}`]);
            }
        };
    }, [userOrBot, isValidUser, project]);

    if (!currentUser) {
        return <></>;
    }

    return (
        <UserAvatarDefaultListContext.Provider
            value={{
                socket,
                userOrBot,
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
        </UserAvatarDefaultListContext.Provider>
    );
});

export const useUserAvatarDefaultList = () => {
    const context = useContext(UserAvatarDefaultListContext);
    if (!context) {
        throw new Error("useUserAvatarDefaultList must be used within a UserAvatarDefaultListProvider");
    }
    return context;
};
