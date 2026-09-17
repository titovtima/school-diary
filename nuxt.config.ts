export default defineNuxtConfig({
  css: ['~/assets/grade-colors.css'],
  devtools: { enabled: true },
  typescript: { strict: true },
  runtimeConfig: {
    pgHost: process.env.PGHOST,
    pgPort: process.env.PGPORT,
    pgUser: process.env.PGUSER,
    pgPassword: process.env.PGPASSWORD,
    pgDatabase: process.env.PGDATABASE,
  },
})
