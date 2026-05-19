<template>
  <div class="tech-badges">
    <span class="neubrutal-tag tag-vue">Vue</span>
    <span class="neubrutal-tag tag-nuxt">Nuxt 3</span>
    <span class="neubrutal-tag tag-api">Server API</span>
    <span class="neubrutal-tag tag-ai">OCR AI</span>
  </div>
</template>

<style scoped>
.tech-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
  position: relative;
}

.tag-vue { background: var(--mint-green); transform: rotate(-3deg); }
.tag-nuxt { background: var(--pastel-blue); transform: rotate(2deg); }
.tag-api { background: var(--soft-yellow); transform: rotate(-1deg); }
.tag-ai { background: var(--peach); transform: rotate(3deg); }
</style>
