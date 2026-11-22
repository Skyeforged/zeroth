<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import PreEngraveStrip from '@/components/PreEngraveStrip.vue'
import StatChip from '@/components/StatChip.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import { nameOf } from '@/lib/i18n'
import type { AlluviumResult, TargetMatch } from '@/lib/optimizer'

const props = defineProps<{ result: AlluviumResult; rank: number; best: boolean; showPartial: boolean }>()

const priorityPerfect = computed(() => props.result.perfect.filter((m) => m.target.priority))
const otherPerfect = computed(() => props.result.perfect.filter((m) => !m.target.priority))

const slotLabel = { slot1: 'Main', slot2: 'Sub', slot3: 'Skill' } as const

function chips(m: TargetMatch) {
  return m.required.map((slot) => ({
    slot,
    label: nameOf('stats', m.target.essence[slot] ?? ''),
    state: m.slots[slot] ? ('ok' as const) : ('missing' as const),
  }))
}

const points = computed(() => Number.isInteger(props.result.points) ? props.result.points : props.result.points.toFixed(1))
</script>

<template>
  <Card :class="{ best }">
    <template #title>
      <div class="title">
        <span v-if="best" class="banner"><i class="pi pi-trophy" /> Best Energy Alluvium to Farm</span>
        <span v-else class="muted">#{{ rank }}</span>
        <span class="name">{{ nameOf('alluviums', result.alluviumId) }}</span>
        <Tag :value="`${points} pts`" severity="warn" class="pts" />
      </div>
    </template>
    <template #subtitle>
      <span class="perfect">{{ result.perfect.length }} perfect</span>
      <span v-if="result.good.length" class="good"> · {{ result.good.length }} good</span>
      <span v-if="result.partial.length" class="muted"> · {{ result.partial.length }} partial</span>
    </template>
    <template #content>
      <template v-if="!result.engraving">
        <p class="muted">No selected target can be farmed here.</p>
      </template>
      <template v-else>
        <section v-if="priorityPerfect.length">
          <h4><i class="pi pi-star-fill" /> Priority Weapon Match</h4>
          <div v-for="m in priorityPerfect" :key="m.target.id" class="match">
            <span class="who">
              <WeaponIcon v-if="!m.target.custom" :weapon-id="m.target.id" :size="28" />
              <strong>{{ m.target.label }}</strong>
            </span>
            <StatChip v-for="c in chips(m)" :key="c.slot" :label="c.label" :state="c.state" />
          </div>
        </section>

        <section v-if="otherPerfect.length">
          <h4>Other Perfect Matches</h4>
          <div v-for="m in otherPerfect" :key="m.target.id" class="match">
            <span class="who">
              <WeaponIcon v-if="!m.target.custom" :weapon-id="m.target.id" :size="28" />
              <strong>{{ m.target.label }}</strong>
            </span>
            <StatChip v-for="c in chips(m)" :key="c.slot" :label="c.label" :state="c.state" />
          </div>
        </section>

        <template v-if="showPartial">
          <section v-if="result.good.length">
            <h4>Good matches (2/3)</h4>
            <div v-for="m in result.good" :key="m.target.id" class="match">
              <span class="who">
              <WeaponIcon v-if="!m.target.custom" :weapon-id="m.target.id" :size="28" />
              <strong>{{ m.target.label }}</strong>
            </span>
              <StatChip v-for="c in chips(m)" :key="c.slot" :label="`${slotLabel[c.slot]}: ${c.label}`" :state="c.state" />
            </div>
          </section>
          <section v-if="result.partial.length">
            <h4>Partial matches (1/3)</h4>
            <div v-for="m in result.partial" :key="m.target.id" class="match">
              <span class="who">
              <WeaponIcon v-if="!m.target.custom" :weapon-id="m.target.id" :size="28" />
              <strong>{{ m.target.label }}</strong>
            </span>
              <StatChip v-for="c in chips(m)" :key="c.slot" :label="`${slotLabel[c.slot]}: ${c.label}`" :state="c.state" />
            </div>
          </section>
        </template>

        <PreEngraveStrip :engraving="result.engraving" :alt-locks="result.altLocks" />
      </template>
    </template>
  </Card>
</template>

<style scoped>
.best {
  border: 1px solid var(--p-yellow-500);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.banner {
  color: var(--p-yellow-500);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.name {
  flex: 1;
}

.perfect {
  color: var(--p-green-500);
}

.good {
  color: var(--p-blue-400);
}

h4 {
  margin: 0.75rem 0 0.4rem;
  font-size: 0.85rem;
}

.match {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.who {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: min(10rem, 100%);
}
</style>
