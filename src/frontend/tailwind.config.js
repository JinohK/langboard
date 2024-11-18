import tailwindForms from "@tailwindcss/forms";
import tailwindTypography from "@tailwindcss/typography";
import tailwindAnimate from "tailwindcss-animate";
import { withTV } from "tailwind-variants/transformer";

/** @type {import('tailwindcss').Config} */
const config = {
    content: ["./index.html", "./src/**/*.{js,ts,tsx,jsx}"],
    darkMode: ["class"],
    experimental: {
        optimizeUniversalDefaults: true,
    },
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "collapse-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-collapsible-content-height)",
                    },
                },
                "collapse-up": {
                    from: {
                        height: "var(--radix-collapsible-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "caret-blink": {
                    "0%,70%,100%": {
                        opacity: "1",
                    },
                    "20%,50%": {
                        opacity: "0",
                    },
                },
                progress: {
                    "0%": {
                        transform: "translateX(0) scaleX(0)",
                    },
                    "40%": {
                        transform: "translateX(0) scaleX(0.2)",
                    },
                    "100%": {
                        transform: "translateX(100%) scaleX(0.2)",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.3s ease-out",
                "accordion-up": "accordion-up 0.3s ease-out",
                "collapse-down": "collapse-down 0.3s ease-out",
                "collapse-up": "collapse-up 0.3s ease-out",
                "caret-blink": "caret-blink 1.25s ease-out infinite",
                progress: "progress 3s infinite linear",
            },
        },
        screens: {
            xs: "520px",
            sm: "768px",
            md: "1024px",
            lg: "1280px",
            xl: "1640px",
        },
    },
    plugins: [
        tailwindForms({
            strategy: "class",
        }),
        tailwindTypography(),
        tailwindAnimate,
    ],
};

export default withTV(config);
