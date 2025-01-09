export declare global {
    type bool = boolean;

    declare interface ObjectConstructor {
        entries<T>(object: T): [keyof T, T[keyof T]][];
        keys<T>(object: T): (keyof T)[];
    }

    declare module "*.svg" {
        import React from "react";
        export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
        const src: string;
        export default src;
    }
}
