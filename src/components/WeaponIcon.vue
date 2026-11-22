<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { weapons } from '@/data'
import { rarityColor } from '@/lib/rarity'
import { iconIdSet, weaponIconUrl } from '@/lib/weaponIcon'

const withIcon = iconIdSet(weapons)

const props = withDefaults(defineProps<{ weaponId: string; size?: number }>(), { size: 40 })

const failed = ref(false)
watch(() => props.weaponId, () => (failed.value = false))

const src = computed(() =>
  withIcon.has(props.weaponId) && !failed.value ? weaponIconUrl(props.weaponId, import.meta.env.BASE_URL) : undefined,
)

/** Rarity colour frame; unknown rarity keeps the neutral border. */
const color = computed(() => rarityColor(weapons.find((w) => w.id === props.weaponId)?.rarity))
</script>

<template>
  <!-- Decorative: the weapon name is always shown next to it. Nothing renders for custom essences or missing icons. -->
  <span v-if="src" class="frame" :class="{ rarity: color }" :style="color ? { '--rarity': color } : undefined">
    <img class="weapon-icon" :src="src" alt="" loading="lazy" :width="size" :height="size" @error="failed = true" />
  </span>
</template>

<style scoped>
.frame {
  flex: none;
  display: inline-flex;
  border: 2px solid var(--p-content-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.frame.rarity {
  border-color: var(--rarity);
  background: linear-gradient(to bottom, color-mix(in srgb, var(--rarity) 30%, transparent), transparent);
}

.weapon-icon {
  display: block;
  object-fit: contain;
}
</style>
