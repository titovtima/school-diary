<script setup lang="ts">
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDate } from '~/composables/useDate'

interface Lesson {
  day_of_week: number
  lesson_num: number
  date: string
  subject_id: number
  subject_name: string
  teacher?: string | null
  className?: string
  grades: { value: number; weight: number; grade_type_name: string }[]
  homework: { due_date: string; description: string }[]
}

const props = defineProps<{ lesson: Lesson }>()

const { lessonTime } = useSchedule()
</script>

<template>
  <div class="lesson">
    <header class="lesson-head">
      <span class="num">{{ props.lesson.lesson_num }}</span>
      <span class="time">{{ lessonTime(props.lesson.lesson_num) }}</span>
      <span class="subject">{{ props.lesson.subject_name }}</span>
      <span v-if="props.lesson.className" class="class">· {{ props.lesson.className }}</span>
    </header>

    <div v-if="props.lesson.teacher" class="teacher">
      {{ props.lesson.teacher }}
    </div>

    <div v-if="props.lesson.grades.length" class="row">
      <span class="label">Оценки:</span>
      <span
        v-for="(g, i) in props.lesson.grades"
        :key="i"
        class="grade"
        :class="gradeWeightClass(g.weight)"
        :title="`${g.grade_type_name} (вес ${g.weight})`"
      >{{ g.value }}</span>
    </div>

    <div v-if="props.lesson.homework.length" class="row hw">
      <span class="label">ДЗ:</span>
      <ul>
        <li v-for="(h, i) in props.lesson.homework" :key="i">
          <span class="due">к {{ formatDate(h.due_date) }}:</span>
          {{ h.description }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.lesson {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 8px; background: #fff;
}
.lesson-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.num {
  display: inline-flex; justify-content: center; align-items: center;
  width: 20px; height: 20px; border-radius: 4px;
  background: #2563eb; color: #fff; font-size: 11px; font-weight: 700;
}
.time { color: #64748b; font-size: 11px; }
.subject { font-weight: 600; color: #0f172a; }
.class { color: #64748b; font-size: 12px; }
.teacher { font-size: 12px; color: #64748b; margin-top: 2px; }
.row { display: flex; align-items: flex-start; gap: 6px; margin-top: 6px; font-size: 12px; }
.label { color: #64748b; flex-shrink: 0; }
.row ul { margin: 0; padding-left: 16px; }
.row li + li { margin-top: 2px; }
.due { color: #64748b; }
</style>
