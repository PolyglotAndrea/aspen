<template>
  <view class="as-booking-module">
    <!-- 预约模式: RULES | SEATING -->
    <AsCard :opacity="0.05" :radius="'24rpx'" :padding="'30rpx'">
      <!-- 规则说明 -->
      <AsBookingRules
        v-if="showRules && rules.length > 0"
        :title="rulesTitle"
        :rules="rules"
        class="module-rules"
      />

      <!-- 表单区域 -->
      <view class="form-section">
        <!-- 姓名 -->
        <AsInput
          v-model="formData.name"
          :label="labels.name"
          :placeholder="placeholders.name"
        />

        <!-- 电话 -->
        <AsInput
          v-model="formData.phone"
          :label="labels.phone"
          :placeholder="placeholders.phone"
          type="number"
        />

        <!-- 日期选择 -->
        <AsDatePicker
          v-model="formData.date"
          :label="labels.date"
          :start="minDate"
        />

        <!-- 时间选择 -->
        <AsTimePicker
          v-if="mode === 'RULES' || showTimeSelector"
          v-model="formData.time"
          :label="labels.time"
          :slots="timeSlots"
        />

        <!-- 人数选择 (通用) -->
        <AsStepper
          v-model="formData.guests"
          :label="labels.guests"
          :min="minGuests"
          :max="maxGuests"
        />

        <!-- 桌位选择 (仅 SEATING 模式) -->
        <AsSeatSelector
          v-if="mode === 'SEATING' && seatTypes.length > 0"
          v-model="formData.seatId"
          :label="labels.seat"
          :seats="formattedSeats"
        />

        <!-- 备注/特殊需求 -->
        <view v-if="showRemarks" class="remarks-section">
          <text class="remarks-label">{{ labels.remarks || '备注' }}</text>
          <textarea
            v-model="formData.remarks"
            class="remarks-input"
            :placeholder="placeholders.remarks || '如有特殊需求请备注 (过敏史、儿童椅等)'"
            :maxlength="remarksMaxLength"
          />
          <text class="remarks-count">{{ formData.remarks.length }}/{{ remarksMaxLength }}</text>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :class="{ 'submit-btn--loading': loading }"
          :disabled="loading"
          @click="handleSubmit"
        >
          <text>{{ loading ? submitTextLoading : submitText }}</text>
        </button>
      </view>
    </AsCard>

    <!-- 预约成功弹窗 -->
    <AsBookingModal
      v-model:visible="showResultModal"
      :title="successModalTitle"
      :show-summary="false"
    >
      <view class="result-content">
        <text class="result-icon">✅</text>
        <text class="result-message">{{ successMessage }}</text>
      </view>
      <template #footer>
        <view class="result-footer" @click="handleResultClose">
          <text>我知道了</text>
        </view>
      </template>
    </AsBookingModal>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import AsCard from '../AsCard/AsCard.vue';
import AsBookingRules from '../AsBookingRules/AsBookingRules.vue';
import AsInput from '../AsBookingModal/AsInput.vue';
import AsDatePicker from '../AsBookingModal/AsDatePicker.vue';
import AsTimePicker from '../AsBookingModal/AsTimePicker.vue';
import AsStepper from '../AsBookingModal/AsStepper.vue';
import AsSeatSelector from '../AsSeatSelector/AsSeatSelector.vue';
import AsBookingModal from '../AsBookingModal/AsBookingModal.vue';

interface SeatType {
  id: string;
  name: string;
  icon?: string;
  capacity?: number;
  available?: boolean;
}

interface BookingFormData {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatId?: string;
  remarks?: string;
}

interface Props {
  /** 预约模式: RULES (规则预约) | SEATING (在线订座) */
  mode?: 'RULES' | 'SEATING';
  /** 预约规则 */
  rules?: string[];
  /** 是否显示规则 */
  showRules?: boolean;
  /** 规则标题 */
  rulesTitle?: string;
  /** 桌位类型列表 */
  seatTypes?: SeatType[];
  /** 时间段列表 */
  timeSlots?: string[];
  /** 最小人数 */
  minGuests?: number;
  /** 最大人数 */
  maxGuests?: number;
  /** 是否显示备注 */
  showRemarks?: boolean;
  /** 备注最大长度 */
  remarksMaxLength?: number;
  /** 提交按钮文字 */
  submitText?: string;
  /** 提交中按钮文字 */
  submitTextLoading?: string;
  /** API 地址 */
  apiUrl?: string;
  /** 自定义标签 */
  labels?: {
    name?: string;
    phone?: string;
    date?: string;
    time?: string;
    guests?: string;
    seat?: string;
    remarks?: string;
  };
  /** 自定义占位符 */
  placeholders?: {
    name?: string;
    phone?: string;
    remarks?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'RULES',
  rules: () => [],
  showRules: true,
  rulesTitle: '预约须知',
  seatTypes: () => [],
  timeSlots: () => ['11:30', '12:00', '12:30', '13:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
  minGuests: 1,
  maxGuests: 20,
  showRemarks: true,
  remarksMaxLength: 200,
  submitText: '立即预约',
  submitTextLoading: '提交中...',
  apiUrl: 'http://localhost:3000/api/v1',
  labels: () => ({}),
  placeholders: () => ({}),
});

const emit = defineEmits<{
  submit: [data: BookingFormData];
  success: [result: any];
  error: [error: string];
}>();

// Form state
const formData = reactive<BookingFormData>({
  name: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  seatId: '',
  remarks: '',
});

const loading = ref(false);
const showResultModal = ref(false);
const successMessage = ref('');
const successModalTitle = ref('预约成功');

// Computed
const minDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const showTimeSelector = computed(() => {
  return props.mode === 'RULES';
});

const formattedSeats = computed(() => {
  return props.seatTypes.map(seat => ({
    id: seat.id,
    name: seat.name,
    icon: seat.icon || '🪑',
    capacity: seat.capacity,
    available: seat.available !== false,
  }));
});

// Validation
const validate = (): boolean => {
  if (!formData.name.trim()) {
    uni.showToast({ title: props.placeholders.name || '请输入姓名', icon: 'none' });
    return false;
  }

  if (!formData.phone.trim() || !/^1\d{10}$/.test(formData.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return false;
  }

  if (!formData.date) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return false;
  }

  if (!formData.time) {
    uni.showToast({ title: '请选择时间', icon: 'none' });
    return false;
  }

  if (props.mode === 'SEATING' && !formData.seatId) {
    uni.showToast({ title: '请选择桌位', icon: 'none' });
    return false;
  }

  return true;
};

// Submit handler
const handleSubmit = async () => {
  if (!validate()) return;

  loading.value = true;

  try {
    const bookingData: any = {
      name: formData.name,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      guests: formData.guests,
    };

    // SEATING 模式额外字段
    if (props.mode === 'SEATING' && formData.seatId) {
      bookingData.seatId = formData.seatId;
      bookingData.seatName = props.seatTypes.find(s => s.id === formData.seatId)?.name;
    }

    // 备注/特殊需求
    if (props.showRemarks && formData.remarks) {
      bookingData.remarks = formData.remarks;
      bookingData.metadata = {
        remarks: formData.remarks,
        bookingMode: props.mode,
      };
    }

    const response = await fetch(`${props.apiUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      successMessage.value = result.message || '预约成功';
      emit('success', result);
      showResultModal.value = true;

      // 重置表单
      resetForm();
    } else {
      throw new Error(result.message || '预约失败');
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '网络错误', icon: 'none' });
    emit('error', error.message);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.name = '';
  formData.phone = '';
  formData.date = '';
  formData.time = '';
  formData.guests = 2;
  formData.seatId = '';
  formData.remarks = '';
};

const handleResultClose = () => {
  showResultModal.value = false;
};

// Expose methods
const setFormData = (data: Partial<BookingFormData>) => {
  Object.assign(formData, data);
};

const getFormData = (): BookingFormData => {
  return { ...formData };
};

defineExpose({
  setFormData,
  getFormData,
  validate,
  submit: handleSubmit,
});
</script>

<style lang="scss" scoped>
.as-booking-module {
  width: 100%;
}

.module-rules {
  margin-bottom: var(--as-spacing-lg);
  padding-bottom: var(--as-spacing-lg);
  border-bottom: 1px solid var(--as-border);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--as-spacing-base);
}

.remarks-section {
  margin-top: var(--as-spacing-xs);
}

.remarks-label {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
  margin-bottom: var(--as-spacing-xs);
}

.remarks-input {
  width: 100%;
  min-height: 160rpx;
  padding: var(--as-spacing-sm);
  background: var(--as-surface);
  border: 1px solid var(--as-border);
  border-radius: var(--as-radius-base);
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  line-height: 1.5;
}

.remarks-count {
  display: block;
  text-align: right;
  font-size: var(--as-font-size-xs);
  color: var(--as-text-secondary);
  margin-top: var(--as-spacing-xs);
}

.submit-section {
  margin-top: var(--as-spacing-xl);
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: var(--as-primary);
  border-radius: var(--as-radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;

  text {
    font-size: var(--as-font-size-base);
    color: #fff;
    font-weight: 500;
  }

  &:active {
    opacity: 0.8;
  }

  &[disabled] {
    opacity: 0.6;
  }
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--as-spacing-base);
  padding: var(--as-spacing-lg) 0;
}

.result-icon {
  font-size: 80rpx;
}

.result-message {
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  text-align: center;
}

.result-footer {
  width: 100%;
  height: 88rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--as-primary);
  border-radius: var(--as-radius-full);

  text {
    font-size: var(--as-font-size-base);
    color: #fff;
    font-weight: 500;
  }
}
</style>
