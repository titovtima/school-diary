export default defineNuxtConfig({
  devtools: { enabled: true },
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
      // Значения по умолчанию — перезаписываются на клиенте из app.config.ts
      title: 'Школа Ветви',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Электронный дневник школы «Ветви»' },
      ],
      link: [
        { rel: 'icon', type: 'image/jpeg', href: '/vetvi-school.jpg' },
        { rel: 'apple-touch-icon', href: '/vetvi-school.jpg' },
      ],
    },
  },
})
