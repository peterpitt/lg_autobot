import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2f5fd0",
          dark: "#23499f",
          light: "#eaf0fc",
        },
      },
    },
  },
  plugins: [],
};

export default config;
