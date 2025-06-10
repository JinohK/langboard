/* eslint-disable @typescript-eslint/no-explicit-any */
import { PUBLIC_FRONTEND_URL } from "@/Constants";
import Auth from "@/core/security/Auth";
import { JsonResponse } from "@/core/server/ApiResponse";
import EHttpStatus from "@/core/server/EHttpStatus";
import { isValidURL, StringCase } from "@/core/utils/StringUtils";
import User from "@/models/User";
import { IncomingMessage, ServerResponse } from "http";

export interface IRouteResponse {
    type: string;
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
}

export type TRouteHandler = (context: {
    req: IncomingMessage;
    res: ServerResponse<InstanceType<typeof IncomingMessage>>;
    user: User;
    params: Record<string, any>;
}) => Promise<IRouteResponse>;
export type TMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

class _Routes {
    #routes: Map<TMethod, Record<string, any>>;

    constructor() {
        this.#routes = new Map();
    }

    public post(path: string, handler: TRouteHandler) {
        this.#addRoute("POST", path, handler);
    }

    public async route<
        TRequest extends typeof IncomingMessage = typeof IncomingMessage,
        TResponse extends typeof ServerResponse<InstanceType<TRequest>> = typeof ServerResponse,
    >(req: InstanceType<TRequest>, res: InstanceType<TResponse>) {
        const method = new StringCase(req.method || "GET").toUpper() as TMethod;
        req.url = req.url || "/";
        const url = new URL(!isValidURL(req.url) ? `http://localhost${req.url}` : req.url);

        const [handler, params] = this.#getRoute(method, url.pathname) ?? [undefined, {}];

        if (!handler) {
            this.#respond(res, JsonResponse({ error: "Not Found" }, EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }

        const user = await Auth.validateToken("http", req.headers);
        if (!user) {
            this.#respond(res, JsonResponse({}, EHttpStatus.HTTP_401_UNAUTHORIZED));
            return;
        }

        this.#respond(res, await handler({ req, res, user, params }));
    }

    #addRoute(method: TMethod, path: string, handler: TRouteHandler) {
        if (!this.#routes.has(method)) {
            this.#routes.set(method, {});
        }

        this.#routes.get(method)![path] = handler;
    }

    #getRoute(method: TMethod, path: string): [TRouteHandler, Record<string, any>] | undefined {
        const methodRoutes = this.#routes.get(method);
        if (!methodRoutes) {
            return undefined;
        }

        const entries = Object.entries(methodRoutes);
        for (let i = 0; i < entries.length; ++i) {
            const [routePath, handler] = entries[i];
            const params = this.#matchPath(path, routePath);
            if (params) {
                return [handler, params];
            }
        }

        return undefined;
    }

    #matchPath(path: string, pattern: string) {
        const pathParts = path.split("/").filter(Boolean);
        const patternParts = pattern.split("/").filter(Boolean);

        const params: Record<string, any> = {};

        if (pathParts.length !== patternParts.length) {
            return undefined;
        }

        for (let i = 0; i < patternParts.length; i++) {
            const key = patternParts[i];
            if (/^{.*}$/.test(key)) {
                const paramName = key.slice(1, -1);
                params[paramName] = pathParts[i];
            } else if (key !== pathParts[i]) {
                return undefined;
            }
        }

        return params;
    }

    #getCorsHeaders() {
        const origins = [PUBLIC_FRONTEND_URL];
        const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
        const allowedHeaders = [
            "Accept",
            "Referer",
            "Accept-Encoding",
            "Accept-Language",
            "Content-Language",
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "User-Agent",
            "X-Forwarded-Proto",
            "X-Forwarded-Host",
            "X-Real-IP",
            "X-Forwarded-For",
        ];

        return {
            "Access-Control-Allow-Origin": origins.join(", "),
            "Access-Control-Allow-Methods": allowedMethods.join(", "),
            "Access-Control-Allow-Headers": allowedHeaders.join(", "),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "600",
        };
    }

    #respond(res: ServerResponse, response: IRouteResponse) {
        const { type, statusCode, headers, body } = response;
        const convertedHeaders = {
            "Content-Type": "application/json",
            ...this.#getCorsHeaders(),
            ...(headers ?? {}),
        };

        switch (type) {
            case "json":
                res.writeHead(statusCode, convertedHeaders);
                break;
            default:
                res.writeHead(statusCode, convertedHeaders);
                break;
        }

        res.end(body ?? "{}");
    }
}

const Routes = new _Routes();

export default Routes;
