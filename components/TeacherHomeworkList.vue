<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Homework } from '~/types'
import { formatDate } from '~/composables/useDate'

const props = defineProps<{
  classId: number
  subjects: { id: number; name: string }[]
  term: { id: number; name: string; start_date: string; end_date: string } | null
  showAll?: boolean
}>()

const api = useApi()

const list = ref<Homework[]>([])
const loading = ref(false)
const filterSubjectId = ref<number | 'all'>('all')

const showAdd = ref(false)
const addForm = ref({ subject_id: 0, due_date: '', description: '' })

const editingId = ref<number | null>(null)
const editForm = ref({ subject_id: 0, due_date: '', description: '' })

watch(() => props.subjects, (s) => {
  if (s.length && !addForm.value.subject_id) addForm.value.subject_id = s[0].id
}, { immediate: true })

watch(() => props.term, (t) => {
  if (t && !addForm.value.due_date) addForm.value.due_date = t.start_date
}, { immediate: true })

async function load() {
  if (!props.classId) return
  loading.value = true
  try {
    const params: any = { showAll: !!props.showAll }
    if (filterSubjectId.value !== 'all') params.subject_id = filterSubjectId.value
    if (props.term) { params.from = props.term.start_date; params.to = props.term.end_date }
    list.value = await api.fetchClassHomework(props.classId, params)
  } finally {
    loading.value = false
  }
}

watch(
  [() => props.classId, () => props.term, filterSubjectId, () => props.showAll],
  load,
  { immediate: true }
)

function openAdd() {
  addForm.value = {
    subject_id: props.subjects[0]?.id ?? 0,
    due_date: props.term?.start_date ?? new Date().toISOString().slice(0, 10),
    description: '',
  }
  showAdd.value = true
}

async function submitAdd() {
  if (!addForm.value.subject_id || !addForm.value.description.trim()) {
    alert('Заполните предмет и текст задания')
    return
  }
  await api.createHomework({
    class_id: props.classId,
    subject_id: addForm.value.subject_id,
    due_date: addForm.value.due_date,
    description: addForm.value.description,
  })
  showAdd.value = false
  await load()
}

function startEdit(h: Homework) {
  editingId.value = h.id
  editForm.value = {
    subject_id: h.subject_id,
    due_date: h.due_date,
    description: h.description,
  }
}
function cancelEdit() { editingId.value = null }

async function submitEdit() {
  if (!editingId.value) return
  if (!editForm.value.description.trim()) {
    alert('Текст задания не может быть пустым'); return
  }
  await api.updateHomework(editingId.value, {
    subject_id: editForm.value.subject_id,
    due_date: editForm.value.due_date,
    description: editForm.value.description,
  })
  editingId.value = null
  await load()
}

async function remove(h: Homework) {
  if (!confirm(`Удалить ДЗ по «${h.subject_name}» от ${formatDate(h.due_date)}?`)) return
  await api.deleteHomework(h.id)
  await load()
}

const total = computed(() => list.value.length)
</script>

<template>
  <section class="hw-section">
    <header class="hw-header">
      <h2>Домашние задания <span class="count">({{ total }})</span></h2>
      <div class="hw-controls">
        <label>
          Предмет:
          <select v-model="filterSubjectId">
            <option value="all">все</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
        <button class="btn-add" @click="openAdd">+ Добавить ДЗ</button>
      </div>
    </header>

    <div v-if="showAdd" class="hw-form-row">
      <div class="grid">
        <label>
          Предмет
          <select v-model.number="addForm.subject_id">
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
        <label>
          Срок сдачи
          <input v-model="addForm.due_date" type="date">
        </label>
      </div>
      <label class="full">
        Задание
        <textarea v-model="addForm.description" rows="3"></textarea>
      </label>
      <div class="actions">
        <button class="btn-primary" @click="submitAdd">Сохранить</button>
        <button class="btn-ghost" @click="showAdd = false">Отмена</button>
      </div>
    </div>

    <p v-if="loading" class="muted">Загрузка…</p>
    <table v-else-if="list.length" class="hw-table">
      <thead>
        <tr>
          <th>Предмет</th>
          <th>Срок сдачи</th>
          <th>Задание</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="h in list" :key="h.id">
          <tr v-if="editingId !== h.id">
            <td>{{ h.subject_name }}</td>
            <td class="nowrap">{{ formatDate(h.due_date) }}</td>
            <td class="desc">{{ h.description }}</td>
            <td class="actions-cell">
              <button class="btn-edit" @click="startEdit(h)">Изменить</button>
              <button class="btn-del" @click="remove(h)">Удалить</button>
            </td>
          </tr>
          <tr v-else class="edit-row">
            <td>
              <select v-model.number="editForm.subject_id">
                <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </td>
            <td><input v-model="editForm.due_date" type="date"></td>
            <td><textarea v-model="editForm.description" rows="3"></textarea></td>
            <td class="actions-cell">
              <button class="btn-primary" @click="submitEdit">Сохранить</button>
              <button class="btn-ghost" @click="cancelEdit">Отмена</button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <p v-else class="muted">Домашних заданий за выбранный период нет.</p>
  </section>
</template>

<style scoped>
.hw-section { margin: 24px 0; }
.hw-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
h2 { margin: 0; font-size: 18px; color: #0f172a; }
.count { color: #64748b; font-weight: 400; font-size: 14px; }
.hw-controls { display: flex; gap: 12px; align-items: center; }
label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; }
select, input, textarea { padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }

.hw-form-row { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; background: #fff; }
.hw-form-row .grid { display: grid; grid-template-columns: 1fr 180px; gap: 12px; margin-bottom: 10px; }
.hw-form-row .full { display: grid; gap: 4px; font-size: 13px; color: #475569; margin-bottom: 10px; }

.hw-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.hw-table th, .hw-table td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
.hw-table th { background: #f8fafc; font-weight: 600; }
.hw-table .nowrap { white-space: nowrap; }
.hw-table .desc { white-space: pre-wrap; }
.col-actions, .actions-cell { width: 180px; }
.edit-row select, .edit-row input, .edit-row textarea { width: 100%; }
.edit-row td { background: #f8fafc; }

button { cursor: pointer; font: inherit; }
.btn-add, .btn-primary {
  padding: 7px 12px; border: none; border-radius: 6px;
  background: #2563eb; color: #fff; font-weight: 600;
}
.btn-add:hover, .btn-primary:hover { background: #1d4ed8; }
.btn-ghost { padding: 7px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; }
.btn-edit { padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; margin-right: 6px; }
.btn-del { padding: 4px 10px; border: 1px solid #fecaca; background: #fff; color: #dc2626; border-radius: 6px; }
.btn-del:hover { background: #fee2e2; }
.muted { color: #94a3b8; font-size: 13px; }
</style>
