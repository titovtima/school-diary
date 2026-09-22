<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import type { Grade, Term, GradeType } from '~/types'
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDateShort, schoolDaysBetween, normalizeDate } from '~/composables/useDate'
import { weightedAverage, formatAvg } from '~/composables/useGradeCalc'

const props = defineProps<{
  grades: Grade[]
  term: Term | null
  subjects: { id: number; name: string }[]
  gradeTypes: GradeType[]
}>()

const selected = ref<{ grade: Grade; subject: string } | null>(null)

const effectiveSubjects = computed(() => {
  if (props.subjects?.length) return props.subjects
  const map = new Map<number, string>()
  for (const g of props.grades) map.set(g.subject_id, g.subject_name)
  return Array.from(map, ([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const dates = computed<string[]>(() => {
  if (props.term) {
    const list = schoolDaysBetween(props.term.start_date, props.term.end_date)
    if (list.length) return list
  }
  return Array.from(new Set(props.grades.map(g => normalizeDate(g.lesson_date))))
    .filter(Boolean)
    .sort()
})

const index = computed(() => {
  const m = new Map<string, Grade[]>()
  for (const g of props.grades) {
    const key = `${g.subject_id}|${normalizeDate(g.lesson_date)}`
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(g)
  }
  return m
})

function cell(subjectId: number, date: string): Grade[] {
  return index.value.get(`${subjectId}|${normalizeDate(date)}`) || []
}

function subjectAvg(subjectId: number): number | null {
  return weightedAverage(props.grades.filter(g => g.subject_id === subjectId))
}
const totalAvg = computed(() => weightedAverage(props.grades))

function openDetails(g: Grade, subjectName: string) {
  selected.value = { grade: g, subject: subjectName }
}
function closeDetails() { selected.value = null }

// --- Ширина первой колонки (sticky-смещение второй) ---
// Без ResizeObserver: он триггерит внутренний планировщик Vue и в HMR
// падает на startTime. Вместо этого — watch + nextTick + rAF.
const firstColRef = ref<HTMLElement | null>(null)
const col1Width = ref(0)

function measure() {
  if (typeof window === 'undefined') return
  if (!firstColRef.value) return
  requestAnimationFrame(() => {
    if (!firstColRef.value) return
    const w = firstColRef.value.offsetWidth
    if (w && w !== col1Width.value) col1Width.value = w
  })
}

onMounted(() => {
  nextTick(measure)
  window.addEventListener('resize', measure)
})

watch([effectiveSubjects, dates], () => nextTick(measure))
</script>

<template>
  <div class="matrix-root" :style="{ '--col1-width': col1Width + 'px' }">
    <div class="matrix-wrap">
      <table class="matrix">
        <thead>
          <tr>
            <th :ref="el => (firstColRef = el as HTMLElement | null)" class="col-subject sticky-1">Предмет</th>
            <th class="col-avg sticky-2">Средн.</th>
            <th v-for="d in dates" :key="d" class="col-date">{{ formatDateShort(d) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in effectiveSubjects" :key="s.id">
            <td class="col-subject sticky-1">{{ s.name }}</td>
            <td class="col-avg sticky-2">{{ formatAvg(subjectAvg(s.id)) }}</td>
            <td v-for="d in dates" :key="d" class="col-cell">
              <span
                v-for="g in cell(s.id, d)"
                :key="g.id"
                class="grade"
                :class="gradeWeightClass(g.weight)"
                :title="`${g.grade_type_name} · вес ${g.weight}`"
                @click="openDetails(g, s.name)"
              >{{ g.value }}</span>
            </td>
          </tr>
          <tr v-if="!effectiveSubjects.length">
            <td :colspan="dates.length + 2" class="empty">Предметов нет</td>
          </tr>
          <tr v-else class="total-row">
            <td class="col-subject sticky-1">Итого</td>
            <td class="col-avg sticky-2">{{ formatAvg(totalAvg) }}</td>
            <td :colspan="dates.length"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <GradeLegend v-if="gradeTypes.length" :types="gradeTypes" />
    <p class="hint">Клик по оценке — подробности: тип работы, коэффициент, комментарий.</p>

    <GradeDetailsPopover
      v-if="selected"
      :grade="{
        id: selected.grade.id,
        value: selected.grade.value,
        weight: selected.grade.weight,
        grade_type_name: selected.grade.grade_type_name,
        subject_name: selected.subject,
        lesson_date: selected.grade.lesson_date,
        comment: selected.grade.comment,
      }"
      :title="selected.subject"
      @close="closeDetails"
    />
  </div>
</template>

<style scoped>
.matrix-root { display: flex; flex-direction: column; }
.matrix-wrap { overflow-x: auto; position: relative; }
.matrix { border-collapse: separate; border-spacing: 0; font-size: 12px; }
.matrix th, .matrix td {
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 8px;
  text-align: center;
  background: #fff;
}
.matrix thead th { background: #f8fafc; font-weight: 600; }
.col-subject { text-align: left; white-space: nowrap; width: max-content; }
.col-avg { white-space: nowrap; width: max-content; background: #f1f5f9; font-weight: 600; }
.col-date { white-space: nowrap; min-width: 40px; }
.col-cell { min-width: 40px; }

.sticky-1 {
  position: sticky; left: 0; z-index: 2;
  background: #fff; box-shadow: 2px 0 0 #e2e8f0;
}
.matrix thead .sticky-1 { background: #f8fafc; z-index: 4; }
.total-row .sticky-1 { background: #f8fafc; }

.sticky-2 {
  position: sticky; left: var(--col1-width, 0); z-index: 2;
  background: #f1f5f9; box-shadow: 2px 0 0 #e2e8f0;
}
.matrix thead .sticky-2 { background: #f1f5f9; z-index: 4; }
.total-row .sticky-2 { background: #f8fafc; }

.empty { color: #94a3b8; padding: 20px; }
.total-row td { background: #f8fafc; font-weight: 600; }
.hint { font-size: 12px; color: #94a3b8; margin-top: 6px; }
</style>
