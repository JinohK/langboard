export const makeTitleCase = (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.slice(1);
    });
};

export const generateToken = (n: number): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < n; ++i) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }

    return token;
};

export const createUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const createShortUID = (): string => {
    return "xxxx-xxxx-xxxx-xxxx".replace(/x/g, () => {
        return ((Math.random() * 16) | 0).toString(16);
    });
};

export const createNameInitials = (firstname: string, lastname: string): string => {
    return `${makeTitleCase(firstname.charAt(0))}${makeTitleCase(lastname.charAt(0))}`;
};

export const makeReactKey = (name: string): string => {
    return name.replace(/(\.|\s)/g, "-");
};

export const format = (str: string, map: Record<string, string>): string => {
    return str.replace(/{(\w+)}/g, (match, key) => {
        return map[key] || match;
    });
};
