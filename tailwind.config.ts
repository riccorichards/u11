/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#001B48",
          800: "#02457A",
          DEFAULT: "#001B48",
        },
        ocean: "#018ABE",
        sky: "#97CADB",
        mist: "#D6E8EE",
        pitch: "#0a1628",
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "pitch-gradient":
          "linear-gradient(135deg, #001B48 0%, #02457A 50%, #018ABE 100%)",
        "card-gradient":
          "linear-gradient(145deg, rgba(1,138,190,0.08) 0%, rgba(0,27,72,0.4) 100%)",
      },
    },
  },
  keyframes: {
    fadeUp: {
      "0%": { opacity: "0", transform: "translateY(14px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  animation: {
    fadeUp: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  plugins: [],
};
