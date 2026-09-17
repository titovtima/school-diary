<script setup lang="ts">
import { computed } from 'vue'
import type { Grade, Term } from '~/types'
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDateShort, schoolDaysBetween, normalizeDate } from '~/composables/useDate'
import { weightedAverage, formatAvg } from '~/composables/useGradeCalc'

const props = defineProps<{
  grades: Grade[]
  term: Term | null
  subjects: { id: number; name: string }[]
}>()

// Список предметов: приоритет — subjects из API,
// fallback — уникальные предметы из оценок
const effectiveSubjects = computed(() => {
  if (props.subjects?.length) return props.subjects
  const map = new Map<number, string>()
  for (const g of props.grades) map.set(g.subject_id, g.subject_name)
  return Array.from(map, ([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

// Даты:
//  - если есть term — все учебные дни четверти (включая будущие)
//  - если term битый — уникальные дни из оценок
const dates = computed<string[]>(() => {
  if (props.term) {
    const list = schoolDaysBetween(props.term.start_date, props.term.end_date)
    if (list.length) return list
  }
  return Array.from(new Set(props.grades.map(g => normalizeDate(g.lesson_date))))
    .filter(Boolean)
    .sort()
})

// Индекс: `subject_id|YYYY-MM-DD` -> Grade[]
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

// Средний по предмету — только по оценкам ИЗ ЭТОЙ ЧЕТВЕРТИ
// (props.grades уже отфильтрован на странице), поэтому никаких
// «чужих» средних не появится.
function subjectAvg(subjectId: number): number | null {
  return weightedAverage(props.grades.filter(g => g.subject_id === subjectId))
}

const totalAvg = computed(() => weightedAverage(props.grades))
</script>

<template>
  <div class="matrix-wrap">
    <table class="matrix">
      <thead>
        <tr>
          <th class="col-subject">Предмет</th>
          <th class="col-avg">Средн.</th>
          <th v-for="d in dates" :key="d" class="col-date">{{ formatDateShort(d) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in effectiveSubjects" :key="s.id">
          <td class="col-subject">{{ s.name }}</td>
          <td class="col-avg">{{ formatAvg(subjectAvg(s.id)) }}</td>
          <td v-for="d in dates" :key="d" class="col-cell">
            <span
              v-for="g in cell(s.id, d)"
              :key="g.id"
              class="grade"
              :class="gradeWeightClass(g.weight)"
              :title="`${g.grade_type_name} (вес ${g.weight})${g.comment ? ' — ' + g.comment : ''}`"
            >{{ g.value }}</span>
          </td>
        </tr>
        <tr v-if="!effectiveSubjects.length">
          <td :colspan="dates.length + 2" class="empty">Предметов нет</td>
        </tr>
        <tr v-else class="total-row">
          <td class="col-subject">Итого</td>
          <td class="col-avg">{{ formatAvg(totalAvg) }}</td>
          <td :colspan="dates.length"></td>
        </tr>
      </tbody>
    </table>
    <p v-if="!dates.length" class="no-dates">
      Не удалось построить список дат четверти — проверьте поля start_date/end_date в таблице terms.
    </p>
  </div>
</template>

<style scoped>
.matrix-wrap { overflow-x: auto; }
.matrix { border-collapse: collapse; font-size: 12px; }
.matrix th, .matrix td {
  border: 1px solid #e2e8f0; padding: 4px 6px; text-align: center; background: #fff;
}
.matrix thead th { background: #f8fafc; font-weight: 600; }
.col-subject { text-align: left; min-width: 160px; }
.col-avg    { background: #f1f5f9; font-weight: 600; min-width: 56px; }
.col-date   { white-space: nowrap; min-width: 42px; }
.col-cell   { min-width: 44px; }
.empty { color: #94a3b8; padding: 20px; }
.total-row td { background: #f8fafc; font-weight: 600; }
.no-dates { color: #b45309; font-size: 13px; margin-top: 8px; }
</style>
