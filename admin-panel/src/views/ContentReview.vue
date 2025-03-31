<template>
  <div class="content-review-container">
    <h1>内容审核</h1>
    
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="待审核帖子" name="posts">
        <el-table :data="pendingPosts" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" width="150" />
          <el-table-column prop="content" label="内容">
            <template #default="scope">
              <div class="content-preview">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="author_name" label="作者" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="success" @click="approveContent('post', scope.row.id)">通过</el-button>
              <el-button size="small" type="danger" @click="rejectContent('post', scope.row.id)">拒绝</el-button>
              <el-button size="small" type="primary" @click="viewContent('post', scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-if="postsPagination.total > 0"
            background
            layout="prev, pager, next"
            :total="postsPagination.total"
            :current-page="postsPagination.page"
            :page-size="postsPagination.pageSize"
            @current-change="(page) => fetchPendingContent('posts', page)"
          />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="待审核评论" name="comments">
        <el-table :data="pendingComments" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="post_title" label="所属帖子" width="150" />
          <el-table-column prop="content" label="内容">
            <template #default="scope">
              <div class="content-preview">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="author_name" label="作者" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="success" @click="approveContent('comment', scope.row.id)">通过</el-button>
              <el-button size="small" type="danger" @click="rejectContent('comment', scope.row.id)">拒绝</el-button>
              <el-button size="small" type="primary" @click="viewContent('comment', scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-if="commentsPagination.total > 0"
            background
            layout="prev, pager, next"
            :total="commentsPagination.total"
            :current-page="commentsPagination.page"
            :page-size="commentsPagination.pageSize"
            @current-change="(page) => fetchPendingContent('comments', page)"
          />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="待审核小记" name="notes">
        <el-table :data="pendingNotes" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="content" label="内容">
            <template #default="scope">
              <div class="content-preview">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="author_name" label="作者" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="success" @click="approveContent('note', scope.row.id)">通过</el-button>
              <el-button size="small" type="danger" @click="rejectContent('note', scope.row.id)">拒绝</el-button>
              <el-button size="small" type="primary" @click="viewContent('note', scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-if="notesPagination.total > 0"
            background
            layout="prev, pager, next"
            :total="notesPagination.total"
            :current-page="notesPagination.page"
            :page-size="notesPagination.pageSize"
            @current-change="(page) => fetchPendingContent('notes', page)"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 内容详情对话框 -->
    <el-dialog
      v-model="contentDetailVisible"
      :title="dialogTitle"
      width="60%"
    >
      <div v-if="currentContent">
        <div v-if="contentType === 'post'">
          <h2>{{ currentContent.title }}</h2>
          <p class="post-meta">作者：{{ currentContent.author_name }} | 时间：{{ formatDate(currentContent.created_at) }}</p>
          <div class="post-content">{{ currentContent.content }}</div>
          
          <div v-if="currentContent.images && currentContent.images.length > 0" class="post-images">
            <h3>图片：</h3>
            <div class="image-list">
              <img v-for="(img, index) in parseImages(currentContent.images)" :key="index" :src="img" alt="帖子图片" />
            </div>
          </div>
        </div>
        
        <div v-if="contentType === 'comment'">
          <p class="comment-meta">所属帖子：{{ currentContent.post_title }} | 作者：{{ currentContent.author_name }} | 时间：{{ formatDate(currentContent.created_at) }}</p>
          <div class="comment-content">{{ currentContent.content }}</div>
          
          <div v-if="currentContent.images && currentContent.images.length > 0" class="comment-images">
            <h3>图片：</h3>
            <div class="image-list">
              <img v-for="(img, index) in parseImages(currentContent.images)" :key="index" :src="img" alt="评论图片" />
            </div>
          </div>
        </div>
        
        <div v-if="contentType === 'note'">
          <p class="note-meta">作者：{{ currentContent.author_name }} | 时间：{{ formatDate(currentContent.created_at) }}</p>
          <div class="note-content">{{ currentContent.content }}</div>
          
          <div v-if="currentContent.image" class="note-image">
            <h3>图片：</h3>
            <img :src="formatImageUrl(currentContent.image)" alt="小记图片" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="contentDetailVisible = false">关闭</el-button>
          <el-button type="success" @click="approveInDialog">通过</el-button>
          <el-button type="danger" @click="rejectInDialog">拒绝</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getPendingPosts, 
  getPendingComments, 
  getPendingNotes,
  updatePostStatus,
  updateCommentStatus,
  updateNoteStatus
} from '../api/content-review';

export default {
  name: 'ContentReview',
  setup() {
    const activeTab = ref('posts');
    const loading = ref(false);
    const pendingPosts = ref([]);
    const pendingComments = ref([]);
    const pendingNotes = ref([]);
    
    const postsPagination = reactive({
      total: 0,
      page: 1,
      pageSize: 10
    });
    
    const commentsPagination = reactive({
      total: 0,
      page: 1,
      pageSize: 10
    });
    
    const notesPagination = reactive({
      total: 0,
      page: 1,
      pageSize: 10
    });
    
    // 内容详情对话框
    const contentDetailVisible = ref(false);
    const currentContent = ref(null);
    const contentType = ref('');
    const dialogTitle = ref('');
    
    const handleTabChange = (tab) => {
      const tabName = tab.props.name;
      fetchPendingContent(tabName, 1);
    };
    
    const fetchPendingContent = async (type, page = 1) => {
      loading.value = true;
      try {
        if (type === 'posts') {
          const res = await getPendingPosts(page, postsPagination.pageSize);
          pendingPosts.value = res.data.posts;
          postsPagination.total = res.data.pagination.total;
          postsPagination.page = page;
        } else if (type === 'comments') {
          const res = await getPendingComments(page, commentsPagination.pageSize);
          pendingComments.value = res.data.comments;
          commentsPagination.total = res.data.pagination.total;
          commentsPagination.page = page;
        } else if (type === 'notes') {
          const res = await getPendingNotes(page, notesPagination.pageSize);
          pendingNotes.value = res.data.notes;
          notesPagination.total = res.data.pagination.total;
          notesPagination.page = page;
        }
      } catch (error) {
        ElMessage.error('获取待审核内容失败');
        console.error('获取待审核内容失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const approveContent = async (type, id) => {
      try {
        let res;
        if (type === 'post') {
          res = await updatePostStatus(id, 'approved');
          ElMessage.success('帖子审核通过成功');
        } else if (type === 'comment') {
          res = await updateCommentStatus(id, 'approved');
          ElMessage.success('评论审核通过成功');
        } else if (type === 'note') {
          res = await updateNoteStatus(id, 'approved');
          ElMessage.success('小记审核通过成功');
        }
        
        // 刷新当前列表
        fetchPendingContent(activeTab.value, type === 'posts' ? postsPagination.page : 
                                          type === 'comments' ? commentsPagination.page : 
                                          notesPagination.page);
      } catch (error) {
        ElMessage.error('审核操作失败');
        console.error('审核操作失败:', error);
      }
    };
    
    const rejectContent = async (type, id) => {
      try {
        await ElMessageBox.confirm('确定要拒绝该内容吗？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        let res;
        if (type === 'post') {
          res = await updatePostStatus(id, 'rejected');
          ElMessage.success('帖子已被拒绝');
        } else if (type === 'comment') {
          res = await updateCommentStatus(id, 'rejected');
          ElMessage.success('评论已被拒绝');
        } else if (type === 'note') {
          res = await updateNoteStatus(id, 'rejected');
          ElMessage.success('小记已被拒绝');
        }
        
        // 刷新当前列表
        fetchPendingContent(activeTab.value, type === 'posts' ? postsPagination.page : 
                                          type === 'comments' ? commentsPagination.page : 
                                          notesPagination.page);
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('拒绝操作失败');
          console.error('拒绝操作失败:', error);
        }
      }
    };
    
    const viewContent = (type, content) => {
      contentType.value = type;
      currentContent.value = {...content};
      
      if (type === 'post') {
        dialogTitle.value = '帖子详情';
      } else if (type === 'comment') {
        dialogTitle.value = '评论详情';
      } else if (type === 'note') {
        dialogTitle.value = '小记详情';
      }
      
      contentDetailVisible.value = true;
    };
    
    const approveInDialog = () => {
      if (contentType.value && currentContent.value) {
        approveContent(contentType.value, currentContent.value.id);
        contentDetailVisible.value = false;
      }
    };
    
    const rejectInDialog = () => {
      if (contentType.value && currentContent.value) {
        rejectContent(contentType.value, currentContent.value.id);
        contentDetailVisible.value = false;
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    const parseImages = (images) => {
      if (!images) return [];
      
      let imageArray = [];
      if (typeof images === 'string') {
        try {
          imageArray = JSON.parse(images);
        } catch (e) {
          return [];
        }
      } else if (Array.isArray(images)) {
        imageArray = images;
      } else {
        return [];
      }
      
      // 确保图片URL是完整的
      return imageArray.map(img => {
        if (img && typeof img === 'string') {
          // 如果URL已经是完整的HTTP URL，直接返回
          if (img.startsWith('http')) {
            return img;
          }
          // 否则，添加服务器基础URL
          return `http://47.98.210.7:3000${img.startsWith('/') ? '' : '/'}${img}`;
        }
        return img;
      });
    };
    
    const formatImageUrl = (imageUrl) => {
      if (!imageUrl) return '';
      // 如果URL已经是完整的HTTP URL，直接返回
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // 否则，添加服务器基础URL
      return `http://47.98.210.7:3000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    };
    
    onMounted(() => {
      fetchPendingContent('posts');
    });
    
    return {
      activeTab,
      loading,
      pendingPosts,
      pendingComments,
      pendingNotes,
      postsPagination,
      commentsPagination,
      notesPagination,
      contentDetailVisible,
      currentContent,
      contentType,
      dialogTitle,
      handleTabChange,
      fetchPendingContent,
      approveContent,
      rejectContent,
      viewContent,
      approveInDialog,
      rejectInDialog,
      formatDate,
      parseImages,
      formatImageUrl
    };
  }
};
</script>

<style scoped>
.content-review-container {
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.content-preview {
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta, .comment-meta, .note-meta {
  color: #999;
  font-size: 14px;
  margin-bottom: 15px;
}

.post-content, .comment-content, .note-content {
  margin-bottom: 20px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.post-images, .comment-images, .note-image {
  margin-top: 15px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-list img, .note-image img {
  max-width: 200px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
}
</style> 