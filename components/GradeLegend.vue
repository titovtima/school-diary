<script setup lang="ts">
import type { GradeType } from '~/types'
import { formatWeight } from '~/composables/useGradeColor'

defineProps<{ types: GradeType[] }>()
</script>

<template>
  <div class="grade-legend">
    <span class="legend-title">Тип работы:</span>
    <span v-for="t in types" :key="t.id" class="item">
      <span class="chip" :style="{ backgroundColor: t.color }"></span>
      {{ t.name }} <span class="muted">(вес {{ formatWeight(t.weight) }})</span>
    </span>
  </div>
</template>

<style scoped>
.grade-legend { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin: 10px 0 0; font-size: 12px; color: #475569; }
.legend-title { font-weight: 600; color: #0f172a; }
.item { display: inline-flex; align-items: center; gap: 6px; }
.chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
.muted { color: #94a3b8; }
</style>
