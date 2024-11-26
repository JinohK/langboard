import { IBoardCard } from "@/controllers/board/useGetCards";
import { User } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { NavigateFunction } from "react-router-dom";

export interface IFilterMap {
    keyword?: string[];
    members?: string[];
    parents?: string[];
    children?: string[];
}

export const transformStringFilters = (rawFilters: string | null): IFilterMap => {
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

            filterMap[key as keyof IFilterMap] = decodeURIComponent(value).split(",");
        });
    }

    return filterMap;
};

export const transformFilters = (filters: IFilterMap): string => {
    return Object.entries(filters)
        .map(([key, value]) => {
            if (!value.length) {
                return "";
            }
            return `${key}:${encodeURIComponent(encodeURIComponent(value.join(",")))}`;
        })
        .join(",");
};

export const navigateFilters = (navigate: NavigateFunction, filters: IFilterMap) => {
    if (filters.members) {
        filters.members = filters.members.filter((member, index) => filters.members!.indexOf(member) === index);
    }
    if (filters.parents) {
        filters.parents = filters.parents.filter((parent, index) => filters.parents!.indexOf(parent) === index);
    }
    if (filters.children) {
        filters.children = filters.children.filter((child, index) => filters.children!.indexOf(child) === index);
    }

    const newFiltersString = transformFilters(filters);

    if (!newFiltersString.length) {
        navigate(
            { search: "" },
            {
                state: { isSamePage: true },
            }
        );
        return;
    }

    navigate(
        { search: `?filters=${newFiltersString}` },
        {
            state: { isSamePage: true },
        }
    );
};

export const filterMember = (filters: IFilterMap, member: User.Interface) => {
    const keyword = filters.keyword?.join(",");
    if (!keyword) {
        return true;
    }

    return (
        member.email.includes(keyword) || member.username.includes(keyword) || member.firstname.includes(keyword) || member.lastname.includes(keyword)
    );
};

export const filterCard = (filters: IFilterMap, card: IBoardCard) => {
    const keyword = filters.keyword?.join(",");
    if (!keyword) {
        return true;
    }

    return card.title.includes(keyword) || card.members.some((member) => filterMember(filters, member));
};

export const filterCardMember = (filters: IFilterMap, members: User.Interface[], card: IBoardCard, currentUser: IAuthUser) => {
    if (!filters.members?.length) {
        return true;
    }

    if (filters.members.includes("none") && !card.members.length) {
        return true;
    }

    for (let i = 0; i < filters.members.length; ++i) {
        const userId = filters.members[i];
        let user = members.find((member) => member.id.toString() === userId);
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

export const filterCardRelationships = (filters: IFilterMap, card: IBoardCard) => {
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
