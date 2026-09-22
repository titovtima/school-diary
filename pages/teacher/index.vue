<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { SchoolClass, MatrixRow, Term, GradeType } from '~/types'

const api = useApi()
const { user } = useAuth()
const userId = computed(() => user.value?.id ?? null)

const isAdmin = computed(() => user.value?.is_admin === true)
const showAll = ref(false)

// Классы: зависят и от user, и от showAll
const { data: classes, refresh: refreshClasses } = await useAsyncData<SchoolClass[]>(
  'teacher-my-classes',
  () => userId.value
    ? api.fetchMyClasses(isAdmin.value && showAll.value)
    : Promise.resolve([]),
  { watch: [userId, showAll], default: () => [] as SchoolClass[] }
)

const { data: terms } = await useAsyncData<Term[]>(
  'teacher-terms', () => api.fetchTerms(), { default: () => [] as Term[] }
)
const { data: gradeTypes } = await useAsyncData<GradeType[]>(
  'teacher-grade-types', () => api.fetchGradeTypes(), { default: () => [] as GradeType[] }
)

const selectedClassId = ref<number | null>(null)
const selectedTermId = ref<number | null>(null)
const subjects = ref<{ id: number; name: string }[]>([])
const rows = ref<MatrixRow[]>([])
const dates = ref<string[]>([])
const activeTerm = ref<Term | null>(null)

// При обновлении списка классов — выбрать первый, если текущий не в нём
watch(classes, (list) => {
  if (!list?.length) { selectedClassId.value = null; return }
  if (!selectedClassId.value || !list.find(c => c.id === selectedClassId.value)) {
    selectedClassId.value = list[0].id
  }
}, { immediate: true })

watch(terms, (list) => {
  if (!list?.length || selectedTermId.value) return
  const today = new Date().toISOString().slice(0, 10)
  const current = list.find(t => t.start_date <= today && today <= t.end_date)
  selectedTermId.value = current?.id ?? list[0].id
}, { immediate: true })

async function load() {
  if (!selectedClassId.value || !userId.value) return
  subjects.value = await api.fetchClassSubjects(selectedClassId.value, isAdmin.value && showAll.value)
  const res = await api.fetchGradesMatrix(
    selectedClassId.value,
    selectedTermId.value ?? undefined,
    isAdmin.value && showAll.value,
  )
  dates.value = res.dates
  rows.value = res.rows
  activeTerm.value = res.term
}
watch([selectedClassId, selectedTermId, showAll, userId], load, { immediate: true })
</script>

<template>
  <div class="page">
    <h1>Журнал учителя</h1>

    <div class="filters">
      <ClassSwitcher v-model="selectedClassId" :classes="classes || []" />
      <TermSwitcher v-model="selectedTermId" :terms="terms || []" />
      <label v-if="isAdmin" class="toggle">
        <input v-model="showAll" type="checkbox">
        Показать все предметы (админ)
      </label>
    </div>

    <p v-if="userId && !classes?.length" class="empty">
      У вас нет классов с уроками. Обратитесь к администратору.
    </p>

    <TeacherClassMatrix
      v-if="selectedClassId"
      :rows="rows" :subjects="subjects" :dates="dates"
      :class-id="selectedClassId" :term="activeTerm" :grade-types="gradeTypes || []"
      @changed="load"
    />

    <TeacherHomeworkList
      v-if="selectedClassId"
      :class-id="selectedClassId" :subjects="subjects" :term="activeTerm"
      :show-all="isAdmin && showAll"
    />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.filters { display: flex; gap: 24px; align-items: center; margin: 12px 0 20px; flex-wrap: wrap; }
.toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; cursor: pointer; }
.toggle input { width: 16px; height: 16px; }
.empty { color: #b45309; background: #fef3c7; padding: 8px 12px; border-radius: 6px; }
</style>
