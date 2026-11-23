<template>
  <div class="ui-card">
    <div v-if="$slots.title" class="title"><slot name="title" /></div>
    <div v-if="$slots.subtitle" class="subtitle"><slot name="subtitle" /></div>
    <div class="content"><slot /></div>
  </div>
</template>

<style scoped>
/* Industrial panel: square, with a yellow bracket on the top-left corner and a muted one bottom-right. */
.ui-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.ui-card::before,
.ui-card::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
}

.ui-card::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid var(--primary);
  border-left: 2px solid var(--primary);
}

.ui-card::after {
  right: -1px;
  bottom: -1px;
  border-right: 2px solid var(--border-strong);
  border-bottom: 2px solid var(--border-strong);
}

.title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.15;
}

.subtitle {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--text-muted);
}

.content {
  margin-top: 0.25rem;
}
</style>
