<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
    class="event-form"
  >
    <el-form-item label="标题" prop="title">
      <el-input v-model="form.title" placeholder="请输入事件标题" />
    </el-form-item>

    <el-form-item label="开始时间" prop="startTime">
      <el-date-picker
        v-model="form.startTime"
        type="datetime"
        :default-time="defaultTime"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DDTHH:mm:ss"
        placeholder="选择开始时间"
      />
    </el-form-item>

    <el-form-item label="结束时间" prop="endTime">
      <el-date-picker
        v-model="form.endTime"
        type="datetime"
        :default-time="defaultTime"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DDTHH:mm:ss"
        placeholder="选择结束时间"
      />
    </el-form-item>

    <el-form-item label="颜色">
      <el-color-picker
        v-model="form.color"
        :predefine="predefineColors"
        show-alpha
      />
    </el-form-item>

    <el-form-item label="提醒">
      <el-switch v-model="form.reminder" />
    </el-form-item>

    <div class="form-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <template v-if="type === 'edit'">
        <el-button type="danger" @click="handleDelete"> 删除 </el-button>
      </template>
      <el-button type="primary" @click="handleSubmit">
        {{ type === "add" ? "创建" : "保存" }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";
import dayjs from "dayjs";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    default: "add",
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue", "submit", "cancel", "delete"]);

const formRef = ref(null);
const form = ref({ ...props.modelValue });

// 预定义颜色
const predefineColors = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#FF85C0",
  "#36CFC9",
  "#B37FEB",
];

// 表单验证规则
const rules = {
  title: [{ required: true, message: "请输入事件标题", trigger: "blur" }],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endTime: [
    { required: true, message: "请选择结束时间", trigger: "change" },
    {
      validator: (rule, value, callback) => {
        if (
          value &&
          form.value.startTime &&
          dayjs(value).isBefore(dayjs(form.value.startTime))
        ) {
          callback(new Error("结束时间不能早于开始时间"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

// 禁用过去的日期
const disabledDate = (time) => {
  return dayjs(time).isBefore(dayjs().startOf("day"));
};

// 禁用早于开始时间的结束时间
const disabledEndTime = (date) => {
  if (form.value.startTime) {
    return date.getTime() < dayjs(form.value.startTime).valueOf();
  }
  return false;
};

// 监听表单值变化
watch(
  () => props.modelValue,
  (newVal) => {
    form.value = { ...newVal };
  },
  { deep: true }
);

// 监听 initialData 的变化
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.value = {
        ...newVal,
        startTime: dayjs(newVal.startTime).format("YYYY-MM-DDTHH:mm:ss"),
        endTime: dayjs(newVal.endTime).format("YYYY-MM-DDTHH:mm:ss"),
      };
    }
  },
  { immediate: true }
);

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    // 确保在编辑模式下传递事件ID
    const formData = {
      ...form.value,
      id: props.type === "edit" ? props.initialData.id : undefined,
    };
    emit("submit", formData);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const handleDelete = () => {
  if (!props.initialData || !props.initialData.id) {
    console.error("无效的事件ID");
    return;
  }
  emit("delete", props.initialData);
};
</script>

<style scoped>
.event-form {
  padding: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

:deep(.el-date-editor) {
  width: 100%;
}

@media screen and (max-width: 768px) {
  .event-form {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .form-actions .el-button {
    width: 100%;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
