import { ThemeProvider } from "next-themes";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/assets/styles/main.css";

const Strict = process.env.IS_PRODUCTION !== "true" ? React.StrictMode : React.Fragment;

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Strict>
        <ThemeProvider attribute="class">
            <App />
        </ThemeProvider>
    </Strict>
);
