/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');
const typography = require('@tailwindcss/typography');

export default {
  content: [
    "./src/**/*.{js,html}",
    "./src/routes/**/*.js",
    "./src/ui/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: colors.zinc,
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        success: {
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          100: '#fef9c3',
          600: '#ca8a04',
          700: '#a16207',
        },
        error: {
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      },
      fontFamily: {
        sans: ['"Geist"', 'ui-sans-serif', 'system-ui', '-apple-system', "BlinkMacSystemFont", "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [typography],
}
