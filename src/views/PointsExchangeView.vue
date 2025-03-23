<template>
  <div class="points-exchange">
    <div class="page-header">
      <div class="safe-area-top"></div>
      <div class="header-content">
        <div class="left-section">
          <el-button class="back-button" @click="goBack" text>
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </div>
        <div class="center-section">
          <h1 class="title">积分兑换商城</h1>
        </div>
        <div class="right-section">
          <div class="user-points">
            <span class="points-count">{{ userPoints }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="points-content">
      <el-tabs v-model="activeTab" class="exchange-tabs">
        <el-tab-pane label="商品列表" name="products">
          <div v-if="loading" class="loading-spinner">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="error" class="error-message">
            <el-alert
              :title="error"
              type="error"
              show-icon
              :closable="false"
            />
          </div>
          
          <div v-else-if="products.length === 0" class="empty-state">
            <el-empty description="暂无商品" />
          </div>
          
          <div v-else class="products-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
            >
              <div class="product-image">
                <img
                  :src="product.image_url || defaultProductImage"
                  :alt="product.name"
                  @error="handleImageError"
                />
              </div>
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-meta">
                  <div class="product-stock" :class="{ 'out-of-stock': product.quantity <= 0 }">
                    剩余: {{ product.quantity }}
                  </div>
                </div>
                <div class="product-points">
                  {{ product.points_cost }} 积分
                </div>
                <el-button
                  type="primary"
                  class="exchange-button"
                  :disabled="product.quantity <= 0 || userPoints < product.points_cost"
                  @click="handleExchange(product)"
                >
                  {{ getButtonText(product) }}
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="兑换记录" name="exchanges">
          <div v-if="loading" class="loading-spinner">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="exchanges.length === 0" class="empty-state">
            <el-empty description="暂无兑换记录" />
          </div>
          
          <div v-else class="exchanges-table">
            <el-table :data="exchanges" style="width: 100%">
              <el-table-column prop="product_name" label="商品名称" />
              <el-table-column prop="points_cost" label="消耗积分" width="100" />
              <el-table-column prop="exchange_time" label="兑换时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.exchange_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 确认兑换对话框 -->
      <el-dialog
        v-model="confirmDialogVisible"
        title="确认兑换"
        width="80%"
        class="exchange-dialog"
      >
        <div v-if="selectedProduct" class="confirm-exchange">
          <p>您确定要兑换以下商品吗？</p>
          <div class="confirm-product-info">
            <h4>{{ selectedProduct.name }}</h4>
            <p>所需积分: {{ selectedProduct.points_cost }}</p>
            <p>当前积分: {{ userPoints }}</p>
            <p>兑换后剩余: {{ userPoints - selectedProduct.points_cost }}</p>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="confirmDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="confirmExchange"
              :loading="exchangeLoading"
            >
              确认兑换
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { usePointsStore } from "../stores/points";
import { useAuthStore } from "../stores/auth";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

const pointsStore = usePointsStore();
const authStore = useAuthStore();
const router = useRouter();

const activeTab = ref("products");
const products = ref([]);
const exchanges = ref([]);
const loading = ref(false);
const error = ref(null);
const confirmDialogVisible = ref(false);
const selectedProduct = ref(null);
const exchangeLoading = ref(false);
const defaultProductImage = "/images/default-product.png"; // 修改默认商品图片路径

// 获取用户当前积分
const userPoints = computed(() => {
  return authStore.user?.points || 0;
});

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await pointsStore.fetchProducts();
    products.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || "获取商品列表失败";
  } finally {
    loading.value = false;
  }
};

// 获取兑换记录
const fetchExchanges = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await pointsStore.fetchUserExchanges();
    exchanges.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || "获取兑换记录失败";
  } finally {
    loading.value = false;
  }
};

// 点击兑换按钮
const handleExchange = (product) => {
  selectedProduct.value = product;
  confirmDialogVisible.value = true;
};

// 确认兑换
const confirmExchange = async () => {
  if (!selectedProduct.value) return;
  
  exchangeLoading.value = true;
  try {
    const result = await pointsStore.exchangeProduct(selectedProduct.value.id);
    confirmDialogVisible.value = false;
    ElMessage.success(`成功兑换商品: ${result.product}`);
    
    // 重新获取商品列表（更新库存）
    await fetchProducts();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "兑换失败");
  } finally {
    exchangeLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 获取兑换状态类型
const getStatusType = (status) => {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "info";
  }
};

// 获取兑换状态文本
const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "已完成";
    case "pending":
      return "处理中";
    case "failed":
      return "失败";
    default:
      return "未知";
  }
};

// 获取按钮文本
const getButtonText = (product) => {
  if (product.quantity <= 0) {
    return "已售罄";
  }
  if (userPoints.value < product.points_cost) {
    return "积分不足";
  }
  return "立即兑换";
};

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = defaultProductImage;
};

// 页面加载时获取数据
onMounted(async () => {
  // 加载用户信息（确保有最新积分）
  if (!authStore.user) {
    await authStore.fetchUserInfo();
  }
  
  // 获取商品列表和兑换记录
  await fetchProducts();
  await fetchExchanges();
});

// 返回箭头按钮
const goBack = () => {
  router.back();
};
</script>

<style scoped>
.points-exchange {
  min-height: 100vh;
  background-color: #f8f9fc;
}

.page-header {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.safe-area-top {
  height: var(--safe-area-top, 0);
  width: 100%;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
}

.left-section {
  width: 40px;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.right-section {
  width: 80px;
  display: flex;
  justify-content: flex-end;
}

.back-button {
  font-size: 20px;
  border: none;
  box-shadow: none;
  padding: 0;
}

.back-button:hover,
.back-button:focus {
  background: transparent;
  box-shadow: none;
}

.title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

.user-points {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.points-count {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.points-content {
  padding: 16px;
}

.exchange-tabs {
  margin-top: 8px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.product-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: #ffffff;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 160px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 12px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  margin-bottom: 8px;
}

.product-stock {
  font-size: 12px;
  color: #67c23a;
}

.product-stock.out-of-stock {
  color: #f56c6c;
}

.product-points {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 12px;
}

.exchange-button {
  width: 100%;
}

.empty-state {
  margin: 32px 0;
}

.loading-spinner {
  margin: 32px 0;
}

.error-message {
  margin: 16px 0;
}

.exchanges-table {
  margin: 16px 0;
}

.confirm-product-info {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.confirm-product-info h4 {
  margin: 0 0 8px;
}

.confirm-product-info p {
  margin: 4px 0;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  
  .product-image {
    height: 120px;
  }
}
</style> 