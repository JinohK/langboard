import { ROLE_ALL_GRANTED } from "@/core/models/Base";
import { useCallback } from "react";

const useRoleActionFilter = <T extends string>(userActions: T[]) => {
    const hasRoleAction = useCallback(
        (...roles: T[]) => {
            if (userActions.includes(ROLE_ALL_GRANTED as T)) {
                return true;
            }

            for (let i = 0; i < roles.length; ++i) {
                if (userActions.includes(roles[i])) {
                    return true;
                }
            }

            return false;
        },
        [userActions]
    );

    return { hasRoleAction };
};

export default useRoleActionFilter;
