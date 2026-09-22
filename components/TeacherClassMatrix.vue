<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { MatrixRow, Term, GradeType, MatrixCellGrade } from '~/types'
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDateShort } from '~/composables/useDate'
import { weightedAverage, formatAvg } from '~/composables/useGradeCalc'

interface Column { date: string; lesson_num: number; multiLesson: boolean }

const props = defineProps<{
  rows: MatrixRow[]
  subjects: { id: number; name: string }[]
  columns: Column[]
  classId: number
  term: Term | null
  gradeTypes: GradeType[]
  selectedSubjectId: number | null
}>()
const emit = defineEmits<{
  (e: 'changed'): void
  (e: 'update:selectedSubjectId', v: number | null): void
}>()

const api = useApi()
const activeCell = ref<{ studentId: number; date: string; lesson_num: number } | null>(null)
const details = ref<{ grade: MatrixCellGrade; student: string; date: string } | null>(null)

const subjectId = computed({
  get: () => props.selectedSubjectId,
  set: v => emit('update:selectedSubjectId', v),
})

watch(() => props.subjects, (s) => {
  if (s.length && (!subjectId.value || !s.find(x => x.id === subjectId.value))) {
    subjectId.value = s[0].id
  }
}, { immediate: true })

function cellGrades(studentId: number, col: Column): MatrixCellGrade[] {
  if (!subjectId.value) return []
  const row = props.rows.find(r => r.student_id === studentId)
  if (!row) return []
  const key = `${col.date}#${col.lesson_num}`
  return row.grades_by_subject[String(subjectId.value)]?.[key] ?? []
}
function studentAvg(studentId: number): number | null {
  if (!subjectId.value) return null
  const row = props.rows.find(r => r.student_id === studentId)
  const m = row?.grades_by_subject[String(subjectId.value)]
  if (!m) return null
  const all: MatrixCellGrade[] = []
  for (const arr of Object.values(m)) all.push(...arr)
  return weightedAverage(all)
}
function columnAvg(col: Column): number | null {
  if (!subjectId.value) return null
  const all: MatrixCellGrade[] = []
  for (const r of props.rows) {
    const arr = cellGrades(r.student_id, col)
    all.push(...arr)
  }
  return weightedAverage(all)
}
const classAvg = computed<number | null>(() => {
  if (!subjectId.value) return null
  const all: MatrixCellGrade[] = []
  for (const r of props.rows) {
    const m = r.grades_by_subject[String(subjectId.value)]
    if (!m) continue
    for (const arr of Object.values(m)) all.push(...arr)
  }
  return weightedAverage(all)
})

function openCell(studentId: number, col: Column) {
  activeCell.value = { studentId, date: col.date, lesson_num: col.lesson_num }
}
function closePopover() { activeCell.value = null }

async function quickGrade(value: number, gradeTypeId: number) {
  if (!activeCell.value || !subjectId.value) return
  await api.createGrade({
    student_id: activeCell.value.studentId,
    subject_id: subjectId.value,
    grade_type_id: gradeTypeId,
    value,
    lesson_date: activeCell.value.date,
    lesson_num: activeCell.value.lesson_num,
  })
  emit('changed')
}

function openDetails(g: MatrixCellGrade, studentName: string, date: string, e: MouseEvent) {
  e.stopPropagation()
  details.value = { grade: g, student: studentName, date }
}
function closeDetails() { details.value = null }
async function deleteFromDetails(id: number) {
  if (!confirm('Удалить оценку?')) return
  await api.deleteGrade(id)
  details.value = null
  emit('changed')
}

// --- Sticky ---
const firstColRef = ref<HTMLElement | null>(null)
const col1Width = ref(0)
let mounted = false
function measure() {
  if (!mounted || typeof window === 'undefined') return
  const el = firstColRef.value
  if (!el) return
  const w = el.offsetWidth
  if (w && w !== col1Width.value) col1Width.value = w
}
onMounted(async () => {
  mounted = true
  await nextTick(); measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
  mounted = false
  if (typeof window !== 'undefined') window.removeEventListener('resize', measure)
})
watch([() => props.rows, () => props.subjects, subjectId], () => { if (mounted) nextTick(measure) })

// Заголовок колонки: "17.10 (2)" если в этот день больше одного урока
function colLabel(col: Column) {
  return col.multiLesson ? `${formatDateShort(col.date)} (${col.lesson_num})` : formatDateShort(col.date)
}
</script>

<template>
  <div>
    <div class="controls">
      <label>Предмет:
        <select v-model.number="subjectId">
          <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <span v-if="classAvg !== null" class="class-avg">
        Средний балл класса: <b>{{ formatAvg(classAvg) }}</b>
      </span>
      <span class="tip">Клик по ячейке — поставить оценку. Клик по оценке — детали.</span>
    </div>

    <p v-if="!columns.length" class="muted">
      В выбранной четверти по этому предмету нет уроков.
    </p>

    <div v-else class="matrix-wrap" :style="{ '--col1-width': col1Width + 'px' }">
      <table class="matrix">
        <thead>
          <tr>
            <th :ref="el => (firstColRef = el as HTMLElement | null)" class="col-student sticky-1">Ученик</th>
            <th class="col-avg sticky-2">Средн.</th>
            <th v-for="(c, i) in columns" :key="`${c.date}-${c.lesson_num}-${i}`" class="col-date">
              {{ colLabel(c) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.student_id">
            <td class="col-student sticky-1">{{ r.student_name }}</td>
            <td class="col-avg sticky-2">{{ formatAvg(studentAvg(r.student_id)) }}</td>
            <td
              v-for="(c, i) in columns"
              :key="`${c.date}-${c.lesson_num}-${i}`"
              class="cell"
              :class="{ active: activeCell && activeCell.studentId === r.student_id && activeCell.date === c.date && activeCell.lesson_num === c.lesson_num }"
              @click="openCell(r.student_id, c)"
            >
              <span
                v-for="g in cellGrades(r.student_id, c)"
                :key="g.id"
                class="grade"
                :class="gradeWeightClass(g.weight)"
                :title="`${g.grade_type_name} · вес ${g.weight}`"
                @click="openDetails(g, r.student_name, c.date, $event)"
              >{{ g.value }}</span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="columns.length + 2" class="empty">Нет данных</td>
          </tr>
          <tr v-else class="total-row">
            <td class="col-student sticky-1">Средн. по дню</td>
            <td class="col-avg sticky-2">{{ formatAvg(classAvg) }}</td>
            <td v-for="(c, i) in columns" :key="`${c.date}-${c.lesson_num}-${i}`" class="avg">
              {{ formatAvg(columnAvg(c)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <GradeLegend v-if="gradeTypes.length" :types="gradeTypes" />

    <div v-if="activeCell" class="overlay" @click.self="closePopover">
      <div class="popover">
        <div class="popover-head">
          {{ activeCell.date }} · урок {{ activeCell.lesson_num }} —
          {{ rows.find(r => r.student_id === activeCell!.studentId)?.student_name }}
        </div>
        <p class="hint">Можно поставить несколько оценок за один урок — попап не закроется.</p>
        <div v-for="gt in gradeTypes" :key="gt.id" class="row">
          <span class="type-name">{{ gt.name }} <small>(вес {{ gt.weight }})</small></span>
          <div class="values">
            <button v-for="v in [5, 4, 3, 2]" :key="v" @click="quickGrade(v, gt.id)">{{ v }}</button>
          </div>
        </div>
        <div v-if="cellGrades(activeCell!.studentId, { date: activeCell!.date, lesson_num: activeCell!.lesson_num, multiLesson: false }).length" class="current">
          <div class="current-head">Оценки за этот урок:</div>
          <div class="current-list">
            <span
              v-for="g in cellGrades(activeCell!.studentId, { date: activeCell!.date, lesson_num: activeCell!.lesson_num, multiLesson: false })"
              :key="g.id"
              class="grade"
              :class="gradeWeightClass(g.weight)"
              :title="`${g.grade_type_name} (вес ${g.weight})`"
              @click="openDetails(g, rows.find(r => r.student_id === activeCell!.studentId)?.student_name ?? '', activeCell!.date, $event)"
            >{{ g.value }}</span>
          </div>
        </div>
        <button class="close" @click="closePopover">Закрыть</button>
      </div>
    </div>

    <GradeDetailsPopover
      v-if="details"
      :grade="{
        id: details.grade.id,
        value: details.grade.value,
        weight: details.grade.weight,
        grade_type_name: details.grade.grade_type_name,
        subject_name: subjects.find(s => s.id === subjectId)?.name,
        lesson_date: details.date,
      }"
      :title="details.student"
      deletable
      @close="closeDetails"
      @delete="deleteFromDetails"
    />
  </div>
</template>

<style scoped>
.controls { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
.class-avg { font-size: 14px; color: #475569; }
.class-avg b { color: #0f172a; }
.tip { font-size: 12px; color: #94a3b8; }
.muted { color: #94a3b8; font-size: 13px; }

.matrix-wrap { overflow-x: auto; max-height: 70vh; overflow-y: auto; position: relative; }
.matrix { border-collapse: separate; border-spacing: 0; font-size: 12px; }
.matrix th, .matrix td {
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 8px;
  text-align: center;
  background: #fff;
}
.matrix thead th { background: #f8fafc; position: sticky; top: 0; z-index: 3; }
.col-student { text-align: left; white-space: nowrap; width: max-content; }
.col-avg { white-space: nowrap; width: max-content; background: #f1f5f9; font-weight: 600; }
.col-date { white-space: nowrap; min-width: 72px; }
.cell { min-width: 44px; cursor: pointer; }
.cell:hover { background: #f1f5f9; }
.cell.active { background: #dbeafe; }

.sticky-1 { position: sticky; left: 0; z-index: 2; background: #fff; box-shadow: 2px 0 0 #e2e8f0; }
.matrix thead .sticky-1 { background: #f8fafc; z-index: 5; }
.total-row .sticky-1 { background: #f8fafc; }
.sticky-2 { position: sticky; left: var(--col1-width, 0); z-index: 2; background: #f1f5f9; box-shadow: 2px 0 0 #e2e8f0; }
.matrix thead .sticky-2 { background: #f1f5f9; z-index: 5; }
.total-row .sticky-2 { background: #f8fafc; }

.empty { color: #94a3b8; padding: 20px; }
.total-row td { background: #f8fafc; font-weight: 600; }

.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.popover { background: #fff; padding: 16px 20px; border-radius: 10px; min-width: 380px; max-width: 520px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,.2); }
.popover-head { font-size: 14px; color: #475569; margin-bottom: 10px; }
.hint { font-size: 12px; color: #64748b; margin: 4px 0 10px; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.type-name { font-size: 13px; }
.type-name small { color: #94a3b8; }
.values button { width: 30px; height: 30px; margin-left: 4px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; font-weight: 600; }
.values button:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.current { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; }
.current-head { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.current-list { display: flex; gap: 6px; flex-wrap: wrap; }
.close { margin-top: 12px; width: 100%; padding: 8px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; }
</style>
