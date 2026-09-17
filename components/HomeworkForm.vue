<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Subject } from '~/types'

const props = defineProps<{
  classId: number
  subjects: { id: number; name: string }[]
}>()

const emit = defineEmits<{ (e: 'created'): void }>()

const api = useApi()
const subjectId = ref<number | null>(null)
const dueDate = ref<string>(new Date().toISOString().slice(0, 10))
const description = ref('')
const saving = ref(false)

watch(() => props.subjects, (s) => {
  if (s.length && !s.find(x => x.id === subjectId.value)) subjectId.value = s[0].id
}, { immediate: true })

async function submit() {
  if (!subjectId.value) return
  if (!description.value.trim()) {
    alert('Введите текст задания')
    return
  }
  saving.value = true
  try {
    await api.createHomework({
      class_id: props.classId,
      subject_id: subjectId.value,
      due_date: dueDate.value,
      description: description.value,
    })
    description.value = ''
    emit('created')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="hw-card">
    <h3>Новое домашнее задание (для всего класса)</h3>
    <div class="grid">
      <label>
        Предмет
        <select v-model.number="subjectId">
          <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <label>
        Срок сдачи
        <input v-model="dueDate" type="date">
      </label>
    </div>
    <label class="full">
      Задание
      <textarea v-model="description" rows="3" placeholder="Что задано"></textarea>
    </label>
    <button :disabled="saving" @click="submit">
      {{ saving ? 'Сохранение…' : 'Сохранить ДЗ' }}
    </button>
  </div>
</template>

<style scoped>
.hw-card {
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 14px 16px; margin-bottom: 20px; background: #fff;
}
h3 { margin: 0 0 12px; font-size: 15px; color: #0f172a; }
.grid { display: grid; grid-template-columns: 1fr 180px; gap: 12px; margin-bottom: 12px; }
label { display: grid; gap: 4px; font-size: 13px; color: #475569; }
select, input, textarea {
  padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit;
}
.full { margin-bottom: 12px; }
button {
  padding: 8px 14px; border: none; border-radius: 6px;
  background: #2563eb; color: #fff; cursor: pointer; font-weight: 600;
}
button:disabled { background: #94a3b8; cursor: default; }
button:hover:not(:disabled) { background: #1d4ed8; }
</style>
