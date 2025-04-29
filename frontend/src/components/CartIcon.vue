<template>
  <v-badge
    :content="cartStore.totalItems"
    :model-value="cartStore.totalItems > 0"
    color="error"
  >
    <v-btn
      icon
      :to="{ name: 'Cart' }"
    >
      <v-icon>mdi-cart</v-icon>
    </v-btn>
  </v-badge>
</template>

<script setup>
import { useCartStore } from '@/stores/cart';

const cartStore = useCartStore();
</script>
