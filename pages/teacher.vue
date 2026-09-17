<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SchoolClass, MatrixRow, Term } from '~/types'

const api = useApi()

const { data: classes } = await useAsyncData<SchoolClass[]>(
  'teacher-classes',
  () => api.fetchClasses(),
  { default: () => [] as SchoolClass[] }
)
const { data: terms } = await useAsyncData<Term[]>(
  'teacher-terms',
  () => api.fetchTerms(),
  { default: () => [] as Term[] }
)

const selectedClassId = ref<number | null>(null)
const selectedTermId = ref<number | null>(null)
const subjects = ref<{ id: number; name: string }[]>([])
const rows = ref<MatrixRow[]>([])
const dates = ref<string[]>([])
const activeTerm = ref<Term | null>(null)

watch(classes, (list) => {
  if (list?.length && !selectedClassId.value) selectedClassId.value = list[0].id
}, { immediate: true })

watch(terms, (list) => {
  if (!list?.length || selectedTermId.value) return
  const today = new Date().toISOString().slice(0, 10)
  const current = list.find(t => t.start_date <= today && today <= t.end_date)
  selectedTermId.value = current?.id ?? list[0].id
}, { immediate: true })

async function load() {
  if (!selectedClassId.value) return
  subjects.value = await api.fetchClassSubjects(selectedClassId.value)
  const res = await api.fetchGradesMatrix(
    selectedClassId.value,
    selectedTermId.value ?? undefined,
  )
  dates.value = res.dates
  rows.value = res.rows
  activeTerm.value = res.term
}
watch([selectedClassId, selectedTermId], load, { immediate: true })
</script>

<template>
  <div class="page">
    <h1>Журнал учителя</h1>

    <div class="filters">
      <ClassSwitcher v-model="selectedClassId" :classes="classes || []" />
      <TermSwitcher v-model="selectedTermId" :terms="terms || []" />
    </div>

    <TeacherClassMatrix
      v-if="selectedClassId"
      :rows="rows"
      :subjects="subjects"
      :dates="dates"
      :class-id="selectedClassId"
      :term="activeTerm"
      @changed="load"
    />

    <TeacherHomeworkList
      v-if="selectedClassId"
      :class-id="selectedClassId"
      :subjects="subjects"
      :term="activeTerm"
    />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.filters { display: flex; gap: 24px; align-items: center; margin: 12px 0 20px; flex-wrap: wrap; }
</style>
