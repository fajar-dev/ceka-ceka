<script setup lang="ts">
const route = useRoute()

onMounted(() => {
  const status = route.query.status as string
  const code = route.query.code as string

  if (window.opener) {
    window.opener.postMessage({ type: 'ceka_auth', status, code, query: route.query }, window.location.origin)
    window.close()
  } else {
    navigateTo(status === 'success' ? '/app' : '/')
  }
})
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#111;">
    Memproses login...
  </div>
</template>
