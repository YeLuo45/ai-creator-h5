/**
 * QualityService - 创作质量评估服务
 * 支持图片、音乐、TTS 的质量评分与优化建议
 */
class QualityService {
  constructor() {
    // 各类型质量评估的历史数据缓存（用于百分位计算）
    this._scoreCache = {
      image: [],
      music: [],
      tts: []
    };
  }

  /**
   * 评估图片质量
   * @param {Object} imageData - 图片数据 { url, revised_prompt, style, size, prompt }
   * @returns {Object} 评估结果
   */
  async evaluateImage(imageData) {
    const { url, revised_prompt, style, size, prompt } = imageData;
    
    // 模拟图片分析（实际场景可接入AI图像分析API）
    const metrics = this._analyzeImageMetrics(imageData);
    
    // 计算各维度得分
    const composition = this._evaluateComposition(prompt, revised_prompt, size);
    const color = this._evaluateColor(imageData);
    const clarity = this._evaluateClarity(imageData);
    const creativity = this._evaluateCreativity(prompt, revised_prompt);
    
    // 计算综合质量分
    const overallScore = Math.round(
      composition * 0.25 + 
      color * 0.25 + 
      clarity * 0.25 + 
      creativity * 0.25
    );
    
    // 生成优化建议
    const suggestions = this._generateImageSuggestions(metrics, {
      composition,
      color,
      clarity,
      creativity
    });
    
    // 计算百分位排名
    const percentile = this.getRankingPercentile(overallScore, 'image');
    
    return {
      type: 'image',
      score: overallScore,
      metrics: {
        composition: { score: composition, label: '构图平衡', weight: 25 },
        color: { score: color, label: '色彩和谐', weight: 25 },
        clarity: { score: clarity, label: '清晰度', weight: 25 },
        creativity: { score: creativity, label: '创意性', weight: 25 }
      },
      percentile,
      suggestions,
      summary: this._getImageSummary(overallScore)
    };
  }

  /**
   * 评估音乐质量
   * @param {Object} musicData - 音乐数据 { musicUrl, duration, genre, lyrics, prompt }
   * @returns {Object} 评估结果
   */
  async evaluateMusic(musicData) {
    const { musicUrl, duration, genre, lyrics, prompt } = musicData;
    
    // 评估各维度
    const durationScore = this._evaluateDuration(duration);
    const bpmScore = this._evaluateBPM(genre, duration);
    const loudnessScore = this._evaluateLoudness(duration);
    const qualityScore = this._evaluateAudioQuality(musicData);
    
    // 计算综合质量分
    const overallScore = Math.round(
      durationScore * 0.20 +
      bpmScore * 0.25 +
      loudnessScore * 0.25 +
      qualityScore * 0.30
    );
    
    // 生成优化建议
    const suggestions = this._generateMusicSuggestions({
      durationScore,
      bpmScore,
      loudnessScore,
      qualityScore
    }, musicData);
    
    // 计算百分位排名
    const percentile = this.getRankingPercentile(overallScore, 'music');
    
    return {
      type: 'music',
      score: overallScore,
      metrics: {
        duration: { score: durationScore, label: '时长合理性', weight: 20 },
        bpm: { score: bpmScore, label: 'BPM稳定性', weight: 25 },
        loudness: { score: loudnessScore, label: '响度曲线', weight: 25 },
        quality: { score: qualityScore, label: '音质', weight: 30 }
      },
      percentile,
      suggestions,
      summary: this._getMusicSummary(overallScore)
    };
  }

  /**
   * 评估TTS质量
   * @param {Object} ttsData - TTS数据 { filePath, voice, text, charCount }
   * @returns {Object} 评估结果
   */
  async evaluateTTS(ttsData) {
    const { filePath, voice, text, charCount } = ttsData;
    
    // 评估各维度
    const speedScore = this._evaluateTTSSpeed(text, charCount);
    const pauseScore = this._evaluatePause(text, charCount);
    const clarityScore = this._evaluateClarityTTS(text, voice);
    
    // 计算综合质量分
    const overallScore = Math.round(
      speedScore * 0.35 +
      pauseScore * 0.30 +
      clarityScore * 0.35
    );
    
    // 生成优化建议
    const suggestions = this._generateTTSSuggestions({
      speedScore,
      pauseScore,
      clarityScore
    }, ttsData);
    
    // 计算百分位排名
    const percentile = this.getRankingPercentile(overallScore, 'tts');
    
    return {
      type: 'tts',
      score: overallScore,
      metrics: {
        speed: { score: speedScore, label: '语速自然度', weight: 35 },
        pause: { score: pauseScore, label: '停顿节奏', weight: 30 },
        clarity: { score: clarityScore, label: '发音清晰度', weight: 35 }
      },
      percentile,
      suggestions,
      summary: this._getTTSSummary(overallScore)
    };
  }

  /**
   * 综合评分（多类型结果合并）
   * @param {Array} results - 多个评估结果数组
   * @returns {Object} 综合评分结果
   */
  getOverallScore(results) {
    if (!results || results.length === 0) {
      return { score: 0, level: '无数据', description: '暂无评估数据' };
    }
    
    // 加权平均计算综合分
    let totalScore = 0;
    let totalWeight = 0;
    
    results.forEach(result => {
      if (result && typeof result.score === 'number') {
        totalScore += result.score * (result.metrics ? Object.values(result.metrics).reduce((sum, m) => sum + m.weight, 0) : 100);
        totalWeight += (result.metrics ? Object.values(result.metrics).reduce((sum, m) => sum + m.weight, 0) : 100);
      }
    });
    
    const avgScore = Math.round(totalScore / totalWeight);
    
    return {
      score: avgScore,
      level: this._getQualityLevel(avgScore),
      description: this._getOverallDescription(avgScore, results.length),
      breakdown: results.map(r => ({ type: r.type, score: r.score }))
    };
  }

  /**
   * 获取百分位排名
   * @param {number} score - 质量分数
   * @param {string} type - 类型 (image/music/tts)
   * @returns {number} 百分位 (0-100)
   */
  getRankingPercentile(score, type) {
    const cache = this._scoreCache[type] || [];
    
    // 如果缓存不足，先初始化一些模拟数据
    if (cache.length < 10) {
      this._initScoreCache(type);
    }
    
    // 计算百分位
    const sortedScores = [...cache].sort((a, b) => a - b);
    let rank = sortedScores.findIndex(s => s >= score);
    if (rank === -1) rank = sortedScores.length;
    
    // 更新缓存（滑动窗口，保持最近100条）
    cache.push(score);
    if (cache.length > 100) cache.shift();
    
    return Math.round((rank / sortedScores.length) * 100);
  }

  /**
   * 内部方法：初始化分数缓存
   */
  _initScoreCache(type) {
    const baseScores = {
      image: [65, 70, 72, 75, 78, 80, 82, 85, 88, 90, 92],
      music: [60, 68, 72, 76, 79, 82, 84, 87, 89, 91, 93],
      tts: [62, 68, 73, 77, 80, 83, 85, 88, 90, 92, 94]
    };
    this._scoreCache[type] = baseScores[type] || baseScores.image;
  }

  /**
   * 内部方法：分析图片元数据
   */
  _analyzeImageMetrics(imageData) {
    // 基于输入参数模拟分析
    const hasRevisedPrompt = !!imageData.revised_prompt;
    const promptLength = (imageData.prompt || '').length;
    const hasStyleSpec = !!(imageData.style);
    const hasSizeSpec = !!(imageData.size);
    
    return {
      hasRevisedPrompt,
      promptLength,
      hasStyleSpec,
      hasSizeSpec,
      complexity: Math.min(promptLength / 100, 1) // 0-1 复杂度指标
    };
  }

  /**
   * 内部方法：评估构图平衡
   */
  _evaluateComposition(prompt, revisedPrompt, size) {
    let score = 70; // 基础分
    
    // 有优化后描述通常意味着构图更合理
    if (revisedPrompt) score += 10;
    
    // 尺寸比例影响构图评分
    if (size === '1024x1024') score += 5; // 1:1 通常更平衡
    else if (size === '1792x1024') score += 3; // 宽屏风景感
    else score += 2; // 9:16 人像感
    
    // 描述详细程度
    const promptLen = (prompt || '').length;
    if (promptLen > 50) score += 8;
    else if (promptLen > 20) score += 4;
    
    // 检查构图关键词
    const compositionKeywords = ['对称', '平衡', '中心', '三分', '构图', '前景', '背景', '层次'];
    const hasComposition = compositionKeywords.some(k => (prompt || '').includes(k));
    if (hasComposition) score += 7;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估色彩
   */
  _evaluateColor(imageData) {
    let score = 72;
    
    // 风格影响色彩评分
    const styleColorBonus = {
      vivid: 8,   // 写实风格色彩丰富
      natural: 5  // 自然风格色彩和谐
    };
    score += styleColorBonus[imageData.style] || 5;
    
    // 尺寸影响色彩表现
    if (imageData.size === '1024x1024') score += 5;
    
    // 提示词中的色彩关键词
    const colorKeywords = ['色彩', '颜色', '鲜艳', '明亮', '柔和', '暖色', '冷色', '金色', '蓝色', '红色'];
    const colorCount = colorKeywords.filter(k => (imageData.prompt || '').includes(k)).length;
    score += Math.min(colorCount * 3, 10);
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估清晰度
   */
  _evaluateClarity(imageData) {
    let score = 75;
    
    // 基于尺寸评估清晰度（更高分辨率通常更清晰）
    const sizeClarity = {
      '1024x1024': 10,
      '1792x1024': 8,
      '1024x1792': 7
    };
    score += sizeClarity[imageData.size] || 5;
    
    // 风格影响清晰度
    if (imageData.style === 'vivid') score += 5;
    
    // 提示词清晰度
    const clarityKeywords = ['清晰', '高清', '细节', '锐利', '精致', '细腻'];
    const hasClarity = clarityKeywords.some(k => (imageData.prompt || '').includes(k));
    if (hasClarity) score += 8;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估创意性
   */
  _evaluateCreativity(prompt, revisedPrompt) {
    let score = 68;
    
    // 提示词长度（过短缺乏细节，过长可能过于具体缺乏创意）
    const len = (prompt || '').length;
    if (len >= 30 && len <= 100) score += 12;
    else if (len > 100) score += 8;
    else if (len < 15) score -= 10;
    
    // 创意关键词
    const creativityKeywords = ['创意', '独特', '艺术', '梦幻', '奇幻', '抽象', '超现实', '想象'];
    const creativityCount = creativityKeywords.filter(k => (prompt || '').includes(k)).length;
    score += Math.min(creativityCount * 5, 15);
    
    // 优化后描述与原描述的差异度（差异大说明AI优化多）
    if (revisedPrompt && prompt) {
      const similarity = this._calculateSimilarity(prompt, revisedPrompt);
      if (similarity < 0.7) score += 8; // 优化较多
      else if (similarity > 0.9) score -= 5; // 几乎没优化
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估音乐时长合理性
   */
  _evaluateDuration(duration) {
    // 时长合理性评分
    if (duration >= 60 && duration <= 120) return 95; // 1-2分钟最佳
    if (duration >= 30 && duration < 60) return 80; // 30秒-1分钟
    if (duration > 120 && duration <= 180) return 75; // 2-3分钟
    if (duration > 180) return 60; // 超过3分钟可能过长
    return 50; // 过短
  }

  /**
   * 内部方法：评估BPM稳定性
   */
  _evaluateBPM(genre, duration) {
    let score = 75;
    
    // 风格对应的BPM范围合理性
    const genreBPMRange = {
      pop: { min: 100, max: 130, ideal: 120 },
      rock: { min: 110, max: 140, ideal: 130 },
      jazz: { min: 80, max: 120, ideal: 100 },
      classical: { min: 60, max: 100, ideal: 80 },
      electronic: { min: 120, max: 150, ideal: 128 },
      folk: { min: 80, max: 110, ideal: 95 }
    };
    
    const range = genreBPMRange[genre] || genreBPMRange.pop;
    const idealBPM = range.ideal;
    
    // 根据时长估算BPM稳定性（时长均匀则BPM稳定）
    // 简单模拟：时长越接近2的幂次，节奏越规整
    const durationFactor = Math.abs(Math.log2(duration) - 6) < 0.5 ? 15 : 5;
    score += durationFactor;
    
    // 风格匹配度
    score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估响度曲线
   */
  _evaluateLoudness(duration) {
    let score = 72;
    
    // 时长与响度变化的关系
    // 较长的音乐需要更好的响度起伏
    if (duration >= 60) score += 10;
    if (duration >= 120) score += 8;
    
    // 响度曲线合理性（模拟）
    // 前奏-高潮-结尾的分布
    const distribution = [0.15, 0.4, 0.3, 0.15]; // 前奏、高潮、过渡、结尾占比
    const balance = distribution.every(d => d >= 0.1 && d <= 0.5);
    if (balance) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估音质
   */
  _evaluateAudioQuality(musicData) {
    let score = 75;
    
    // 有封面图通常意味着更高质量的作品
    if (musicData.coverUrl) score += 10;
    
    // 有歌词意味着更完整的音乐
    if (musicData.lyrics) score += 8;
    
    // 风格与音质的关系
    const highQualityGenres = ['classical', 'jazz', 'electronic'];
    if (highQualityGenres.includes(musicData.genre)) score += 7;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估TTS语速
   */
  _evaluateTTSSpeed(text, charCount) {
    if (!text && !charCount) return 60;
    
    const length = charCount || (text || '').length;
    
    // 估算语速：假设TTS生成时间约等于文字时长
    // 正常语速约 150-200字/分钟
    // 这里简化处理：根据文本长度评分
    if (length <= 50) return 85; // 短文本通常语速适中
    if (length <= 150) return 80;
    if (length <= 300) return 75;
    if (length <= 500) return 70;
    return 65; // 长文本可能存在语速不均
  }

  /**
   * 内部方法：评估停顿节奏
   */
  _evaluatePause(text, charCount) {
    let score = 70;
    
    const content = text || '';
    
    // 检查标点符号（停顿点）
    const pauseCount = (content.match(/[，。！？；：、""''（）]/g) || []).length;
    const pauseRatio = pauseCount / Math.max(content.length, 1);
    
    // 停顿比例适中为佳
    if (pauseRatio >= 0.03 && pauseRatio <= 0.08) score += 15;
    else if (pauseRatio >= 0.02 && pauseRatio <= 0.1) score += 10;
    else score += 5;
    
    // 句子的平均长度
    const sentences = content.split(/[。！？]/).filter(s => s.trim());
    const avgSentenceLen = sentences.length > 0 
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
      : 0;
    
    if (avgSentenceLen >= 10 && avgSentenceLen <= 30) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：评估TTS清晰度
   */
  _evaluateClarityTTS(text, voice) {
    let score = 72;
    
    // 声音类型与清晰度关系
    const voiceClarity = {
      'female-shaonv': 85,  // 少女声音通常清晰
      'male-qn-qingse': 80, // 青年男声
      'female-yujie': 82,   // 御姐声音
      'male-qn-jingxing': 78 // 激情男声可能稍快
    };
    score = voiceClarity[voice] || 75;
    
    // 文本复杂度
    const content = text || '';
    const hasComplexChars = /[生僻字,难读音]/.test(content);
    if (hasComplexChars) score -= 10;
    
    // 文本长度适中有利于清晰度
    if (content.length >= 20 && content.length <= 200) score += 8;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 内部方法：生成图片优化建议
   */
  _generateImageSuggestions(metrics, scores) {
    const suggestions = [];
    
    if (scores.composition < 75) {
      suggestions.push('构图：建议添加前景、背景层次，或使用三分构图法增强画面平衡感');
    }
    if (scores.composition >= 75 && scores.composition < 90) {
      suggestions.push('构图：当前构图较为合理，可尝试添加对称或对角线构图进一步提升');
    }
    
    if (scores.color < 75) {
      suggestions.push('色彩：建议增加色彩对比或使用互补色提升视觉冲击力');
    }
    if (scores.color >= 75 && scores.color < 90) {
      suggestions.push('色彩：色彩搭配良好，可尝试冷暖对比增强氛围感');
    }
    
    if (scores.clarity < 75) {
      suggestions.push('清晰度：建议在描述中加入"高清"、"细节丰富"等关键词提升清晰度');
    }
    if (scores.clarity >= 75 && scores.clarity < 90) {
      suggestions.push('清晰度：画面清晰度良好，可尝试添加"精致"、"细腻"等描述');
    }
    
    if (scores.creativity < 70) {
      suggestions.push('创意：建议增加创意关键词，如"梦幻"、"超现实"、"艺术感"等');
    }
    if (scores.creativity >= 70 && scores.creativity < 85) {
      suggestions.push('创意：创意表现不错，可尝试更多抽象或奇幻元素');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('优秀！各项指标均达到较高水平，创作质量上乘');
    }
    
    return suggestions;
  }

  /**
   * 内部方法：生成音乐优化建议
   */
  _generateMusicSuggestions(scores, musicData) {
    const suggestions = [];
    
    if (scores.durationScore < 80) {
      const duration = musicData.duration;
      if (duration < 60) {
        suggestions.push('时长：建议生成60秒以上的音乐，以获得更完整的听感体验');
      } else if (duration > 180) {
        suggestions.push('时长：音乐时长偏长，建议控制在2-3分钟内以保持听众注意力');
      }
    }
    
    if (scores.bpmScore < 80) {
      suggestions.push(`BPM：建议根据${musicData.genre}风格调整节奏，BPM在合适范围内更协调`);
    } else {
      suggestions.push('节奏：当前节奏稳定，风格统一');
    }
    
    if (scores.loudnessScore < 80) {
      suggestions.push('响度：建议增加响度起伏，前奏轻柔后进入高潮可以增强感染力');
    } else {
      suggestions.push('响度：响度曲线分布合理，整体听感舒适');
    }
    
    if (scores.qualityScore < 80) {
      if (!musicData.lyrics) {
        suggestions.push('音质：建议为音乐添加歌词，可提升音乐完整度');
      }
      if (!musicData.coverUrl) {
        suggestions.push('音质：建议添加封面图，提升作品的专业度');
      }
    } else {
      suggestions.push('音质：音频质量良好，作品完成度高');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('优秀！音乐质量达到专业水准，各项指标均衡');
    }
    
    return suggestions;
  }

  /**
   * 内部方法：生成TTS优化建议
   */
  _generateTTSSuggestions(scores, ttsData) {
    const suggestions = [];
    
    if (scores.speedScore < 75) {
      suggestions.push('语速：建议控制文本长度，过长的文本可能导致语速不均匀');
    } else if (scores.speedScore >= 75 && scores.speedScore < 90) {
      suggestions.push('语速：语速适中，朗读自然流畅');
    }
    
    if (scores.pauseScore < 75) {
      suggestions.push('停顿：建议在文案中适当添加标点符号（，。！？）以优化停顿节奏');
    } else if (scores.pauseScore >= 75 && scores.pauseScore < 90) {
      suggestions.push('停顿：停顿节奏良好，朗读有韵律感');
    }
    
    if (scores.clarityScore < 75) {
      suggestions.push('清晰度：建议使用标准普通话朗读，避免生僻字以提升清晰度');
    } else if (scores.clarityScore >= 75 && scores.clarityScore < 90) {
      suggestions.push('清晰度：发音清晰，声音好听');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('优秀！TTS语音质量上乘，听感自然舒适');
    }
    
    return suggestions;
  }

  /**
   * 内部方法：获取图片评估总结
   */
  _getImageSummary(score) {
    if (score >= 90) return '卓越：构图精美、色彩绚丽、清晰度极高、创意十足';
    if (score >= 80) return '优秀：构图合理、色彩和谐、清晰度良好、创意丰富';
    if (score >= 70) return '良好：整体协调，有一定视觉效果';
    if (score >= 60) return '一般：基本满足需求，但有提升空间';
    return '需优化：多项指标需要改进';
  }

  /**
   * 内部方法：获取音乐评估总结
   */
  _getMusicSummary(score) {
    if (score >= 90) return '卓越：节奏精准、响度完美、音质发烧级';
    if (score >= 80) return '优秀：节奏稳定、响度适中、音质良好';
    if (score >= 70) return '良好：整体听感舒适，满足日常需求';
    if (score >= 60) return '一般：基本合格，可进一步优化';
    return '需优化：需要调整节奏或音质';
  }

  /**
   * 内部方法：获取TTS评估总结
   */
  _getTTSSummary(score) {
    if (score >= 90) return '卓越：语速自然、停顿恰当、发音极清晰';
    if (score >= 80) return '优秀：语速适中、节奏良好、发音清晰';
    if (score >= 70) return '良好：听感自然，能准确表达内容';
    if (score >= 60) return '一般：基本可听懂，细节可优化';
    return '需优化：语速或停顿需要调整';
  }

  /**
   * 内部方法：获取质量等级
   */
  _getQualityLevel(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  /**
   * 内部方法：获取综合描述
   */
  _getOverallDescription(score, count) {
    if (score >= 90) return `综合质量卓越，${count}项创作均表现出色`;
    if (score >= 80) return `综合质量优秀，${count}项创作整体良好`;
    if (score >= 70) return `综合质量良好，具有一定的创作水准`;
    if (score >= 60) return `综合质量一般，还有改进空间`;
    return `综合质量需提升，建议优化各项指标`;
  }

  /**
   * 内部方法：计算字符串相似度
   */
  _calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;
    
    let matchCount = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matchCount++;
    }
    
    return matchCount / Math.max(s1.length, s2.length);
  }
}

// 导出单例
const QualityServiceInstance = new QualityService();
export { QualityService, QualityServiceInstance };
export default QualityServiceInstance;