import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@radix-ui/themes/styles.css";
import "@/assets/styles/main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider attribute="class">
            <Theme accentColor="purple">
                <App />
            </Theme>
        </ThemeProvider>
    </React.StrictMode>
);
