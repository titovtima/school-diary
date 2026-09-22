<script setup lang="ts">
import { computed } from 'vue'

interface TeacherLesson {
  day_of_week: number
  lesson_num: number
  class_id: number
  class_name: string
  subject_id: number
  subject_name: string
}

/** Сгруппированный урок — один слот, в котором может быть несколько классов. */
interface MergedLesson {
  lesson_num: number
  subject_name: string
  /** true, если у учителя в один слот идут разные предметы */
  mixedSubjects: boolean
  classes: { id: number; name: string }[]
}

const appConfig = useAppConfig()
const api = useApi()
const { user } = useAuth()
const userId = computed(() => user.value?.id ?? null)

const { data: lessons, pending } = await useAsyncData<TeacherLesson[]>(
  'teacher-week-schedule',
  () => userId.value ? api.fetchTeacherWeekSchedule() : Promise.resolve([]),
  { watch: [userId], default: () => [] as TeacherLesson[] }
)

/**
 * Группируем по дню и номеру урока.
 * В каждом слоте — массив классов.
 * Если у одного слота разные предметы (например, биология в 7 и 8),
 * берём первый предмет и помечаем mixedSubjects=true.
 */
const byDay = computed(() => {
  const map = new Map<number, MergedLesson[]>()

  const raw = lessons.value ?? []

  // шаг 1: сгруппировать по дню -> по номеру урока
  const grouped = new Map<number, Map<number, TeacherLesson[]>>()
  for (const l of raw) {
    if (!grouped.has(l.day_of_week)) grouped.set(l.day_of_week, new Map())
    const dayMap = grouped.get(l.day_of_week)!
    if (!dayMap.has(l.lesson_num)) dayMap.set(l.lesson_num, [])
    dayMap.get(l.lesson_num)!.push(l)
  }

  // шаг 2: собрать MergedLesson
  for (const [day, dayMap] of grouped) {
    const merged: MergedLesson[] = []
    for (const [lessonNum, list] of dayMap) {
      const subjects = new Set(list.map(x => x.subject_name))
      const classes = list.map(x => ({ id: x.class_id, name: x.class_name }))
      // убрать дубли классов (на всякий случай)
      const uniqueClasses = Array.from(
        new Map(classes.map(c => [c.id, c])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      merged.push({
        lesson_num: lessonNum,
        subject_name: list[0].subject_name,
        mixedSubjects: subjects.size > 1,
        classes: uniqueClasses,
      })
    }
    merged.sort((a, b) => a.lesson_num - b.lesson_num)
    map.set(day, merged)
  }

  return map
})

const { lessonTime } = useSchedule()
</script>

<template>
  <div class="page">
    <h1>Моё расписание</h1>

    <p v-if="pending && !lessons?.length" class="muted">Загрузка…</p>

    <div v-else class="layout">
      <div class="days">
        <section v-for="day in 5" :key="day" class="day">
          <h2>{{ appConfig.daysOfWeek[day - 1] }}</h2>
          <template v-if="byDay.get(day)?.length">
            <div
              v-for="l in byDay.get(day)"
              :key="`${l.lesson_num}-${l.classes.map(c => c.id).join('-')}`"
              class="lesson"
            >
              <div class="head">
                <span class="num">{{ l.lesson_num }}</span>
                <span class="time">{{ lessonTime(l.lesson_num) }}</span>
                <span class="class">
                  {{ l.classes.map(c => c.name).join(', ') }} класс
                </span>
              </div>
              <div class="subject">
                {{ l.subject_name }}
                <span v-if="l.mixedSubjects" class="mixed">и др.</span>
              </div>
            </div>
          </template>
          <p v-else class="muted small">Уроков нет</p>
        </section>
      </div>
      <BellScheduleCard />
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.layout { display: grid; grid-template-columns: 1fr 200px; gap: 24px; align-items: start; }
.days { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.day h2 {
  margin: 0 0 8px; font-size: 14px; color: #0f172a;
  border-bottom: 2px solid #2563eb; padding-bottom: 4px;
}
.lesson {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 8px; background: #fff;
}
.head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.num {
  display: inline-flex; justify-content: center; align-items: center;
  width: 20px; height: 20px; border-radius: 4px;
  background: #2563eb; color: #fff; font-size: 11px; font-weight: 700;
}
.time { color: #64748b; font-size: 11px; }
.class { font-weight: 600; color: #0f172a; }
.subject { font-size: 12px; color: #475569; margin-top: 2px; }
.mixed { color: #94a3b8; font-weight: 400; }
.muted { color: #94a3b8; font-size: 13px; }
.small { font-size: 12px; }
</style>
