module.exports = {
  theme: {
    extend: {
      colors: {
        'digital-blue-opacity': 'rgba(0, 108, 184, 0.05)',
        'lagunita': '#007c92',
        lagunita: "#007c92",
        'berry': '#C31F70',
        'palo-verde': '#279989',
      },
      fontFamily: {
        'Open_sans': ['"Open_Sans"', ...defaultTheme.fontFamily.sans],
        'Poppins': ['"Poppins"', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}