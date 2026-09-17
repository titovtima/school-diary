<script setup lang="ts">
import type { GradeType } from '~/types'
import { formatWeight } from '~/composables/useGradeColor'

defineProps<{ types: GradeType[] }>()
</script>

<template>
  <div class="grade-legend">
    <span class="legend-title">Вес работы:</span>
    <span v-for="t in types" :key="t.id" class="item">
      <span class="chip" :class="`w${t.weight <= 1 ? 1 : t.weight <= 1.25 ? 2 : t.weight <= 1.5 ? 3 : t.weight <= 1.75 ? 4 : 5}`"></span>
      {{ t.name }} <span class="muted">({{ formatWeight(t.weight) }})</span>
    </span>
  </div>
</template>

<style scoped>
.grade-legend {
  display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
  margin: 10px 0 0; font-size: 12px; color: #475569;
}
.legend-title { font-weight: 600; color: #0f172a; }
.item { display: inline-flex; align-items: center; gap: 6px; }
.chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
.chip.w1 { background: #94a3b8; }
.chip.w2 { background: #22c55e; }
.chip.w3 { background: #0ea5e9; }
.chip.w4 { background: #8b5cf6; }
.chip.w5 { background: #dc2626; }
.muted { color: #94a3b8; }
</style>
