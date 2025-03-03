/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'theme-1': '#ff3e00',
        'theme-2': '#4075a6',
        'bg-0': 'rgb(202, 216, 228)',
        'bg-1': 'hsl(209, 36%, 86%)',
        'bg-2': 'hsl(224, 44%, 95%)',
        'text': 'rgba(0, 0, 0, 0.7)',
        'drag-indicator': '#3b82f6',
        'drag-highlight': 'rgba(59, 130, 246, 0.05)',
        'drag-border': '#3b82f6',
      },
      fontFamily: {
        'body': ['Arial', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
        'mono': ['Fira Mono', 'monospace']
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none', // Prevents prose from constraining width
            color: 'rgba(0, 0, 0, 0.7)', // Matches your text color variable
            h2: {
              color: 'rgba(0, 0, 0, 0.8)',
              fontWeight: '600',
            },
            a: {
              color: '#3b82f6', // Matches your theme-1 color
              '&:hover': {
                color: '#2563eb',
              },
            },
            ul: {
              listStyleType: 'disc',
            },
          },
        },
      },
      animation: {
        'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.7)' },
          '50%': { borderColor: 'rgba(59, 130, 246, 0.3)' },
        },
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
}
