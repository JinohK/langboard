import { ROLE_ALL_GRANTED } from "@/core/models/Base";

const useRoleActionFilter = <T extends string>(userActions: (T | "*")[]) => {
    const hasRoleAction = (...roles: T[]) => {
        if (userActions.includes(ROLE_ALL_GRANTED)) {
            return true;
        }

        for (let i = 0; i < roles.length; ++i) {
            if (userActions.includes(roles[i])) {
                return true;
            }
        }

        return false;
    };

    return { hasRoleAction };
};

export default useRoleActionFilter;
