export default defineNuxtConfig({
  devtools: { enabled: false },
  typescript: { strict: true },
  css: ['~/assets/grade-colors.css'],

  runtimeConfig: {
    pgHost: process.env.PGHOST,
    pgPort: process.env.PGPORT,
    pgUser: process.env.PGUSER,
    pgPassword: process.env.PGPASSWORD,
    pgDatabase: process.env.PGDATABASE,
  },

  app: {
    head: {
      title: 'Школа Ветви',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/jpeg', href: '/vetvi-school.jpg' },
      ],
    },
  },
})
