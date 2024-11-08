const useRoleActionFilter = <T extends string>(userActions: (T | "*")[]) => {
    const ALL_GRANTED = "*";
    const hasRoleAction = (role: T) => {
        if (userActions.includes(ALL_GRANTED)) {
            return true;
        }

        return userActions.includes(role);
    };

    return { hasRoleAction };
};

export default useRoleActionFilter;
