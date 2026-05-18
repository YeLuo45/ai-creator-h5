/**
 * Workflow Loop Service
 * 循环执行器 - For/While/Do-While 循环节点执行
 */
const WorkflowLoop = {
  // 执行循环
  async execute(loopNode, context, executor) {
    const { type, variable, count, condition, maxIterations = 100 } = loopNode.config;
    const iterations = [];
    let result = { success: true, output: {} };

    switch (type) {
      case 'for':
        result = await this.executeFor(loopNode, context, executor, variable, count, maxIterations, iterations);
        break;
      case 'while':
        result = await this.executeWhile(loopNode, context, executor, variable, condition, maxIterations, iterations);
        break;
      case 'doWhile':
        result = await this.executeDoWhile(loopNode, context, executor, variable, condition, maxIterations, iterations);
        break;
    }

    return { ...result, iterations };
  },

  // For循环执行
  async executeFor(node, context, executor, variable, count, maxIterations, iterations) {
    const loopCount = parseInt(count) || 3;
    const safeCount = Math.min(loopCount, maxIterations);

    WorkflowLogger.info(`[循环] For ${variable} = 0 to ${safeCount - 1}`, node.id);

    for (let i = 0; i < safeCount; i++) {
      const iterContext = { ...context, [variable]: i };
      iterations.push({ index: i, context: iterContext });
      WorkflowLogger.info(`[循环] ${variable} = ${i}`, node.id);

      // 执行循环体（由调用方提供节点列表）
      if (node.bodyNodes && node.bodyNodes.length > 0) {
        for (const bodyNode of node.bodyNodes) {
          const bodyResult = await executor(bodyNode, iterContext);
          if (!bodyResult.success) return bodyResult;
        }
      }
    }

    WorkflowLogger.success(`[循环] For 完成，${safeCount} 次迭代`, node.id);
    return { success: true, output: { iterations: safeCount } };
  },

  // While循环执行
  async executeWhile(node, context, executor, variable, condition, maxIterations, iterations) {
    let i = 0;
    WorkflowLogger.info(`[循环] While ${condition}`, node.id);

    while (i < maxIterations) {
      // 简单条件解析
      const shouldContinue = this.evaluateCondition(condition, { ...context, [variable]: i });
      if (!shouldContinue) break;

      iterations.push({ index: i, context: { ...context, [variable]: i } });
      WorkflowLogger.info(`[循环] While 迭代 ${i + 1}`, node.id);

      if (node.bodyNodes && node.bodyNodes.length > 0) {
        for (const bodyNode of node.bodyNodes) {
          const bodyResult = await executor(bodyNode, context);
          if (!bodyResult.success) return bodyResult;
        }
      }

      i++;
    }

    if (i >= maxIterations) {
      WorkflowLogger.warning(`[循环] While 达到最大迭代次数 ${maxIterations}`, node.id);
    }

    WorkflowLogger.success(`[循环] While 完成，${i} 次迭代`, node.id);
    return { success: true, output: { iterations: i } };
  },

  // Do-While循环执行
  async executeDoWhile(node, context, executor, variable, condition, maxIterations, iterations) {
    let i = 0;
    WorkflowLogger.info(`[循环] Do-While ${condition}`, node.id);

    do {
      iterations.push({ index: i, context: { ...context, [variable]: i } });
      WorkflowLogger.info(`[循环] Do-While 迭代 ${i + 1}`, node.id);

      if (node.bodyNodes && node.bodyNodes.length > 0) {
        for (const bodyNode of node.bodyNodes) {
          const bodyResult = await executor(bodyNode, context);
          if (!bodyResult.success) return bodyResult;
        }
      }

      i++;
    } while (i < maxIterations && this.evaluateCondition(condition, { ...context, [variable]: i }));

    WorkflowLogger.success(`[循环] Do-While 完成，${i} 次迭代`, node.id);
    return { success: true, output: { iterations: i } };
  },

  // 条件评估（简单实现）
  evaluateCondition(condition, context) {
    if (!condition) return false;

    // 支持简单比较：变量 op 值
    const match = condition.match(/(\w+)\s*(<=|>=|==|!=|>|<)\s*(.+)/);
    if (match) {
      const [, varName, op, value] = match;
      const ctxValue = context[varName];
      const cmpValue = isNaN(value) ? value : parseFloat(value);

      switch (op) {
        case '==': return ctxValue == cmpValue;
        case '!=': return ctxValue != cmpValue;
        case '>': return ctxValue > cmpValue;
        case '<': return ctxValue < cmpValue;
        case '>=': return ctxValue >= cmpValue;
        case '<=': return ctxValue <= cmpValue;
      }
    }

    // 支持 JS 表达式（需在安全范围内）
    try {
      const keys = Object.keys(context);
      const vals = Object.values(context);
      const fn = new Function(...keys, `return ${condition}`);
      return fn(...vals);
    } catch {
      return false;
    }
  }
};