import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";
import svgr from "vite-plugin-svgr";

dns.setDefaultResultOrder("verbatim");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isLocal = mode !== "production" && process.env.ENVIRONMENT !== "development";
    if (fs.existsSync("../../.env")) {
        dotenv.config({ path: "../../.env" });
    }

    const PORT = Number(process.env.FRONTEND_PORT) || 5173;

    const BACKEND_SERVER = `http://localhost:${process.env.BACKEND_PORT}`;

    return {
        plugins: [react(), tsconfigPaths(), svgr()],
        define: {
            "process.env.PROJECT_NAME": JSON.stringify(process.env.PROJECT_NAME),
            "process.env.SOCKET_URL": JSON.stringify(isLocal ? BACKEND_SERVER : process.env.SOCKET_URL),
            "process.env.API_URL": JSON.stringify(isLocal ? BACKEND_SERVER : process.env.API_URL),
        },
        build: {
            watch: {
                exclude: ["**/node_modules/**", "**/.git/**"],
            },
        },
        server: {
            host: true,
            port: PORT,
            strictPort: true,
        },
    };
});
