/**
 * 翻译队列管理模块
 * 控制并发翻译任务的数量，避免同时进行过多翻译请求
 * 扩展支持字符计数和进度监控
 */

import { config } from './config';
import { translationStatsManager } from './translationStats';

// 队列状态
let activeTranslations = 0; // 当前活跃的翻译任务数量
let pendingTranslations: Array<() => Promise<any>> = []; // 等待执行的翻译任务队列

// 字符计数和任务跟踪
let totalCharacters = 0; // 总字符数
let completedCharacters = 0; // 已完成字符数
let currentTasks: Map<string, { taskId: string; characterCount: number; startTime: number }> = new Map();

/**
 * 扩展队列状态接口
 */
export interface ExtendedQueueStatus {
  activeTranslations: number;
  pendingTranslations: number;
  maxConcurrent: number;
  isQueueFull: boolean;
  totalTasksInProcess: number;
  totalCharacters: number;
  completedCharacters: number;
  remainingCharacters: number;
  progressPercentage: number;
  estimatedRemainingTime: number;
  averageSpeed: number;
}

// 调试相关
const isDev = process.env.NODE_ENV === 'development';

// 获取最大并发翻译数量
function getMaxConcurrentTranslations(): number {
  return config.maxConcurrentTranslations || 6; // 默认值为6
}

/**
 * 添加翻译任务到队列（支持字符计数）
 * @param translationTask 翻译任务函数, 需要返回Promise
 * @param characterCount 翻译字符数
 * @param taskId 任务ID（可选，自动生成）
 * @returns 返回一个Promise，当任务执行完成时resolve
 */
export function enqueueTranslation<T>(
  translationTask: () => Promise<T>,
  characterCount: number = 0,
  taskId?: string
): Promise<T> {
  const actualTaskId = taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve, reject) => {
    // 创建任务包装器，在任务完成后处理队列状态
    const taskWrapper = async () => {
      // 开始翻译任务统计
      translationStatsManager.startTranslation(actualTaskId, characterCount);
      
      try {
        // 执行实际的翻译任务
        const result = await translationTask();
        
        // 完成翻译任务统计
        translationStatsManager.completeTranslation(actualTaskId);
        
        // 更新已完成字符数
        completedCharacters += characterCount;
        
        resolve(result);
        return result;
      } catch (error) {
        // 即使失败也完成统计
        translationStatsManager.completeTranslation(actualTaskId);
        reject(error);
        throw error;
      } finally {
        // 无论成功失败，都需要减少活跃任务计数并处理队列
        activeTranslations--;
        processQueue();
        
        // 从当前任务中移除
        currentTasks.delete(actualTaskId);
      }
    };

    // 更新总字符数
    totalCharacters += characterCount;
    
    // 记录当前任务
    currentTasks.set(actualTaskId, {
      taskId: actualTaskId,
      characterCount,
      startTime: Date.now()
    });

    // 将任务添加到队列
    if (activeTranslations < getMaxConcurrentTranslations()) {
      // 直接执行任务
      activeTranslations++;
      taskWrapper();
    } else {
      pendingTranslations.push(taskWrapper);
    }
  });
}

/**
 * 处理队列中的下一个任务
 */
function processQueue() {
  // 如果有等待的任务，并且活跃任务数量未达到上限，执行下一个任务
  if (pendingTranslations.length > 0 && activeTranslations < getMaxConcurrentTranslations()) {
    const nextTask = pendingTranslations.shift();
    if (nextTask) {
      activeTranslations++;
      nextTask().catch(() => {
        // 错误已在任务内部处理，这里仅防止未捕获的Promise异常
      });
    }
  }
}

/**
 * 清空翻译队列
 * 当页面切换或用户手动停止翻译时调用
 */
export function clearTranslationQueue() {
  
  pendingTranslations = [];
  // 不重置activeTranslations，让活跃的翻译任务自然完成
}

/**
 * 获取队列状态
 * @returns 返回当前队列状态对象
 */
export function getQueueStatus() {
  const maxConcurrent = getMaxConcurrentTranslations();
  return {
    activeTranslations,
    pendingTranslations: pendingTranslations.length,
    maxConcurrent: maxConcurrent,
    isQueueFull: activeTranslations >= maxConcurrent,
    totalTasksInProcess: activeTranslations + pendingTranslations.length
  };
}

/**
 * 获取扩展队列状态（包含进度和统计信息）
 * @returns 返回扩展队列状态对象
 */
export async function getExtendedQueueStatus(): Promise<ExtendedQueueStatus> {
  const maxConcurrent = getMaxConcurrentTranslations();
  const remainingCharacters = totalCharacters - completedCharacters;
  const progressPercentage = totalCharacters > 0 ? (completedCharacters / totalCharacters) * 100 : 0;

  // Ensure translationStatsManager has loaded persisted stats before using it.
  try {
    // Some environments may have already initialized it; awaiting ready is safe.
    // @ts-ignore - access ready promise
    if (translationStatsManager.ready) await (translationStatsManager as any).ready;
  } catch (e) {
    // ignore
  }

  const averageSpeed = translationStatsManager.getAverageSpeed();
  const estimatedRemainingTime = translationStatsManager.getRemainingTime(remainingCharacters);

  return {
    activeTranslations,
    pendingTranslations: pendingTranslations.length,
    maxConcurrent,
    isQueueFull: activeTranslations >= maxConcurrent,
    totalTasksInProcess: activeTranslations + pendingTranslations.length,
    totalCharacters,
    completedCharacters,
    remainingCharacters,
    progressPercentage,
    estimatedRemainingTime,
    averageSpeed
  };
}

/**
 * 重置队列统计信息
 */
export function resetQueueStats(): void {
  totalCharacters = 0;
  completedCharacters = 0;
  currentTasks.clear();
  translationStatsManager.resetStats();
}

/**
 * 检查是否可以添加更多任务
 * 当快速扫描页面，判断是否需要暂停扫描时使用
 */
export function canAcceptMoreTasks(): boolean {
  // 如果等待队列太长，返回false表示需要暂停扫描
  const MAX_QUEUE_LENGTH = getMaxConcurrentTranslations() * 3;
  return pendingTranslations.length < MAX_QUEUE_LENGTH;
}
