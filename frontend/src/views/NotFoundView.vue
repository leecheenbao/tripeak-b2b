<template>
  <div class="not-found-page">
    <v-container class="fill-height">
      <v-row
        align="center" 
        justify="center"
      >
        <v-col
          cols="12" 
          md="6" 
          class="text-center"
        >
          <div class="not-found-code">404</div>
          <h1 class="text-h4 font-weight-bold mb-4">頁面未找到</h1>
          <p class="text-subtitle-1 mb-8">
            很抱歉，您訪問的頁面不存在或已被移除。
          </p>
          <v-btn
            color="primary"
            size="large"
            class="mr-4"
            to="/"
          >
            返回首頁
          </v-btn>
          <v-btn
            variant="outlined"
            size="large"
            @click="goBack"
          >
            返回上一頁
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.not-found-code {
  font-size: 8rem;
  font-weight: bold;
  color: var(--primary);
  line-height: 1;
  margin-bottom: 1rem;
  opacity: 0.3;
}
</style> 