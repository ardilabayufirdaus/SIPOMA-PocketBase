export default {
  plugins: {
    tailwindcss: {
      config: './tailwind.config.js',
    },
    autoprefixer: {
      grid: true,
    },
    cssnano:
      process.env.NODE_ENV === 'production'
        ? {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: false,
              },
            ],
          }
        : false,
  },
};
