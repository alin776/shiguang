<template>
  <div class="points-products-container">
    <div class="page-header">
      <h1 class="page-title">积分商品管理</h1>
      <el-button type="primary" @click="openProductDialog()">添加商品</el-button>
    </div>

    <el-card class="product-list" v-loading="loading">
      <el-table :data="products" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="120">
          <template #default="scope">
            <el-image 
              v-if="scope.row.image_url" 
              :src="scope.row.image_url" 
              fit="cover"
              style="width: 80px; height: 80px;"
              :preview-src-list="[scope.row.image_url]"
            />
            <div v-else class="no-image">无图片</div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" width="180" />
        <el-table-column prop="description" label="商品描述">
          <template #default="scope">
            <div class="description-text">{{ scope.row.description || '无描述' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="points_cost" label="所需积分" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="120" />
        <el-table-column label="是否上架" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openProductDialog(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.is_active ? 'warning' : 'success'" 
              @click="toggleProductStatus(scope.row)"
            >
              {{ scope.row.is_active ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteProduct(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 商品编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑商品' : '添加商品'"
      width="50%"
      destroy-on-close
    >
      <el-form 
        :model="productForm" 
        :rules="productRules" 
        ref="productFormRef" 
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="productForm.description" type="textarea" rows="4" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="商品图片" prop="image_url">
          <el-upload
            class="product-image-upload"
            action="http://47.98.210.7:3000/api/upload/cover"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            :on-error="handleUploadError"
          >
            <el-image 
              v-if="productForm.image_url" 
              :src="productForm.image_url" 
              fit="cover"
              class="preview-image"
            />
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>点击上传图片</span>
            </div>
          </el-upload>
          <div class="upload-tip">建议上传比例为1:1的方形图片，大小不超过2MB</div>
        </el-form-item>
        <el-form-item label="所需积分" prop="points_cost">
          <el-input-number v-model="productForm.points_cost" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity">
          <el-input-number v-model="productForm.quantity" :min="0" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="是否上架" prop="is_active">
          <el-switch v-model="productForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getAllPointsProducts, 
  addPointsProduct, 
  updatePointsProduct, 
  deletePointsProduct 
} from '@/api/points-product';
import { Plus } from '@element-plus/icons-vue';

// 数据
const products = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const currentProductId = ref(null);

// 上传相关
const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  };
});

// 表单
const productFormRef = ref(null);
const productForm = reactive({
  name: '',
  description: '',
  image_url: '',
  points_cost: 100,
  quantity: 1,
  is_active: true
});

// 表单验证规则
const productRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  points_cost: [
    { required: true, message: '请输入商品积分价格', trigger: 'blur' },
    { type: 'number', min: 1, message: '积分必须大于0', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '请输入商品库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存必须是非负数', trigger: 'blur' }
  ],
  image_url: [
    { required: true, message: '请上传商品图片', trigger: 'change' }
  ]
};

// 获取所有积分商品
const fetchProducts = async () => {
  loading.value = true;
  try {
    const data = await getAllPointsProducts();
    products.value = data;
  } catch (error) {
    ElMessage.error('获取积分商品列表失败');
  } finally {
    loading.value = false;
  }
};

// 打开商品编辑对话框
const openProductDialog = (product) => {
  resetForm();
  
  if (product) {
    // 编辑模式
    isEditing.value = true;
    currentProductId.value = product.id;
    productForm.name = product.name;
    productForm.description = product.description || '';
    productForm.image_url = product.image_url || '';
    productForm.points_cost = product.points_cost;
    productForm.quantity = product.quantity;
    productForm.is_active = Boolean(product.is_active);
  } else {
    // 添加模式
    isEditing.value = false;
    currentProductId.value = null;
  }
  
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  productForm.name = '';
  productForm.description = '';
  productForm.image_url = '';
  productForm.points_cost = 100;
  productForm.quantity = 1;
  productForm.is_active = true;
  
  if (productFormRef.value) {
    productFormRef.value.resetFields();
  }
};

// 上传相关方法
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

const handleUploadSuccess = (response) => {
  if (response.url) {
    // 保存原始URL
    let imageUrl = response.url;
    
    // 如果返回的是文件名而不是路径，需要拼接完整路径
    if (!imageUrl.includes('/') && !imageUrl.startsWith('http')) {
      imageUrl = `/uploads/covers/${imageUrl}`;
    }
    
    // 如果是相对路径，添加服务器基础URL
    if (!imageUrl.startsWith('http')) {
      imageUrl = `http://47.98.210.7:3000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    productForm.image_url = imageUrl;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error('上传失败: 服务器未返回图片URL');
  }
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试');
};

// 保存商品
const saveProduct = async () => {
  if (!productFormRef.value) return;
  
  await productFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      if (isEditing.value) {
        // 更新商品
        await updatePointsProduct(currentProductId.value, productForm);
        ElMessage.success('商品更新成功');
      } else {
        // 添加商品
        await addPointsProduct(productForm);
        ElMessage.success('商品添加成功');
      }
      
      dialogVisible.value = false;
      fetchProducts();
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新商品失败' : '添加商品失败');
    } finally {
      loading.value = false;
    }
  });
};

// 切换商品上架状态
const toggleProductStatus = async (product) => {
  try {
    loading.value = true;
    await updatePointsProduct(product.id, { is_active: !product.is_active });
    ElMessage.success(`商品已${product.is_active ? '下架' : '上架'}`);
    fetchProducts();
  } catch (error) {
    ElMessage.error('更新商品状态失败');
  } finally {
    loading.value = false;
  }
};

// 删除商品
const deleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品 "${product.name}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    await deletePointsProduct(product.id);
    ElMessage.success('商品已删除');
    fetchProducts();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除商品失败');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.points-products-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.product-list {
  margin-bottom: 20px;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.no-image {
  width: 80px;
  height: 80px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  border-radius: 4px;
}

.product-image-upload {
  display: block;
  width: 100%;
}

.preview-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.upload-placeholder {
  width: 150px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  color: #8c939d;
  cursor: pointer;
}

.upload-placeholder:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.upload-placeholder i {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style> 