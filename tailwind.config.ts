import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amat: {
          blue: "#003a70",
          accent: "#00a6e3",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
