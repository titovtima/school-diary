<script setup lang="ts">
const appConfig = useAppConfig()

const bells = computed(() => {
  const list = appConfig.bells ?? []
  return list.filter((b: any) => b && typeof b.n === 'number' && b.from && b.to)
})
const lunchAfter = computed(() => appConfig.lunchAfter ?? 2)
</script>

<template>
  <aside class="bells">
    <h3>Звонки</h3>
    <ul>
      <template v-for="b in bells" :key="b.n">
        <li>
          <span class="n">{{ b.n }}</span>
          <span class="t">{{ b.from }} – {{ b.to }}</span>
        </li>
        <li v-if="b.n === lunchAfter" class="lunch">ОБЕД</li>
      </template>
    </ul>
  </aside>
</template>

<style scoped>
.bells {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 12px; background: #fff; min-width: 180px;
}
.bells h3 { margin: 0 0 8px; font-size: 14px; color: #0f172a; }
.bells ul { list-style: none; margin: 0; padding: 0; font-size: 12px; }
.bells li { display: flex; gap: 8px; padding: 3px 0; }
.bells .n {
  display: inline-flex; justify-content: center; align-items: center;
  width: 18px; height: 18px; border-radius: 4px;
  background: #f1f5f9; color: #334155; font-weight: 600;
}
.bells .t { color: #475569; }
.bells .lunch {
  color: #b45309; font-weight: 700; letter-spacing: 1px;
  justify-content: center; border-top: 1px dashed #e2e8f0;
  border-bottom: 1px dashed #e2e8f0; margin: 4px 0;
}
</style>
