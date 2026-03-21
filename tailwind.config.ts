import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#F8F8FA',
          100: '#F1F2F6',
          900: '#101217',
          950: '#080A0F',
        },
      },
      boxShadow: {
        soft: '0 10px 40px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino', 'Times New Roman', 'serif'],
        sans: ['Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
