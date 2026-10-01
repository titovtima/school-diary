<script setup lang="ts">
import type { GradeType } from '~/types'
import { formatWeight } from '~/composables/useGradeColor'

defineProps<{ types: GradeType[] }>()
</script>

<template>
  <div class="grade-legend">
    <span class="legend-title">Обозначения:</span>
    <span v-for="t in types" :key="t.id" class="item">
      <span class="chip" :style="{ backgroundColor: t.color }"></span>
      {{ t.name }} <span class="muted">(вес {{ formatWeight(t.weight) }})</span>
    </span>
    <span class="item">
      <span class="chip chip-absent">н</span>
      Отсутствие
    </span>
  </div>
</template>

<style scoped>
.grade-legend { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin: 10px 0 0; font-size: 12px; color: #475569; }
.legend-title { font-weight: 600; color: #0f172a; }
.item { display: inline-flex; align-items: center; gap: 6px; }
.chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
.chip-absent {
  width: 14px; height: 14px; background: #dc2626; color: #fff;
  font-size: 10px; font-weight: 700; text-align: center; line-height: 14px;
  border-radius: 3px;
}
.muted { color: #94a3b8; }
</style>
