/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'overlay-show': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        'content-show': {
          '0%': { 
            opacity: 0,
            transform: 'translate(-50%, 100vh) scale(0.96)'
          },
          '70%': {
            opacity: 0.7,
            transform: 'translate(-50%, -48%) scale(0.98)'
          },
          '100%': { 
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
          }
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'overlay-show': 'overlay-show 200ms ease-out',
        'content-show': 'content-show 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in'
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
    },
  },
  plugins: [],
}