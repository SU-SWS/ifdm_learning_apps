module.exports = {
  theme: {
    extend: {
      colors: {
        'digital-blue-opacity': 'rgba(0, 108, 184, 0.05)',
      },
      fontFamily: {
        mule: ['"Open_Sans"', ...defaultTheme.fontFamily.sans],
        'Poppins': ['"Poppins"', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}