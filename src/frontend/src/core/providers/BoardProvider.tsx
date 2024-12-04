import { createContext, useContext, useMemo } from "react";
import { Project, ProjectColumn, User } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { IBoardProject } from "@/controllers/api/board/useProjectAvailable";
import { IBoardCard } from "@/controllers/api/board/useGetCards";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import TypeUtils from "@/core/utils/TypeUtils";
import { NavigateOptions, To, useLocation, useNavigate } from "react-router-dom";

export interface IFilterMap {
    keyword?: string[];
    members?: string[];
    parents?: string[];
    children?: string[];
}

export interface IBoardContext {
    socket: IConnectedSocket;
    project: IBoardProject;
    columns: ProjectColumn.Interface[];
    cards: IBoardCard[];
    cardsMap: Record<string, IBoardCard>;
    currentUser: IAuthUser;
    hasRoleAction: (...actions: Project.TRoleActions[]) => bool;
    filters: IFilterMap;
    navigateWithFilters: (to?: To, options?: NavigateOptions) => void;
    filterMember: (member: User.Interface) => bool;
    filterCard: (card: IBoardCard) => bool;
    filterCardMember: (card: IBoardCard) => bool;
    filterCardRelationships: (card: IBoardCard) => bool;
}

interface IBoardProviderProps {
    socket: IConnectedSocket;
    project: IBoardProject;
    columns: ProjectColumn.Interface[];
    cards: IBoardCard[];
    currentUser: IAuthUser;
    currentUserRoleActions: Project.TRoleActions[];
    children: React.ReactNode;
}

const initialContext = {
    socket: {} as IConnectedSocket,
    project: {} as IBoardProject,
    columns: [],
    cards: [],
    cardsMap: {},
    currentUser: {} as IAuthUser,
    hasRoleAction: () => false,
    filters: {},
    navigateWithFilters: () => {},
    filterMember: () => true,
    filterCard: () => true,
    filterCardMember: () => true,
    filterCardRelationships: () => true,
};

const BoardContext = createContext<IBoardContext>(initialContext);

export const BoardProvider = ({
    socket,
    project,
    columns,
    cards,
    currentUser,
    currentUserRoleActions,
    children,
}: IBoardProviderProps): React.ReactNode => {
    const location = useLocation();
    const navigate = useNavigate();
    const filters = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const rawFilters = searchParams.get("filters");
        const newFilters = transformStringFilters(rawFilters);
        return newFilters;
    }, [location, location.search]);
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const cardsMap = useMemo(() => {
        const map: Record<string, IBoardCard> = {};
        cards.forEach((card) => {
            map[card.uid] = card;
        });
        return map;
    }, [cards]);

    const transformFilters = (): string => {
        return Object.entries(filters)
            .map(([key, value]) => {
                if (!value.length) {
                    return "";
                }
                return `${key}:${encodeURIComponent(encodeURIComponent(value.join(",")))}`;
            })
            .join(",");
    };

    const navigateWithFilters = (to?: To, options?: NavigateOptions) => {
        if (filters.members) {
            filters.members = filters.members.filter((member, index) => filters.members!.indexOf(member) === index);
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

        if (options?.state) {
            options.state.isSamePage = true;
        } else {
            options = { state: { isSamePage: true } };
        }

        navigate(to, options);
    };

    const filterMember = (member: User.Interface) => {
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

    const filterCard = (card: IBoardCard) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return card.title.toLowerCase().includes(keyword.toLowerCase()) || card.members.some((member) => filterMember(member));
    };

    const filterCardMember = (card: IBoardCard) => {
        if (!filters.members?.length) {
            return true;
        }

        if (filters.members.includes("none") && !card.members.length) {
            return true;
        }

        for (let i = 0; i < filters.members.length; ++i) {
            const userId = filters.members[i];
            let user = project.members.find((member) => member.id.toString() === userId);
            if (userId === "me") {
                user = currentUser;
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

    const filterCardRelationships = (card: IBoardCard) => {
        if (!filters.parents?.length && !filters.children?.length) {
            return true;
        }

        const oppositeRelationships: Record<keyof IBoardCard["relationships"], keyof IBoardCard["relationships"]> = {
            parents: "children",
            children: "parents",
        };

        const filter = (relationship: keyof IBoardCard["relationships"]) => {
            const opposite = oppositeRelationships[relationship];
            return (
                filters[relationship]!.some((oppositeUID) => card.relationships[opposite].includes(oppositeUID)) ||
                filters[relationship]!.includes(card.uid)
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
                filterCard,
                filterCardMember,
                filterCardRelationships,
            }}
        >
            {children}
        </BoardContext.Provider>
    );
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error("useBoard must be used within an BoardProvider");
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

            if (!["keyword", "members", "parents", "children"].includes(key)) {
                return;
            }

            filterMap[key as keyof IFilterMap] = decodeURIComponent(decodeURIComponent(value)).split(",");
        });
    }

    return filterMap;
};
