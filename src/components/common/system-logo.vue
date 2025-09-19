<script lang="ts" setup>
defineOptions({ name: 'SystemLogo' });
import logo from "@/assets/imgs/logo.png"
</script>

<template>
  <!-- <icon-local-logo /> -->
<img :src="logo" width="35px" height="35px"></img>
</template>

<style scoped></style>
