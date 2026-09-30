import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#9af5df",
          300: "#5ee7cb",
          400: "#2dcfae",
          500: "#13b392",
          600: "#0b8f77",
          700: "#0b7260",
          800: "#0d5a4d",
          900: "#0f4a40",
          950: "#032b26",
        },
      },
    },
  },
  plugins: [],
};
export default config;
