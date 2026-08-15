import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ggreen: {
          primary: "#16A34A",
          deep: "#0F7A3D",
        },
        gpurple: {
          primary: "#7C3AED",
          deep: "#5B21B6",
        },
        gblue: {
          primary: "#2563EB",
          deep: "#1D4ED8",
        },
        gsurface: "#FFFFFF",
        gbackground: "#F8FAFC",
        gborder: "#E2E8F0",
        gtext: "#0F172A",
        gmuted: "#64748B",
        gerror: "#DC2626",
        gwarning: "#F59E0B",
        glight: {
          bubble: "#F1F5F9",
        },
        gdark: {
          surface: "#0F172A",
          background: "#020617",
          border: "#1E293B",
          text: "#F8FAFC",
          muted: "#94A3B8",
          bubble: "#1E293B",
        },
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        gbutton: "8px",
        gcard: "12px",
        gbubble: "14px",
      },
      minHeight: {
        gbutton: "48px",
      },
    },
  },
  plugins: [],
};

export default config;