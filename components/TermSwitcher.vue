<script setup lang="ts">
import type { Term } from '~/types'
import { formatRange } from '~/composables/useDate'

const props = defineProps<{ terms: Term[]; modelValue: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function onChange(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLSelectElement).value))
}
</script>

<template>
  <label class="term-switcher">
    Четверть:
    <select :value="props.modelValue ?? ''" @change="onChange">
      <option disabled value="">— выберите —</option>
      <option v-for="t in props.terms" :key="t.id" :value="t.id">
        {{ t.name }} ({{ formatRange(t.start_date, t.end_date) }})
      </option>
    </select>
  </label>
</template>

<style scoped>
.term-switcher { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
</style>
