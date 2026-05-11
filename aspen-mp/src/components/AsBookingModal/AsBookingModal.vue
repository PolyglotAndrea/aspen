<template>
  <view v-if="visible" class="as-booking-modal" @click="handleOverlayClick">
    <view class="as-booking-modal__container" @click.stop>
      <!-- Header -->
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <view class="modal-close" @click="handleClose">
          <text>✕</text>
        </view>
      </view>

      <!-- Body -->
      <view class="modal-body">
        <!-- 预约信息摘要 -->
        <view v-if="showSummary" class="booking-summary">
          <view class="summary-item">
            <text class="summary-label">{{ dateLabel }}</text>
            <text class="summary-value">{{ formData.date }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">{{ timeLabel }}</text>
            <text class="summary-value">{{ formData.time }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">{{ guestsLabel }}</text>
            <text class="summary-value">{{ formData.guests }}{{ guestsUnit }}</text>
          </view>
        </view>

        <!-- 表单内容 -->
        <view class="booking-form">
          <AsInput
            v-model="formData.name"
            :label="nameLabel"
            :placeholder="namePlaceholder"
            :error="errors.name"
          />

          <AsInput
            v-model="formData.phone"
            :label="phoneLabel"
            :placeholder="phonePlaceholder"
            type="number"
            :error="errors.phone"
          />

          <AsDatePicker
            v-model="formData.date"
            :label="dateLabel"
            :start="minDate"
          />

          <AsTimePicker
            v-model="formData.time"
            :label="timeLabel"
            :slots="timeSlots"
          />

          <AsStepper
            v-model="formData.guests"
            :label="guestsLabel"
            :min="1"
            :max="maxGuests"
            :unit="guestsUnit"
          />
        </view>
      </view>

      <!-- Footer -->
      <view class="modal-footer">
        <view class="footer-btn footer-btn--cancel" @click="handleClose">
          <text>{{ cancelText }}</text>
        </view>
        <view
          class="footer-btn footer-btn--confirm"
          :class="{ 'footer-btn--loading': loading }"
          @click="handleConfirm"
        >
          <text>{{ loading ? loadingText : confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import AsInput from './AsInput.vue';
import AsDatePicker from './AsDatePicker.vue';
import AsTimePicker from './AsTimePicker.vue';
import AsStepper from './AsStepper.vue';

interface FormData {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
}

interface FormErrors {
  [key: string]: string | undefined;
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
}

interface Props {
  /** 是否显示模态框 */
  visible?: boolean;
  /** 标题 */
  title?: string;
  /** 是否显示预约摘要 */
  showSummary?: boolean;
  /** 提交中状态 */
  loading?: boolean;
  /** 加载文字 */
  loadingText?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 人数上限 */
  maxGuests?: number;
  /** 时间 slots */
  timeSlots?: string[];
  /** 人数单位 */
  guestsUnit?: string;
  // Labels
  nameLabel?: string;
  namePlaceholder?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  dateLabel?: string;
  timeLabel?: string;
  guestsLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '确认预约',
  showSummary: true,
  loading: false,
  loadingText: '提交中...',
  confirmText: '确认预约',
  cancelText: '取消',
  maxGuests: 20,
  timeSlots: () => ['11:30', '12:00', '12:30', '13:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
  guestsUnit: '人',
  nameLabel: '姓名',
  namePlaceholder: '请输入您的姓名',
  phoneLabel: '手机号',
  phonePlaceholder: '请输入手机号',
  dateLabel: '日期',
  timeLabel: '时间',
  guestsLabel: '用餐人数',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [data: FormData];
  close: [];
}>();

// Form state
const formData = reactive<FormData>({
  name: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
});

const errors = reactive<FormErrors>({});

// Min date (today)
const minDate = new Date().toISOString().split('T')[0];

// Watch for visible changes to reset form
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});

// Reset form
const resetForm = () => {
  formData.name = '';
  formData.phone = '';
  formData.date = '';
  formData.time = '';
  formData.guests = 2;
  Object.keys(errors).forEach(key => delete errors[key]);
};

// Validation
const validate = (): boolean => {
  let isValid = true;
  Object.keys(errors).forEach(key => delete errors[key]);

  if (!formData.name.trim()) {
    errors.name = '请输入姓名';
    isValid = false;
  }

  if (!formData.phone.trim()) {
    errors.phone = '请输入手机号';
    isValid = false;
  } else if (!/^1\d{10}$/.test(formData.phone)) {
    errors.phone = '手机号格式不正确';
    isValid = false;
  }

  if (!formData.date) {
    errors.date = '请选择日期';
    isValid = false;
  }

  if (!formData.time) {
    errors.time = '请选择时间';
    isValid = false;
  }

  return isValid;
};

// Handlers
const handleOverlayClick = () => {
  if (!props.loading) {
    handleClose();
  }
};

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const handleConfirm = () => {
  if (!validate()) return;
  emit('confirm', { ...formData });
};

// Expose method to set form data externally
const setFormData = (data: Partial<FormData>) => {
  Object.assign(formData, data);
};

defineExpose({ setFormData });
</script>

<style lang="scss" scoped>
.as-booking-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);

  &__container {
    width: 100%;
    max-height: 90vh;
    background: var(--as-background);
    border-radius: var(--as-radius-lg) var(--as-radius-lg) 0 0;
    overflow: hidden;
    animation: slideUp 0.3s ease;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--as-spacing-base) var(--as-spacing-lg);
  border-bottom: 1px solid var(--as-border);
}

.modal-title {
  font-size: var(--as-font-size-lg);
  font-weight: 600;
  color: var(--as-text);
}

.modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--as-text-secondary);
  font-size: 32rpx;
}

.modal-body {
  padding: var(--as-spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.booking-summary {
  display: flex;
  gap: var(--as-spacing-lg);
  padding: var(--as-spacing-base);
  background: var(--as-surface);
  border-radius: var(--as-radius-base);
  margin-bottom: var(--as-spacing-lg);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: var(--as-font-size-xs);
  color: var(--as-text-secondary);
  margin-bottom: 4rpx;
}

.summary-value {
  display: block;
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  font-weight: 500;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: var(--as-spacing-base);
}

.modal-footer {
  display: flex;
  gap: var(--as-spacing-sm);
  padding: var(--as-spacing-base) var(--as-spacing-lg);
  padding-bottom: calc(var(--as-spacing-base) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--as-border);
}

.footer-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--as-radius-full);
  font-size: var(--as-font-size-base);
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }

  &--cancel {
    background: var(--as-surface);
    color: var(--as-text-muted);
    border: 1px solid var(--as-border);
  }

  &--confirm {
    background: var(--as-primary);
    color: #fff;
  }

  &--loading {
    opacity: 0.7;
  }
}
</style>
