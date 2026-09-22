<script setup lang="ts">
import type { LessonWithExtras, LessonGrade } from '~/server/api/students/[id]/week-schedule.get'
import { gradeWeightClass } from '~/composables/useGradeColor'
import { formatDate } from '~/composables/useDate'

const props = defineProps<{ lesson: LessonWithExtras }>()

const { lessonTime } = useSchedule()

const selected = ref<LessonGrade | null>(null)

function openDetails(g: LessonGrade) {
  selected.value = g
}
function closeDetails() {
  selected.value = null
}
</script>

<template>
  <div class="lesson">
    <header class="lesson-head">
      <span class="num">{{ props.lesson.lesson_num }}</span>
      <span class="time">{{ lessonTime(props.lesson.lesson_num) }}</span>
      <span class="subject">{{ props.lesson.subject_name }}</span>
    </header>

    <div v-if="props.lesson.teacher" class="teacher">
      {{ props.lesson.teacher }}
    </div>

    <div v-if="props.lesson.grades.length" class="row">
      <span class="label">Оценки:</span>
      <span
        v-for="g in props.lesson.grades"
        :key="g.id"
        class="grade"
        :class="gradeWeightClass(g.weight)"
        :title="`${g.grade_type_name} · вес ${g.weight}`"
        @click="openDetails(g)"
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

    <GradeDetailsPopover
      v-if="selected"
      :grade="{
        id: selected.id,
        value: selected.value,
        weight: selected.weight,
        grade_type_name: selected.grade_type_name,
        subject_name: selected.subject_name,
        lesson_date: selected.lesson_date,
        comment: selected.comment,
      }"
      :title="selected.subject_name"
      @close="closeDetails"
    />
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
.teacher { font-size: 12px; color: #64748b; margin-top: 2px; }
.row { display: flex; align-items: flex-start; gap: 6px; margin-top: 6px; font-size: 12px; }
.label { color: #64748b; flex-shrink: 0; }
.row ul { margin: 0; padding-left: 16px; }
.row li + li { margin-top: 2px; }
.due { color: #64748b; }
</style>
