<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleItem } from '~/types'

const props = defineProps<{ schedule: ScheduleItem[] }>()
const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const maxLesson = computed(() => Math.max(6, ...props.schedule.map(s => s.lesson_num)))

function cell(day: number, lesson: number): ScheduleItem | undefined {
  return props.schedule.find(s => s.day_of_week === day && s.lesson_num === lesson)
}
</script>

<template>
  <table class="schedule">
    <thead>
      <tr><th>#</th><th v-for="(d, i) in days" :key="i">{{ d }}</th></tr>
    </thead>
    <tbody>
      <tr v-for="lesson in maxLesson" :key="lesson">
        <td class="num">{{ lesson }}</td>
        <td v-for="day in 6" :key="day">
          <template v-if="cell(day, lesson)">
            <div class="subject">{{ cell(day, lesson)!.subject_name }}</div>
            <div class="teacher">{{ cell(day, lesson)!.teacher }}</div>
          </template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.schedule { width: 100%; border-collapse: collapse; }
.schedule th, .schedule td { border: 1px solid #e2e8f0; padding: 6px; text-align: left; vertical-align: top; font-size: 14px; }
.schedule th { background: #f8fafc; }
.num { width: 32px; text-align: center; color: #64748b; }
.subject { font-weight: 600; }
.teacher { font-size: 12px; color: #64748b; }
</style>
