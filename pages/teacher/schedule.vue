<script setup lang="ts">
import { computed } from 'vue'
import { formatDayMonth, isToday } from '~/composables/useWeek'

interface TeacherLesson {
  day_of_week: number
  lesson_num: number
  date: string
  class_id: number
  class_name: string
  subject_id: number
  subject_name: string
  homework: { due_date: string; description: string }[]
}
interface MergedLesson {
  lesson_num: number
  date: string
  subject_name: string
  mixedSubjects: boolean
  classes: { id: number; name: string }[]
  homework: { due_date: string; description: string }[]
}

const appConfig = useAppConfig()
const api = useApi()
const { user } = useAuth()
const userId = computed(() => user.value?.id ?? null)

const { weekStart, days, prev, next, goToday } = useWeek()

const { data: lessons, pending } = await useAsyncData<TeacherLesson[]>(
  'teacher-week-schedule',
  () => userId.value ? api.fetchTeacherWeekSchedule(weekStart.value) : Promise.resolve([]),
  { watch: [userId, weekStart], default: () => [] as TeacherLesson[] }
)

const byDate = computed(() => {
  const map = new Map<string, MergedLesson[]>()
  const grouped = new Map<string, Map<number, TeacherLesson[]>>()
  for (const l of lessons.value ?? []) {
    if (!grouped.has(l.date)) grouped.set(l.date, new Map())
    const m = grouped.get(l.date)!
    if (!m.has(l.lesson_num)) m.set(l.lesson_num, [])
    m.get(l.lesson_num)!.push(l)
  }
  for (const [date, m] of grouped) {
    const merged: MergedLesson[] = []
    for (const [lessonNum, list] of m) {
      const subjects = new Set(list.map(x => x.subject_name))
      const classes = Array.from(
        new Map(list.map(x => [x.class_id, { id: x.class_id, name: x.class_name }])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))
      // ДЗ собираем только тех классов, что в этом слоте
      const hw: { due_date: string; description: string }[] = []
      for (const x of list) for (const h of x.homework) hw.push(h)
      merged.push({
        lesson_num: lessonNum,
        date,
        subject_name: list[0].subject_name,
        mixedSubjects: subjects.size > 1,
        classes,
        homework: hw,
      })
    }
    merged.sort((a, b) => a.lesson_num - b.lesson_num)
    map.set(date, merged)
  }
  return map
})

const { lessonTime } = useSchedule()

function dayLabel(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}
</script>

<template>
  <div class="page">
    <h1>Моё расписание</h1>

    <div class="toolbar">
      <WeekSwitcher :model-value="weekStart" @update:model-value="weekStart = $event" />
    </div>

    <p v-if="pending && !lessons?.length" class="muted">Загрузка…</p>

    <div v-else class="layout">
      <div class="days">
        <section v-for="(d, i) in days" :key="d" class="day">
          <h2 :class="{ today: isToday(d) }">
            {{ appConfig.daysOfWeek[i] }} · {{ dayLabel(d) }}
          </h2>
          <template v-if="byDate.get(d)?.length">
            <div
              v-for="l in byDate.get(d)"
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
              <div v-if="l.homework.length" class="row hw">
                <span class="label">ДЗ:</span>
                <ul>
                  <li v-for="(h, idx) in l.homework" :key="idx">
                    <span class="due">к {{ h.due_date }}:</span>
                    {{ h.description }}
                  </li>
                </ul>
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
.toolbar { margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: 1fr 200px; gap: 24px; align-items: start; }
.days { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.day h2 {
  margin: 0 0 8px; font-size: 14px; color: #0f172a;
  border-bottom: 2px solid #2563eb; padding-bottom: 4px;
}
.day h2.today { border-color: #16a34a; color: #166534; }
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
.row { display: flex; align-items: flex-start; gap: 6px; margin-top: 6px; font-size: 12px; }
.label { color: #64748b; flex-shrink: 0; }
.row ul { margin: 0; padding-left: 16px; }
.row li + li { margin-top: 2px; }
.due { color: #64748b; }
.muted { color: #94a3b8; font-size: 13px; }
.small { font-size: 12px; }
</style>
