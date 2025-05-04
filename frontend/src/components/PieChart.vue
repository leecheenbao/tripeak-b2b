<script setup>
import { Pie } from 'vue-chartjs'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend)
defineProps(['data'])
</script>
<template>
  <Pie :data="data" />
</template>
