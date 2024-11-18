const useRoleActionFilter = <T extends string>(userActions: (T | "*")[]) => {
    const ALL_GRANTED = "*";
    const hasRoleAction = (...roles: T[]) => {
        if (userActions.includes(ALL_GRANTED)) {
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
