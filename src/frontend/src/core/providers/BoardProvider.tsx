import { createContext, memo, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { AuthUser, Project, ProjectCard, ProjectCardRelationship, ProjectColumn, ProjectLabel, User } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import TypeUtils from "@/core/utils/TypeUtils";
import { NavigateFunction, NavigateOptions, To } from "react-router-dom";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { Toast } from "@/components/base";
import { useTranslation } from "react-i18next";

export interface IFilterMap {
    keyword?: string[];
    members?: string[];
    labels?: string[];
    parents?: string[];
    children?: string[];
}

export interface IBoardContext {
    socket: ISocketContext;
    project: Project.TModel;
    columns: ProjectColumn.TModel[];
    cards: ProjectCard.TModel[];
    cardsMap: Record<string, ProjectCard.TModel>;
    currentUser: AuthUser.TModel;
    hasRoleAction: (...actions: Project.TRoleActions[]) => bool;
    filters: IFilterMap;
    navigateWithFilters: (to?: To, options?: NavigateOptions) => void;
    filterMember: (member: User.TModel) => bool;
    filterLabel: (label: ProjectLabel.TModel) => bool;
    filterCard: (card: ProjectCard.TModel) => bool;
    filterCardMember: (card: ProjectCard.TModel) => bool;
    filterCardLabels: (card: ProjectCard.TModel) => bool;
    filterCardRelationships: (card: ProjectCard.TModel) => bool;
}

interface IBoardProviderProps {
    navigate: NavigateFunction;
    project: Project.TModel;
    currentUser: AuthUser.TModel;
    currentUserRoleActions: Project.TRoleActions[];
    children: React.ReactNode;
}

const initialContext = {
    socket: {} as ISocketContext,
    project: {} as Project.TModel,
    columns: [],
    cards: [],
    cardsMap: {},
    currentUser: {} as AuthUser.TModel,
    hasRoleAction: () => false,
    filters: {},
    navigateWithFilters: () => {},
    filterMember: () => true,
    filterLabel: () => true,
    filterCard: () => true,
    filterCardMember: () => true,
    filterCardLabels: () => true,
    filterCardRelationships: () => true,
};

const BoardContext = createContext<IBoardContext>(initialContext);

export const BoardProvider = memo(({ navigate, project, currentUser, currentUserRoleActions, children }: IBoardProviderProps): React.ReactNode => {
    const socket = useSocket();
    const [t] = useTranslation();
    const [navigated, forceUpdate] = useReducer((x) => x + 1, 0);
    const members = project.useForeignField<User.TModel>("members");
    const filters = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const rawFilters = searchParams.get("filters");
        const newFilters = transformStringFilters(rawFilters);
        return newFilters;
    }, [navigated, location, location.search]);
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const columns = ProjectColumn.Model.useModels((model) => model.project_uid === project.uid);
    const cards = ProjectCard.Model.useModels((model) => model.project_uid === project.uid);
    const forbiddenMessageIdRef = useRef<string | number | null>(null);
    const cardsMap = useMemo(() => {
        const map: Record<string, ProjectCard.TModel> = {};
        cards.forEach((card) => {
            map[card.uid] = card;
        });
        return map;
    }, [cards]);

    useEffect(() => {
        if (members.some((member) => member.uid === currentUser.uid) || forbiddenMessageIdRef.current) {
            return;
        }

        const toastId = Toast.Add.error(t("project.errors.You are not a member of this project."), {
            onAutoClose: () => {
                forbiddenMessageIdRef.current = null;
            },
            onDismiss: () => {
                forbiddenMessageIdRef.current = null;
            },
        });
        forbiddenMessageIdRef.current = toastId;
        navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
    }, [members]);

    const transformFilters = (): string => {
        return Object.entries(filters)
            .map(([key, value]) => {
                if (!value!.length) {
                    return "";
                }
                return `${key}:${encodeURIComponent(encodeURIComponent(value!.join(",")))}`;
            })
            .join(",");
    };

    const navigateWithFilters = (to?: To, options?: NavigateOptions) => {
        if (filters.members) {
            filters.members = filters.members.filter((member, index) => filters.members!.indexOf(member) === index);
        }
        if (filters.labels) {
            filters.labels = filters.labels.filter((label, index) => filters.labels!.indexOf(label) === index);
        }
        if (filters.parents) {
            filters.parents = filters.parents.filter((parent, index) => filters.parents!.indexOf(parent) === index);
        }
        if (filters.children) {
            filters.children = filters.children.filter((child, index) => filters.children!.indexOf(child) === index);
        }

        const newFiltersString = transformFilters();

        if (TypeUtils.isString(to)) {
            to = { pathname: to };
        } else {
            to = { ...to };
        }

        const params = new URLSearchParams(to.search);
        if (!newFiltersString.length) {
            params.delete("filters");
        } else {
            params.set("filters", newFiltersString);
        }

        to = { ...to, search: params.toString() };

        navigate(to, options);
        forceUpdate();
    };

    const filterMember = (member: User.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return (
            member.email.includes(keyword) ||
            member.username.toLowerCase().includes(keyword.toLowerCase()) ||
            member.firstname.toLowerCase().includes(keyword.toLowerCase()) ||
            member.lastname.toLowerCase().includes(keyword.toLowerCase())
        );
    };

    const filterLabel = (label: ProjectLabel.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return label.name.toLowerCase().includes(keyword.toLowerCase()) || label.description.toLowerCase().includes(keyword.toLowerCase());
    };

    const filterCard = (card: ProjectCard.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return card.title.toLowerCase().includes(keyword.toLowerCase()) || card.members.some((member) => filterMember(member));
    };

    const filterCardMember = (card: ProjectCard.TModel) => {
        if (!filters.members?.length) {
            return true;
        }

        if (filters.members.includes("none") && !card.members.length) {
            return true;
        }

        for (let i = 0; i < filters.members.length; ++i) {
            const userUID = filters.members[i];
            let user;
            if (userUID === "me") {
                user = currentUser;
            } else {
                user = project.members.find((member) => member.uid === userUID);
            }

            if (!user) {
                continue;
            }

            if (card.members.some((member) => member.email === user.email && member.username === user.username)) {
                return true;
            }
        }

        return false;
    };

    const filterCardLabels = (card: ProjectCard.TModel) => {
        if (!filters.labels?.length) {
            return true;
        }

        return !!card.label_uids.length && filters.labels.some((labelUID) => card.label_uids.includes(labelUID));
    };

    const filterCardRelationships = (card: ProjectCard.TModel) => {
        if (!filters.parents?.length && !filters.children?.length) {
            return true;
        }

        const filter = (relationshipType: ProjectCardRelationship.TRelationship) => {
            const oppositeKey = relationshipType === "parents" ? "child_card_uid" : "parent_card_uid";
            return (
                filters[relationshipType]!.some((oppositeUID) =>
                    card.relationships.some((relationship) => relationship[oppositeKey] === oppositeUID)
                ) || filters[relationshipType]!.includes(card.uid)
            );
        };

        if (filters.parents?.length && filters.children?.length) {
            return filter("parents") || filter("children");
        } else if (filters.parents?.length) {
            return filter("parents");
        } else if (filters.children?.length) {
            return filter("children");
        } else {
            return true;
        }
    };

    return (
        <BoardContext.Provider
            value={{
                socket,
                project,
                columns,
                cards,
                cardsMap,
                currentUser,
                hasRoleAction,
                filters,
                navigateWithFilters,
                filterMember,
                filterLabel,
                filterCard,
                filterCardMember,
                filterCardLabels,
                filterCardRelationships,
            }}
        >
            {children}
        </BoardContext.Provider>
    );
});

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error("useBoard must be used within a BoardProvider");
    }
    return context;
};

const transformStringFilters = (rawFilters: string | null): IFilterMap => {
    const filterMap: IFilterMap = {};

    if (rawFilters) {
        rawFilters.split(",").map((rawFilter) => {
            const [key, value] = rawFilter.split(":");
            if (TypeUtils.isNull(value) || TypeUtils.isUndefined(value) || !value.length) {
                return;
            }

            if (!["keyword", "members", "labels", "parents", "children"].includes(key)) {
                return;
            }

            filterMap[key as keyof IFilterMap] = decodeURIComponent(decodeURIComponent(value)).split(",");
        });
    }

    return filterMap;
};
