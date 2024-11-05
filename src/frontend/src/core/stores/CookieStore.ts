import Cookies from "universal-cookie";
import { create } from "zustand";

interface ICookieStore {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
    clear: () => void;
}

const useCookieStore = create<ICookieStore>(() => {
    const cookies = new Cookies(undefined, { path: "/" });

    return {
        get: (key: string) => cookies.get(key),
        set: (key: string, value: string) => cookies.set(key, value, { path: "/" }),
        remove: (key: string) => cookies.remove(key, { path: "/" }),
        clear: () => Object.keys(cookies.getAll()).forEach((key) => cookies.remove(key, { path: "/" })),
    };
});

export const getCookieStore = () => useCookieStore.getState();

export default useCookieStore;
