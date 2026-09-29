<script setup lang="ts">
import { weightLabel, gradeStyle } from '~/composables/useGradeColor'
import { formatDate } from '~/composables/useDate'

export interface GradeDetail {
  id: number
  value: number
  weight: number
  grade_type_name: string
  grade_type_color?: string
  lesson_date?: string
  subject_name?: string
  comment?: string | null
}

const props = defineProps<{
  grade: GradeDetail
  title?: string
  deletable?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'delete', id: number): void }>()

const badge = computed(() => gradeStyle(props.grade.grade_type_color, props.grade.weight))
</script>

<template>
  <div class="gdp-overlay" @click.self="emit('close')">
    <div class="gdp-card">
      <header class="gdp-head">
        <span class="grade" :class="badge.class" :style="badge.style">
          {{ props.grade.value }}
        </span>
        <div class="gdp-title">
          <div class="gdp-type">{{ props.grade.grade_type_name }}</div>
          <div class="gdp-sub">{{ props.title || props.grade.subject_name }}</div>
        </div>
      </header>

      <ul class="gdp-list">
        <li>
          <span class="k">Тип работы</span>
          <span class="v">{{ props.grade.grade_type_name }}</span>
        </li>
        <li>
          <span class="k">Коэффициент (вес)</span>
          <span class="v">
            <b>{{ Number(props.grade.weight).toFixed(1) }}</b>
            <span class="muted"> — {{ weightLabel(props.grade.weight) }}</span>
          </span>
        </li>
        <li v-if="props.grade.subject_name">
          <span class="k">Предмет</span>
          <span class="v">{{ props.grade.subject_name }}</span>
        </li>
        <li v-if="props.grade.lesson_date">
          <span class="k">Дата урока</span>
          <span class="v">{{ formatDate(props.grade.lesson_date) }}</span>
        </li>
        <li v-if="props.grade.comment">
          <span class="k">Комментарий</span>
          <span class="v">{{ props.grade.comment }}</span>
        </li>
      </ul>

      <div class="gdp-actions">
        <button v-if="props.deletable" class="gdp-del" @click="emit('delete', props.grade.id)">Удалить</button>
        <button class="gdp-close" @click="emit('close')">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gdp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.gdp-card { background: #fff; border-radius: 10px; padding: 16px 20px; min-width: 320px; max-width: 460px; box-shadow: 0 20px 40px rgba(0,0,0,.25); }
.gdp-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.gdp-title { line-height: 1.2; }
.gdp-type { font-weight: 600; color: #0f172a; }
.gdp-sub { font-size: 12px; color: #64748b; }
.gdp-list { list-style: none; margin: 0 0 14px; padding: 0; }
.gdp-list li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.gdp-list .k { color: #64748b; }
.gdp-list .v { color: #0f172a; text-align: right; }
.gdp-list .muted { color: #94a3b8; }
.gdp-actions { display: flex; gap: 8px; }
.gdp-close, .gdp-del { flex: 1; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; font: inherit; }
.gdp-del { color: #dc2626; border-color: #fecaca; }
.gdp-del:hover { background: #fee2e2; }
.gdp-close:hover { background: #f1f5f9; }
</style>
