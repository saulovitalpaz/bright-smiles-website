import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#ecfdf5',
          '100': '#d1fae5',
          '200': '#a7f3d0',
          '300': '#6ee7b7',
          '400': '#34d399',
          '500': '#10b981',
          '600': '#059669',
          '700': '#047857',
          '800': '#065f46',
          '900': '#064e3b',
          DEFAULT: '#10b981'
        },
        secondary: {
          '50': '#e0f2fe',
          '100': '#bae6fd',
          '200': '#7dd3fc',
          '300': '#38bdf8',
          '400': '#0ea5e9',
          '500': '#0284c7',
          '600': '#0369a1',
          '700': '#075985',
          '800': '#0c4a6e',
          '900': '#164e63',
          DEFAULT: '#0284c7'
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
