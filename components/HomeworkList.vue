<script setup lang="ts">
import type { Homework } from '~/types'
import { formatDate } from '~/composables/useDate'
defineProps<{ homework: Homework[] }>()
</script>

<template>
  <ul class="hw">
    <li v-for="h in homework" :key="h.id">
      <div class="row">
        <b>{{ h.subject_name }}</b>
        <span class="date">к {{ formatDate(h.due_date) }}</span>
      </div>
      <div class="desc">{{ h.description }}</div>
    </li>
    <li v-if="!homework.length" class="empty">Домашних заданий нет</li>
  </ul>
</template>

<style scoped>
.hw { list-style: none; padding: 0; }
.hw li { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
.row { display: flex; justify-content: space-between; gap: 8px; }
.date { color: #64748b; font-size: 13px; }
.desc { color: #334155; margin-top: 4px; white-space: pre-wrap; }
.empty { color: #94a3b8; }
</style>
