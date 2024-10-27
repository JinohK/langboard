type TStringCase = "flat" | "upper" | "camel" | "pascal" | "snake" | "upperSnake" | "kebab";

export class StringCase {
    #str: string;
    #case: TStringCase;
    #rawChunks: string[];

    constructor(str: string) {
        this.#str = str;
        this.#case = this.#detectCase();
        this.#rawChunks = this.#parseChunks();
    }

    get case(): TStringCase {
        return this.#case;
    }

    public toFlat(): string {
        return this.#rawChunks.join("");
    }

    public toUpper(): string {
        return this.#rawChunks.join("").toUpperCase();
    }

    public toCamel(): string {
        return this.#rawChunks
            .map((chunk, index) => {
                return index === 0 ? chunk.toLowerCase() : this.#capitalize(chunk);
            })
            .join("");
    }

    public toPascal(): string {
        return this.#rawChunks
            .map((chunk) => {
                return this.#capitalize(chunk);
            })
            .join("");
    }

    public toSnake(): string {
        return this.#rawChunks.join("_").toLowerCase();
    }

    public toUpperSnake(): string {
        return this.#rawChunks.join("_").toUpperCase();
    }

    public toKebab(): string {
        return this.#rawChunks.join("-").toLowerCase();
    }

    #detectCase(): TStringCase {
        if (this.#str === this.#str.toLowerCase()) {
            return "flat";
        } else if (this.#str === this.#str.toUpperCase()) {
            return "upper";
        } else if (this.#str.includes("_")) {
            return this.#str === this.#str.toUpperCase() ? "upperSnake" : "snake";
        } else if (this.#str.includes("-")) {
            return "kebab";
        } else if (this.#str.charAt(0) === this.#str.charAt(0).toUpperCase()) {
            return "pascal";
        } else {
            return "camel";
        }
    }

    #parseChunks(): string[] {
        if (this.#rawChunks) {
            return this.#rawChunks;
        }

        switch (this.#case) {
            case "flat":
            case "upper":
                return [this.#str];
            case "camel":
            case "pascal":
                return this.#str.split(/(?=[A-Z])/);
            case "snake":
            case "upperSnake":
                return this.#str.split("_");
            case "kebab":
                return this.#str.split("-");
        }
    }

    #capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

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

export const createShortUUID = (): string => {
    return "xxxx-xxxx-xxxx-xxxx".replace(/x/g, () => {
        return ((Math.random() * 16) | 0).toString(16);
    });
};

export const createNameInitials = (firstname: string, lastname: string): string => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
};

export const makeReactKey = (name: string): string => {
    return `${name.replace(/(\.|\s)/g, "-")}-${createShortUUID()}`;
};

export const format = (str: string, map: Record<string, string>): string => {
    return str.replace(/{(\w+)}/g, (match, key) => {
        return map[key] || match;
    });
};
