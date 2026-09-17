<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AuthUser, Grade, GradeType, Homework, Term } from '~/types'
import { normalizeDate } from '~/composables/useDate'

const api = useApi()

const { data: me, refresh: refreshMe } = await useAsyncData<AuthUser | null>(
  'me-student',
  () => $fetch<AuthUser | null>('/api/auth/me'),
  { default: () => null }
)
const studentId = computed<number | null>(() => me.value?.student_id ?? null)

const tab = ref<'grades' | 'homework'>('grades')

const { data: terms } = await useAsyncData<Term[]>(
  'student-terms',
  () => api.fetchTerms(),
  { default: () => [] as Term[] }
)

const { data: gradeTypes } = await useAsyncData<GradeType[]>(
  'grade-types',
  () => api.fetchGradeTypes(),
  { default: () => [] as GradeType[] }
)

const selectedTermId = ref<number | null>(null)
watch(terms, (list) => {
  if (!list?.length || selectedTermId.value) return
  const today = new Date().toISOString().slice(0, 10)
  const current = list.find(t => {
    const s = normalizeDate(t.start_date)
    const e = normalizeDate(t.end_date)
    return s <= today && today <= e
  })
  selectedTermId.value = current?.id ?? list[0].id
}, { immediate: true })

const activeTerm = computed<Term | null>(() => {
  if (!terms.value?.length) return null
  return terms.value.find(t => t.id === selectedTermId.value) ?? null
})

const {
  data: gradesPayload,
  pending: gradesPending,
  refresh: refreshGrades,
} = await useAsyncData(
  'student-grades-data',
  async () => {
    if (!studentId.value) return { grades: [] as Grade[], subjects: [] as { id: number; name: string }[] }
    return await api.fetchStudentGrades(studentId.value)
  },
  {
    watch: [studentId],
    default: () => ({ grades: [] as Grade[], subjects: [] as { id: number; name: string }[] }),
  }
)

const grades   = computed<Grade[]>(() => gradesPayload.value?.grades ?? [])
const subjects = computed<{ id: number; name: string }[]>(() => gradesPayload.value?.subjects ?? [])

const { data: homework } = await useAsyncData<Homework[]>(
  'student-homework',
  () => studentId.value ? api.fetchHomework(studentId.value) : Promise.resolve([]),
  { watch: [studentId], default: () => [] as Homework[] }
)

const gradesInTerm = computed<Grade[]>(() => {
  const all = grades.value
  if (!activeTerm.value) return all
  const start = normalizeDate(activeTerm.value.start_date)
  const end   = normalizeDate(activeTerm.value.end_date)
  return all.filter(g => {
    const d = normalizeDate(g.lesson_date)
    return d >= start && d <= end
  })
})

const hasAnyGradesOverall = computed(() => grades.value.length > 0)
const hasGradesInTerm = computed(() => gradesInTerm.value.length > 0)

async function reload() {
  await Promise.all([refreshMe(), refreshGrades()])
}
</script>

<template>
  <div class="page">
    <h1>Мой дневник</h1>

    <div class="toolbar">
      <TermSwitcher v-model="selectedTermId" :terms="terms || []" />
      <button class="refresh" @click="reload">Обновить</button>
    </div>

    <p v-if="!studentId" class="error">
      Не удалось определить ученика.
    </p>

    <template v-else>
      <div class="tabs">
        <button :class="{ active: tab === 'grades' }" @click="tab = 'grades'">Оценки</button>
        <button :class="{ active: tab === 'homework' }" @click="tab = 'homework'">Домашние задания</button>
      </div>

      <p v-if="gradesPending && !grades.length" class="loading">Загрузка…</p>

      <template v-else-if="tab === 'grades'">
        <p v-if="hasAnyGradesOverall && !hasGradesInTerm" class="empty-term">
          В выбранной четверти оценок нет.
        </p>
        <StudentGradesMatrix
          :grades="gradesInTerm"
          :term="activeTerm"
          :subjects="subjects"
          :grade-types="gradeTypes || []"
        />
      </template>

      <HomeworkList v-else :homework="homework || []" />
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.toolbar { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
.refresh {
  padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 14px;
}
.refresh:hover { background: #f1f5f9; }
.tabs { display: flex; gap: 8px; margin: 12px 0; }
.tabs button { padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; }
.tabs button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.loading { color: #64748b; }
.error { color: #dc2626; background: #fee2e2; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.empty-term {
  color: #b45309; background: #fef3c7; padding: 8px 12px;
  border-radius: 6px; font-size: 13px; margin: 8px 0;
}
</style>
