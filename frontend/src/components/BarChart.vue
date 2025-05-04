<script setup>
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'
Chart.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend)
defineProps(['data'])
</script>
<template>
  <Bar :data="data" />
</template>
