/**
 * Единый конфиг школы.
 * Меняется здесь — подхватывается в <head>, шапке и по всему приложению.
 *
 * Для иконки: положи файл в public/<filename>. Например,
 * если файл называется vetvi-school.jpg, положи его в public/vetvi-school.jpg,
 * а здесь оставь icon: '/vetvi-school.jpg'.
 */
export default defineAppConfig({
  school: {
    /** Полное название школы */
    name: 'Школа Ветви',
    /** Короткое название — для шапки и title */
    shortName: 'Школа Ветви',
    /** Иконка в public/ — путь от корня */
    icon: '/vetvi-school.jpg',
    /** Необязательное описание для meta description */
    description: 'Электронный дневник школы «Ветви»',
    /** Язык документа */
    lang: 'ru',
  },
})
