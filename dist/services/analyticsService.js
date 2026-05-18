/**
 * analyticsService.js - 数据分析服务
 * 基于 memoryService 的历史数据进行统计分析
 */

(function() {
  'use strict';

  /**
   * 获取总创作数统计（按类型）
   */
  async function getTotalCount() {
    try {
      const generations = await getAllGenerations();
      const stats = {
        total: generations.length,
        image: 0,
        music: 0,
        tts: 0
      };

      generations.forEach(g => {
        if (g.type === 'image') stats.image++;
        else if (g.type === 'music') stats.music++;
        else if (g.type === 'tts') stats.tts++;
      });

      return stats;
    } catch (e) {
      console.error('[Analytics] getTotalCount error:', e);
      return { total: 0, image: 0, music: 0, tts: 0 };
    }
  }

  /**
   * 获取趋势数据（日/周/月）
   * @param {string} period - 'day', 'week', 'month'
   * @returns {Array} 趋势数据点
   */
  async function getTrendData(period = 'day') {
    try {
      const generations = await getAllGenerations();
      const now = Date.now();
      const data = [];
      let interval, format, labelFormat;

      switch (period) {
        case 'week':
          interval = 7 * 24 * 60 * 60 * 1000; // 7天
          format = (ts) => {
            const d = new Date(ts);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          };
          break;
        case 'month':
          interval = 30 * 24 * 60 * 60 * 1000; // 30天
          format = (ts) => {
            const d = new Date(ts);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          };
          break;
        default: // day - 最近7天
          interval = 24 * 60 * 60 * 1000;
          format = (ts) => {
            const d = new Date(ts);
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            return `周${days[d.getDay()]}`;
          };
      }

      const numPoints = period === 'day' ? 7 : period === 'week' ? 4 : 6;
      const startTime = now - interval * numPoints;

      for (let i = 0; i < numPoints; i++) {
        const pointStart = startTime + interval * i;
        const pointEnd = pointStart + interval;
        const label = format(pointStart + interval / 2);

        // 统计该时间段的创作数
        const count = generations.filter(g => {
          return g.timestamp >= pointStart && g.timestamp < pointEnd;
        }).length;

        // 按类型统计
        const imageCount = generations.filter(g =>
          g.timestamp >= pointStart && g.timestamp < pointEnd && g.type === 'image'
        ).length;
        const musicCount = generations.filter(g =>
          g.timestamp >= pointStart && g.timestamp < pointEnd && g.type === 'music'
        ).length;
        const ttsCount = generations.filter(g =>
          g.timestamp >= pointStart && g.timestamp < pointEnd && g.type === 'tts'
        ).length;

        data.push({
          label,
          count,
          image: imageCount,
          music: musicCount,
          tts: ttsCount
        });
      }

      return data;
    } catch (e) {
      console.error('[Analytics] getTrendData error:', e);
      return [];
    }
  }

  /**
   * 获取类型分布数据
   */
  async function getTypeDistribution() {
    try {
      const stats = await getTotalCount();
      const total = stats.total;

      if (total === 0) {
        return [];
      }

      return [
        { type: '图片', typeKey: 'image', count: stats.image, percent: Math.round(stats.image / total * 100) },
        { type: '音乐', typeKey: 'music', count: stats.music, percent: Math.round(stats.music / total * 100) },
        { type: '语音', typeKey: 'tts', count: stats.tts, percent: Math.round(stats.tts / total * 100) }
      ].filter(item => item.count > 0);
    } catch (e) {
      console.error('[Analytics] getTypeDistribution error:', e);
      return [];
    }
  }

  /**
   * 按小时分布数据（热力图数据）
   * @returns {Array} 每小时创作数量 [weekday][hour]
   */
  async function getHourlyDistribution() {
    try {
      const generations = await getAllGenerations();

      // 初始化 7天 x 24小时 的矩阵
      const matrix = [];
      for (let d = 0; d < 7; d++) {
        matrix[d] = [];
        for (let h = 0; h < 24; h++) {
          matrix[d][h] = 0;
        }
      }

      generations.forEach(g => {
        const date = new Date(g.timestamp);
        const day = date.getDay(); // 0=周日
        const hour = date.getHours();
        matrix[day][hour]++;
      });

      // 计算最大值用于热力图归一化
      let maxVal = 0;
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          if (matrix[d][h] > maxVal) maxVal = matrix[d][h];
        }
      }

      return { matrix, maxVal };
    } catch (e) {
      console.error('[Analytics] getHourlyDistribution error:', e);
      return { matrix: [], maxVal: 0 };
    }
  }

  /**
   * 获取高频 Prompt 关键词
   * @param {number} limit - 返回数量
   */
  async function getTopKeywords(limit = 10) {
    try {
      const generations = await getAllGenerations();
      const keywordCount = {};

      generations.forEach(g => {
        (g.tags || []).forEach(tag => {
          keywordCount[tag] = (keywordCount[tag] || 0) + 1;
        });
      });

      return Object.entries(keywordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword, count]) => ({ keyword, count }));
    } catch (e) {
      console.error('[Analytics] getTopKeywords error:', e);
      return [];
    }
  }

  /**
   * 获取活跃天数统计
   */
  async function getActiveDays() {
    try {
      const generations = await getAllGenerations();
      const dateSet = new Set();

      generations.forEach(g => {
        const date = new Date(g.timestamp);
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        dateSet.add(dateStr);
      });

      return dateSet.size;
    } catch (e) {
      console.error('[Analytics] getActiveDays error:', e);
      return 0;
    }
  }

  /**
   * 获取本周创作数
   */
  async function getWeekCount() {
    try {
      const generations = await getAllGenerations();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return generations.filter(g => g.timestamp >= weekAgo).length;
    } catch (e) {
      console.error('[Analytics] getWeekCount error:', e);
      return 0;
    }
  }

  /**
   * 获取仪表盘摘要数据
   */
  async function getDashboardSummary() {
    try {
      const [totalCount, weekCount, activeDays, typeDist] = await Promise.all([
        getTotalCount(),
        getWeekCount(),
        getActiveDays(),
        getTypeDistribution()
      ]);

      return {
        total: totalCount.total,
        weekCount,
        activeDays,
        typeDistribution: typeDist
      };
    } catch (e) {
      console.error('[Analytics] getDashboardSummary error:', e);
      return {
        total: 0,
        weekCount: 0,
        activeDays: 0,
        typeDistribution: []
      };
    }
  }

  /**
   * 获取分析报告文本
   */
  async function getReportText() {
    try {
      const summary = await getDashboardSummary();
      const keywords = await getTopKeywords(5);
      const trend = await getTrendData('day');

      let report = `📊 创作分析报告\n\n`;
      report += `• 总创作数：${summary.total}\n`;
      report += `• 本周创作：${summary.weekCount}\n`;
      report += `• 活跃天数：${summary.activeDays}\n\n`;

      if (summary.typeDistribution.length > 0) {
        report += `📈 类型分布：\n`;
        summary.typeDistribution.forEach(t => {
          report += `  ${t.type}：${t.count}次 (${t.percent}%)\n`;
        });
      }

      if (keywords.length > 0) {
        report += `\n🏷️ 高频关键词：\n`;
        keywords.forEach((k, i) => {
          report += `  ${i + 1}. ${k.keyword} (${k.count}次)\n`;
        });
      }

      return report;
    } catch (e) {
      console.error('[Analytics] getReportText error:', e);
      return '暂无数据';
    }
  }

  // ========== Export Service ==========
  window.AnalyticsService = {
    getTotalCount,
    getTrendData,
    getTypeDistribution,
    getHourlyDistribution,
    getTopKeywords,
    getActiveDays,
    getWeekCount,
    getDashboardSummary,
    getReportText
  };
})();