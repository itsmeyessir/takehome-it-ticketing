/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        surface: "#F8FAFC",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        destructive: {
          DEFAULT: "#DC2626",
          hover: "#B91C1C",
        },
        status: {
          open: "#3B82F6",
          "in-progress": "#F59E0B",
          escalated: "#EF4444",
          resolved: "#10B981",
          closed: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
