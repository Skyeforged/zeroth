<script setup lang="ts">
import { computed } from 'vue'
import PreEngraveStrip from '@/components/PreEngraveStrip.vue'
import StatChip from '@/components/StatChip.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiTag from '@/components/ui/UiTag.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import { nameOf } from '@/lib/i18n'
import type { AlluviumResult, TargetMatch } from '@/lib/optimizer'

const props = defineProps<{ result: AlluviumResult; rank: number; best: boolean; showPartial: boolean }>()

const slotLabel = { slot1: 'Main', slot2: 'Sub', slot3: 'Skill' } as const

interface MatchSection {
  key: string
  title: string
  /** Star icon before the heading. */
  star?: boolean
  /** Prefix each chip with its slot name (used for incomplete matches, where it matters which slot is missing). */
  slotPrefix?: boolean
  matches: TargetMatch[]
}

/** Match groups in display order; empty ones are skipped. 2/3 and 1/3 only show with `showPartial`. */
const sections = computed<MatchSection[]>(() => {
  const { perfect, good, partial } = props.result
  const list: MatchSection[] = [
    { key: 'priority', title: 'Priority Weapon Match', star: true, matches: perfect.filter((m) => m.target.priority) },
    { key: 'perfect', title: 'Other Perfect Matches', matches: perfect.filter((m) => !m.target.priority) },
  ]
  if (props.showPartial) {
    list.push(
      { key: 'good', title: 'Good matches (2/3)', slotPrefix: true, matches: good },
      { key: 'partial', title: 'Partial matches (1/3)', slotPrefix: true, matches: partial },
    )
  }
  return list.filter((s) => s.matches.length)
})

function chips(m: TargetMatch, slotPrefix?: boolean) {
  return m.required.map((slot) => {
    const name = nameOf('stats', m.target.essence[slot] ?? '')
    return {
      slot,
      label: slotPrefix ? `${slotLabel[slot]}: ${name}` : name,
      state: m.slots[slot] ? ('ok' as const) : ('missing' as const),
    }
  })
}

const points = computed(() =>
  Number.isInteger(props.result.points) ? props.result.points : props.result.points.toFixed(1),
)
</script>

<template>
  <UiCard :class="{ best }">
    <template #title>
      <div class="title">
        <span v-if="best" class="banner"><UiIcon name="trophy" /> Best Energy Alluvium to Farm</span>
        <span v-else class="rank">#{{ String(rank).padStart(2, '0') }}</span>
        <span class="name">{{ nameOf('alluviums', result.alluviumId) }}</span>
        <UiTag :value="`${points} pts`" severity="warn" class="pts" />
      </div>
    </template>
    <template #subtitle>
      <span class="perfect">{{ result.perfect.length }} perfect</span>
      <span v-if="result.good.length" class="good"> · {{ result.good.length }} good</span>
      <span v-if="result.partial.length" class="muted"> · {{ result.partial.length }} partial</span>
    </template>
    <template #default>
      <p v-if="!result.engraving" class="muted">No selected target can be farmed here.</p>
      <template v-else>
        <section v-for="s in sections" :key="s.key">
          <h4><UiIcon v-if="s.star" name="star-fill" /> {{ s.title }}</h4>
          <div v-for="m in s.matches" :key="m.target.id" class="match">
            <span class="who">
              <WeaponIcon v-if="!m.target.custom" :weapon-id="m.target.id" :size="28" />
              <strong>{{ m.target.label }}</strong>
            </span>
            <StatChip v-for="c in chips(m, s.slotPrefix)" :key="c.slot" :label="c.label" :state="c.state" />
          </div>
        </section>

        <PreEngraveStrip :engraving="result.engraving" :alt-locks="result.altLocks" />
      </template>
    </template>
  </UiCard>
</template>

<style scoped>
.best {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Yellow hazard plate for the winner. */
.banner {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.6rem;
  background: var(--primary);
  color: var(--primary-contrast);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  padding-right: 0.9rem;
}

.rank {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.name {
  flex: 1;
}

.perfect {
  color: var(--green-500);
}

.good {
  color: var(--blue-400);
}

h4 {
  margin: 0.85rem 0 0.4rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

h4::before {
  content: '// ';
  font-family: var(--font-mono);
  color: var(--primary-text);
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
