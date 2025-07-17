import { API_ROUTES } from "@/controllers/constants";
import { AuthUser, BotModel, UserNotification } from "@/core/models";
import { AxiosInstance } from "axios";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface IAuthStore {
    state: "initial" | "pending" | "loaded";
    currentUser: AuthUser.TModel | null;
    pageLoaded: bool;
    getToken: () => string | null;
    updateToken: (token: string, api: AxiosInstance) => Promise<void>;
    removeToken: () => void;
}

let accessToken: string | null = null;

const useAuthStore = create(
    immer<IAuthStore>((set, get) => {
        return {
            state: "initial",
            currentUser: null,
            pageLoaded: false,
            getToken: () => accessToken,
            updateToken: async (token: string, api: AxiosInstance) => {
                if (get().state === "pending") {
                    return;
                }

                accessToken = token;

                const tryGetUser = async (attempts: number = 0) => {
                    const MAX_ATTEMPTS = 5;
                    if (attempts >= MAX_ATTEMPTS) {
                        return undefined;
                    }

                    try {
                        const response = await api.get<{
                            user: AuthUser.Interface;
                            notifications: UserNotification.Interface[];
                            bots: BotModel.Interface[];
                        }>(API_ROUTES.AUTH.ABOUT_ME, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                            withCredentials: true,
                        });

                        if (!response) {
                            throw new Error();
                        }

                        return response.data;
                    } catch (error) {
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(true);
                            }, 5000);
                        });
                        return tryGetUser(attempts++);
                    }
                };

                const data = await tryGetUser();
                if (!data) {
                    set({ currentUser: null, state: "loaded" });
                    return;
                }

                const user = AuthUser.Model.fromOne(data.user);
                UserNotification.Model.fromArray(data.notifications, true);
                BotModel.Model.fromArray(data.bots, true);

                set({ currentUser: user, state: "loaded" });
            },
            removeToken: () => {
                accessToken = null;
                set({ currentUser: null, state: "loaded" });
            },
        };
    })
);

export const getAuthStore = () => useAuthStore.getState();

export default useAuthStore;
