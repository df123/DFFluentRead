<template>
  <div class="translation-status-container" v-if="isVisible && isFloatingBallTranslating && !userClosed">
    <div class="translation-status-card">
      <div class="translation-status-header">
        <div class="translation-status-title" data-fr-translated="true" >翻译进度</div>
        <div class="translation-status-close" data-fr-translated="true" @click="close">×</div>
      </div>
      <div class="translation-status-content">
        <!-- 进度条部分 -->
        <div class="translation-progress-section">
          <div class="translation-progress-info">
            <div class="translation-progress-percentage">{{ Math.round(status.progressPercentage) }}%</div>
            <div class="translation-remaining-time" v-if="realTimeRemaining > 0">
              剩余: {{ formatRemainingTime(realTimeRemaining) }}
            </div>
          </div>
          <div class="translation-overall-progress">
            <div class="translation-overall-progress-bar" :style="overallProgressStyle"></div>
          </div>
        </div>
        
        <!-- 统计信息部分 -->
        <div class="translation-stats-section">
          <div class="translation-status-row">
            <div class="translation-status-label" data-fr-translated="true" >当前活跃任务:</div>
            <div class="translation-status-value" data-fr-translated="true" >{{ status.activeTranslations }} / {{ status.maxConcurrent }}</div>
          </div>
          <div class="translation-status-row">
            <div class="translation-status-label" data-fr-translated="true" >等待中的任务:</div>
            <div class="translation-status-value" data-fr-translated="true" >{{ status.pendingTranslations }}</div>
          </div>
          <div class="translation-status-row">
            <div class="translation-status-label" data-fr-translated="true" >字符进度:</div>
            <div class="translation-status-value" data-fr-translated="true" >{{ formatNumber(status.completedCharacters) }} / {{ formatNumber(status.totalCharacters) }}</div>
          </div>
          <div class="translation-status-row">
            <div class="translation-status-label" data-fr-translated="true" >平均速度:</div>
            <div class="translation-status-value" data-fr-translated="true" >{{ status.averageSpeed }} 字符/秒</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { getExtendedQueueStatus, ExtendedQueueStatus } from '../entrypoints/utils/translateQueue';

// 组件状态
const isVisible = ref(false);
const isFloatingBallTranslating = ref(false);
const userClosed = ref(false); // 用户是否关闭了状态框
const status = ref<ExtendedQueueStatus>({
  activeTranslations: 0,
  pendingTranslations: 0,
  maxConcurrent: 6,
  isQueueFull: false,
  totalTasksInProcess: 0,
  totalCharacters: 0,
  completedCharacters: 0,
  remainingCharacters: 0,
  progressPercentage: 0,
  estimatedRemainingTime: 0,
  averageSpeed: 0
});

// 实时剩余时间
const realTimeRemaining = ref(0);
let countdownTimer: number | null = null;

// 计算总体进度条样式
const overallProgressStyle = computed(() => {
  const percent = status.value.progressPercentage;
  return {
    width: `${percent}%`,
    backgroundColor: percent > 80 ? '#00b894' : percent > 50 ? '#fdcb6e' : '#0984e3'
  };
});

// 格式化剩余时间
const formatRemainingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }
};

// 格式化数字显示（添加千位分隔符）
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

// 关闭状态卡片
const close = () => {
  userClosed.value = true; // 标记用户已关闭
};

// 重置关闭状态 - 当用户离开页面后重置
const resetClosedState = () => {
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 当页面不可见时（用户切换标签页或最小化），重置状态
      setTimeout(() => {
        userClosed.value = false;
      }, 1000);
    }
  });
  
  // 监听 URL 变化
  const lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      userClosed.value = false;
    }
  });
  
  // 观察 document 的子节点变化，这可能发生在 URL 变化时
  urlObserver.observe(document, { subtree: true, childList: true });
  
  return () => {
    document.removeEventListener('visibilitychange', () => {});
    urlObserver.disconnect();
  };
};

// 启动倒计时
const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  // 只有当有剩余时间时才启动倒计时
  if (status.value.estimatedRemainingTime > 0) {
    realTimeRemaining.value = status.value.estimatedRemainingTime;
    
    countdownTimer = window.setInterval(() => {
      if (realTimeRemaining.value > 0) {
        realTimeRemaining.value--;
      } else {
        // 倒计时结束，停止定时器
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
      }
    }, 1000);
  }
};

// 停止倒计时
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  realTimeRemaining.value = 0;
};

// 监听状态变化，重新启动倒计时
watch(() => status.value.estimatedRemainingTime, (newTime, oldTime) => {
  // 如果剩余时间变化较大（超过5秒），重新启动倒计时
  if (Math.abs(newTime - oldTime) > 5) {
    stopCountdown();
    startCountdown();
  }
});

// 更新状态的定时器
let statusUpdateTimer: number;

// 创建更新状态的函数
const updateStatus = () => {
  const currentStatus = getExtendedQueueStatus();
  status.value = currentStatus;
  
  // 只有当有活跃任务或等待任务时才显示状态卡片
  isVisible.value = currentStatus.activeTranslations > 0 || currentStatus.pendingTranslations > 0;
  
  // 如果没有活跃任务，停止倒计时
  if (currentStatus.activeTranslations === 0 && currentStatus.pendingTranslations === 0) {
    stopCountdown();
  }
};

// 监听悬浮球翻译状态变化
const listenToFloatingBallState = () => {
  // 监听自定义事件: 翻译开始
  const handleTranslationStarted = () => {
    isFloatingBallTranslating.value = true;
    // 当新的翻译开始时，如果是同一页面内重新开始翻译，也要重置用户关闭状态
    if (!isVisible.value) {
      userClosed.value = false;
    }
    // 开始倒计时
    startCountdown();
  };
  
  // 监听自定义事件: 翻译结束
  const handleTranslationEnded = () => {
    isFloatingBallTranslating.value = false;
    // 停止倒计时
    stopCountdown();
  };
  
  // 添加事件监听器
  document.addEventListener('fluentread-translation-started', handleTranslationStarted);
  document.addEventListener('fluentread-translation-ended', handleTranslationEnded);
  
  // 返回清理函数
  return {
    cleanup: () => {
      document.removeEventListener('fluentread-translation-started', handleTranslationStarted);
      document.removeEventListener('fluentread-translation-ended', handleTranslationEnded);
    }
  };
};

// 存储事件监听器的清理函数
let eventListenerCleanup: { cleanup: () => void };
let resetClosedStateCleanup: () => void;

// 组件挂载时启动定时器和事件监听
onMounted(() => {
  updateStatus(); // 立即执行一次更新
  statusUpdateTimer = window.setInterval(updateStatus, 500);
  eventListenerCleanup = listenToFloatingBallState();
  resetClosedStateCleanup = resetClosedState();
});

// 组件卸载时清理定时器和事件监听
onUnmounted(() => {
  clearInterval(statusUpdateTimer);
  stopCountdown();
  eventListenerCleanup.cleanup();
  resetClosedStateCleanup();
});
</script>

<style scoped>
.translation-status-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.translation-status-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 280px;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.translation-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #3498db;
  color: white;
  font-weight: bold;
}

.translation-status-close {
  cursor: pointer;
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.translation-status-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.translation-status-content {
  padding: 12px;
}

/* 进度条部分样式 */
.translation-progress-section {
  margin-bottom: 12px;
}

.translation-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.translation-progress-percentage {
  font-size: 16px;
  font-weight: bold;
  color: #3498db;
}

.translation-remaining-time {
  font-size: 12px;
  color: #666;
}

.translation-overall-progress {
  height: 8px;
  background-color: #f1f1f1;
  border-radius: 4px;
  overflow: hidden;
}

.translation-overall-progress-bar {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* 统计信息部分样式 */
.translation-stats-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.translation-status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.translation-status-label {
  color: #666;
}

.translation-status-value {
  font-weight: 600;
  color: #333;
}

/* 暗黑模式支持 - 使用 :root[class="dark"] 选择器匹配 FluentRead 的主题系统 */
:root[class="dark"] .translation-status-card {
  background-color: #2d3436;
  border-color: #4d4d4d;
  color: #dfe6e9;
}

:root[class="dark"] .translation-status-header {
  background-color: #2980b9;
}

:root[class="dark"] .translation-status-label {
  color: #b2bec3;
}

:root[class="dark"] .translation-status-value {
  color: #dfe6e9;
}

:root[class="dark"] .translation-status-progress {
  background-color: #3d3d3d;
}

/* 保留媒体查询以支持自动模式 */
@media (prefers-color-scheme: dark) {
  :root:not([class="light"]) .translation-status-card {
    background-color: #2d3436;
    border-color: #4d4d4d;
    color: #dfe6e9;
  }
  
  :root:not([class="light"]) .translation-status-header {
    background-color: #2980b9;
  }
  
  :root:not([class="light"]) .translation-status-label {
    color: #b2bec3;
  }
  
  :root:not([class="light"]) .translation-status-value {
    color: #dfe6e9;
  }
  
  :root:not([class="light"]) .translation-status-progress {
    background-color: #3d3d3d;
  }
}
</style>
