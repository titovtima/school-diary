<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { MatrixRow, Term, GradeType, MatrixCellGrade } from '~/types'
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDateShort } from '~/composables/useDate'
import { weightedAverage, formatAvg } from '~/composables/useGradeCalc'

const props = defineProps<{
  rows: MatrixRow[]
  subjects: { id: number; name: string }[]
  dates: string[]
  classId: number
  term: Term | null
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const api = useApi()
const subjectId = ref<number | null>(null)
const gradeTypes = ref<GradeType[]>([])
const activeCell = ref<{ studentId: number; date: string } | null>(null)

watch(() => props.subjects, (s) => {
  if (s.length && !s.find(x => x.id === subjectId.value)) subjectId.value = s[0].id
}, { immediate: true })

onMounted(async () => {
  gradeTypes.value = await api.fetchGradeTypes()
})

// ВАЖНО: ключи в JSON — строки, поэтому обращаемся через String(...)
function cellGrades(studentId: number, date: string): MatrixCellGrade[] {
  if (!subjectId.value) return []
  const row = props.rows.find(r => r.student_id === studentId)
  if (!row) return []
  return row.grades_by_subject[String(subjectId.value)]?.[String(date)] ?? []
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

function classAvgByDate(date: string): number | null {
  if (!subjectId.value) return null
  const all: MatrixCellGrade[] = []
  for (const r of props.rows) {
    const arr = r.grades_by_subject[String(subjectId.value)]?.[String(date)] ?? []
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

function openCell(studentId: number, date: string) {
  activeCell.value = { studentId, date }
}
function closePopover() {
  activeCell.value = null
}

async function quickGrade(value: number, gradeTypeId: number) {
  if (!activeCell.value || !subjectId.value) return
  await api.createGrade({
    student_id: activeCell.value.studentId,
    subject_id: subjectId.value,
    grade_type_id: gradeTypeId,
    value,
    lesson_date: activeCell.value.date,
  })
  emit('changed')
}

async function deleteGrade(id: number) {
  if (!confirm('Удалить оценку?')) return
  await api.deleteGrade(id)
  emit('changed')
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
      <span class="tip">Клик по ячейке — поставить оценку. Клик по оценке — удалить.</span>
    </div>

    <div class="matrix-wrap">
      <table class="matrix">
        <thead>
          <tr>
            <th class="corner sticky-left">Ученик</th>
            <th class="avg-col sticky-left2">Средн.</th>
            <th v-for="d in dates" :key="d" class="date-col">{{ formatDateShort(d) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.student_id">
            <td class="student sticky-left">{{ r.student_name }}</td>
            <td class="avg sticky-left2">{{ formatAvg(studentAvg(r.student_id)) }}</td>
            <td
              v-for="d in dates"
              :key="d"
              class="cell"
              :class="{ active: activeCell && activeCell.studentId === r.student_id && activeCell.date === d }"
              @click="openCell(r.student_id, d)"
            >
              <span
                v-for="g in cellGrades(r.student_id, d)"
                :key="g.id"
                class="grade"
                :class="gradeWeightClass(g.weight)"
                :title="`${g.grade_type_name} (вес ${g.weight}). Клик — удалить.`"
                @click.stop="deleteGrade(g.id)"
              >{{ g.value }}</span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="dates.length + 2" class="empty">Нет данных</td>
          </tr>
          <tr v-else class="total-row">
            <td class="student sticky-left">Средн. по дню</td>
            <td class="avg sticky-left2">{{ formatAvg(classAvg) }}</td>
            <td v-for="d in dates" :key="d" class="avg">{{ formatAvg(classAvgByDate(d)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeCell" class="overlay" @click.self="closePopover">
      <div class="popover">
        <div class="popover-head">
          {{ activeCell.date }} — {{ rows.find(r => r.student_id === activeCell!.studentId)?.student_name }}
        </div>

        <p class="hint">Можно поставить несколько оценок за один урок — попап не закроется.</p>

        <div v-for="gt in gradeTypes" :key="gt.id" class="row">
          <span class="type-name">
            {{ gt.name }} <small>(вес {{ gt.weight }})</small>
          </span>
          <div class="values">
            <button v-for="v in [5, 4, 3, 2]" :key="v" @click="quickGrade(v, gt.id)">{{ v }}</button>
          </div>
        </div>

        <div v-if="cellGrades(activeCell!.studentId, activeCell!.date).length" class="current">
          <div class="current-head">Оценки за этот урок:</div>
          <div class="current-list">
            <span
              v-for="g in cellGrades(activeCell!.studentId, activeCell!.date)"
              :key="g.id"
              class="grade"
              :class="gradeWeightClass(g.weight)"
              :title="`${g.grade_type_name} (вес ${g.weight}). Клик — удалить.`"
              @click="deleteGrade(g.id)"
            >{{ g.value }}</span>
          </div>
        </div>

        <button class="close" @click="closePopover">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
.class-avg { font-size: 14px; color: #475569; }
.class-avg b { color: #0f172a; }
.tip { font-size: 12px; color: #94a3b8; }

.matrix-wrap { overflow-x: auto; max-height: 70vh; overflow-y: auto; }
.matrix { border-collapse: separate; border-spacing: 0; font-size: 12px; }
.matrix th, .matrix td {
  border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
  padding: 3px 5px; text-align: center; background: #fff;
}
.matrix thead th { background: #f8fafc; position: sticky; top: 0; z-index: 3; }
.date-col { white-space: nowrap; font-weight: 500; min-width: 60px; }
.corner, .student { text-align: left; min-width: 180px; }
.cell { min-width: 44px; cursor: pointer; }
.cell:hover { background: #f1f5f9; }
.cell.active { background: #dbeafe; }
.avg-col, .avg { background: #f1f5f9; font-weight: 600; min-width: 60px; }
.empty { color: #94a3b8; padding: 20px; }
.total-row td { background: #f8fafc; font-weight: 600; }

.sticky-left {
  position: sticky; left: 0; z-index: 2;
  background: #fff; box-shadow: 2px 0 0 #e2e8f0;
}
.matrix thead .sticky-left { background: #f8fafc; z-index: 5; }
.total-row .sticky-left { background: #f8fafc; }

.sticky-left2 {
  position: sticky; left: 180px; z-index: 2;
  background: #f1f5f9; box-shadow: 2px 0 0 #e2e8f0;
}
.matrix thead .sticky-left2 { background: #f1f5f9; z-index: 5; }
.total-row .sticky-left2 { background: #f8fafc; }

.overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.popover {
  background: #fff; padding: 16px 20px; border-radius: 10px;
  min-width: 380px; max-width: 520px; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,.2);
}
.popover-head { font-size: 14px; color: #475569; margin-bottom: 10px; }
.hint { font-size: 12px; color: #64748b; margin: 4px 0 10px; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.type-name { font-size: 13px; }
.type-name small { color: #94a3b8; }
.values button {
  width: 30px; height: 30px; margin-left: 4px;
  border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer; font-weight: 600;
}
.values button:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.current { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; }
.current-head { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.current-list { display: flex; gap: 6px; flex-wrap: wrap; }
.close {
  margin-top: 12px; width: 100%; padding: 8px;
  border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer;
}
</style>
