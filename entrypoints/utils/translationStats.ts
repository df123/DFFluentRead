import { storage } from '@wxt-dev/storage';

/**
 * 翻译速度统计信息
 */
export interface TranslationSpeedStats {
  /** 总翻译字符数 */
  totalCharacters: number;
  /** 总翻译时间（毫秒） */
  totalTimeMs: number;
  /** 平均速度（字符/秒） */
  averageSpeed: number;
  /** 历史翻译任务数量 */
  taskCount: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 翻译任务信息
 */
export interface TranslationTaskInfo {
  /** 任务ID */
  taskId: string;
  /** 翻译字符数 */
  characterCount: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 翻译时间（毫秒） */
  translationTime?: number;
}

/**
 * 历史速度数据存储结构
 */
export interface SpeedHistory {
  /** 历史速度统计 */
  stats: TranslationSpeedStats;
  /** 最近的任务记录（用于计算平均速度） */
  recentTasks: TranslationTaskInfo[];
  /** 最大记录任务数 */
  maxTaskRecords: number;
}

/**
 * 翻译统计管理器
 * 负责速度计算、数据持久化和进度计算
 */
export class TranslationStatsManager {
  private static readonly STORAGE_KEY = 'translation-speed-history';
  private static readonly DEFAULT_SPEED = 20; // 默认速度 20 字符/秒
  private static readonly MAX_TASK_RECORDS = 50; // 最大记录任务数

  private currentStats: TranslationSpeedStats = {
    totalCharacters: 0,
    totalTimeMs: 0,
    averageSpeed: TranslationStatsManager.DEFAULT_SPEED,
    taskCount: 0,
    lastUpdated: Date.now()
  };

  private currentTasks: Map<string, TranslationTaskInfo> = new Map();

  /**
   * 初始化统计管理器
   */
  async initialize(): Promise<void> {
    await this.loadSpeedHistory();
  }

  /**
   * 开始翻译任务
   * @param taskId 任务ID
   * @param characterCount 字符数
   */
  startTranslation(taskId: string, characterCount: number): void {
    const taskInfo: TranslationTaskInfo = {
      taskId,
      characterCount,
      startTime: Date.now()
    };
    this.currentTasks.set(taskId, taskInfo);
  }

  /**
   * 完成翻译任务
   * @param taskId 任务ID
   */
  completeTranslation(taskId: string): void {
    const taskInfo = this.currentTasks.get(taskId);
    if (!taskInfo) return;

    const endTime = Date.now();
    const translationTime = endTime - taskInfo.startTime;

    taskInfo.endTime = endTime;
    taskInfo.translationTime = translationTime;

    // 更新统计信息
    this.updateSpeedStats(taskInfo);

    // 从当前任务中移除
    this.currentTasks.delete(taskId);
  }

  /**
   * 更新速度统计
   * @param taskInfo 任务信息
   */
  private updateSpeedStats(taskInfo: TranslationTaskInfo): void {
    if (!taskInfo.translationTime || taskInfo.translationTime <= 0) return;

    // 更新总字符数和总时间
    this.currentStats.totalCharacters += taskInfo.characterCount;
    this.currentStats.totalTimeMs += taskInfo.translationTime;
    this.currentStats.taskCount += 1;
    this.currentStats.lastUpdated = Date.now();

    // 计算平均速度（字符/秒）
    if (this.currentStats.totalTimeMs > 0) {
      this.currentStats.averageSpeed = Math.round(
        (this.currentStats.totalCharacters / this.currentStats.totalTimeMs) * 1000
      );
    }

    // 保存更新后的统计信息
    this.saveSpeedHistory();
  }

  /**
   * 获取当前平均速度
   * @returns 平均速度（字符/秒）
   */
  getAverageSpeed(): number {
    console.log('Current average speed:', this.currentStats.averageSpeed);
    return this.currentStats.averageSpeed;
  }

  /**
   * 获取剩余时间估算
   * @param remainingCharacters 剩余字符数
   * @returns 剩余时间（秒）
   */
  getRemainingTime(remainingCharacters: number): number {
    const speed = this.getAverageSpeed();
    if (speed <= 0) return 0;
    
    return Math.ceil(remainingCharacters / speed);
  }

  /**
   * 获取总体进度
   * @param completedCharacters 已完成字符数
   * @param totalCharacters 总字符数
   * @returns 进度百分比（0-100）
   */
  getOverallProgress(completedCharacters: number, totalCharacters: number): number {
    if (totalCharacters <= 0) return 0;
    
    const progress = (completedCharacters / totalCharacters) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * 获取当前统计信息
   * @returns 当前统计信息
   */
  getStats(): TranslationSpeedStats {
    return { ...this.currentStats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.currentStats = {
      totalCharacters: 0,
      totalTimeMs: 0,
      averageSpeed: TranslationStatsManager.DEFAULT_SPEED,
      taskCount: 0,
      lastUpdated: Date.now()
    };
    this.currentTasks.clear();
    this.saveSpeedHistory();
  }

  /**
   * 保存速度历史数据
   */
  private async saveSpeedHistory(): Promise<void> {
    const history: SpeedHistory = {
      stats: this.currentStats,
      recentTasks: Array.from(this.currentTasks.values()),
      maxTaskRecords: TranslationStatsManager.MAX_TASK_RECORDS
    };

    await storage.setItem(`local:${TranslationStatsManager.STORAGE_KEY}`, history);
  }

  /**
   * 加载速度历史数据
   */
  private async loadSpeedHistory(): Promise<void> {
    try {
      const history = await storage.getItem<SpeedHistory>(`local:${TranslationStatsManager.STORAGE_KEY}`);
      
      if (history && history.stats) {
        this.currentStats = history.stats;
        
        // 恢复当前任务
        if (history.recentTasks) {
          history.recentTasks.forEach((task: TranslationTaskInfo) => {
            if (!task.endTime) {
              this.currentTasks.set(task.taskId, task);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load translation speed history:', error);
      // 使用默认统计信息
      this.currentStats = {
        totalCharacters: 0,
        totalTimeMs: 0,
        averageSpeed: TranslationStatsManager.DEFAULT_SPEED,
        taskCount: 0,
        lastUpdated: Date.now()
      };
    }
  }
}

// 创建全局统计管理器实例
export const translationStatsManager = new TranslationStatsManager();
