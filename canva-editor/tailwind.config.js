/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        velox: {
          void:        '#080C14',
          deep:        '#0D1220',
          card:        '#0F1520',
          card2:       '#141B2A',
          border:      '#1E2A3A',
          cyan:        '#2DD4F0',
          'cyan-dim':  'rgba(45,212,240,0.12)',
          'cyan-glow': 'rgba(45,212,240,0.25)',
          'text-hi':   '#F1F5F9',
          'text-mid':  '#B0BDD0',
          'text-lo':   '#6B7FA0',
          'text-inv':  '#080C14',
        },
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
        chip: '100px',
        icon: '10px',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        fadeIn:  'fadeIn 0.3s ease',
        slideUp: 'slideUp 0.25s ease',
      },
    },
  },
  plugins: [],
};
