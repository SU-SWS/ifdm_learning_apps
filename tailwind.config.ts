const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {},
      fontFamily: {
        'open-sans': ['Open Sans', ...fontFamily.sans],
        'poppins': ['Poppins', ...fontFamily.sans]
      }
    }
  },
  plugins: [],
}
