/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(225, 80%, 55%)',
        accent: 'hsl(30, 90%, 60%)',
        'text-primary': 'hsl(215, 45%, 14%)',
        'text-secondary': 'hsl(215, 45%, 34%)',
        'bg-default': 'hsla(220, 20%, 98%, 1)',
        'bg-dark': 'hsla(220, 20%, 10%, 1)',
        'surface-default': 'hsl(0, 0%, 100%)',
        'surface-dark': 'hsl(220, 20%, 14%)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '24px',
      },
      spacing: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 12px hsla(220, 20%, 10%, 0.1)',
        'modal': '0 8px 24px hsla(220, 20%, 10%, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0.22,1,0.36,1)',
        'slide-up': 'slideUp 400ms cubic-bezier(0.22,1,0.36,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}