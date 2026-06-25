/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linguo: {
          smokyBlack:     '#100F06',
          fantasy:        '#F5F4ED',
          lightGold:      '#FFDA57',
          malibu:         '#7DCAF6',
          brightLavender: '#A293FF',
          teal:           '#00917A',
          blossomPink:    '#FFBBF4',
          lightCoral:     '#F47575',
        },
      },
    },
  },
  plugins: [],
}
