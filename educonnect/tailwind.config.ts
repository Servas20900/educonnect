import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,jsx,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
