/**
 * Variable Inspector Service v11
 * 变量监察服务 - 追踪和管理工作流执行过程中的变量
 */
class VariableInspector {
  constructor() {
    this.variables = new Map(); // name -> { value, type, timestamp, changed }
    this.history = []; // 变更历史
    this.maxHistory = 100;
    this.listeners = {
      variableChange: []
    };
  }

  // 变量管理
  setVariable(name, value, type = null) {
    const oldValue = this.variables.get(name);
    const oldVal = oldValue ? oldValue.value : undefined;
    
    // 检测类型
    const detectedType = type || this._detectType(value);
    
    // 创建变量记录
    const record = {
      value,
      type: detectedType,
      timestamp: Date.now(),
      changed: true
    };
    
    this.variables.set(name, record);
    
    // 追踪变更
    if (oldValue === undefined || oldVal !== value) {
      this.trackChange(name, oldVal, value);
    }
    
    this._emit('variableChange', {
      name,
      oldValue: oldVal,
      newValue: value,
      type: detectedType
    });
  }

  getVariable(name) {
    const record = this.variables.get(name);
    return record ? record.value : undefined;
  }

  getAllVariables() {
    const result = {};
    this.variables.forEach((record, name) => {
      result[name] = record.value;
    });
    return result;
  }

  getAllVariablesWithMeta() {
    const result = {};
    this.variables.forEach((record, name) => {
      result[name] = { ...record };
    });
    return result;
  }

  clearVariables() {
    this.variables.clear();
    this.history = [];
    this._emit('variableChange', { type: 'clear' });
  }

  // 变更追踪
  trackChange(name, oldValue, newValue) {
    const changeRecord = {
      name,
      oldValue,
      newValue,
      timestamp: Date.now()
    };
    
    this.history.push(changeRecord);
    
    // 限制历史长度
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // 标记变量为已变更
    const record = this.variables.get(name);
    if (record) {
      record.changed = true;
    }
  }

  getChangedVariables() {
    const changed = [];
    this.variables.forEach((record, name) => {
      if (record.changed) {
        changed.push({ name, ...record });
      }
    });
    return changed;
  }

  clearChangeFlags() {
    this.variables.forEach(record => {
      record.changed = false;
    });
  }

  // 获取历史
  getHistory(name = null) {
    if (name) {
      return this.history.filter(h => h.name === name);
    }
    return [...this.history];
  }

  // 类型检测
  _detectType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'function') return 'function';
    return 'unknown';
  }

  // 格式化值用于显示
  formatValue(value, maxLength = 100) {
    if (value === null || value === undefined) {
      return String(value);
    }
    
    const str = typeof value === 'object' 
      ? JSON.stringify(value, null, 2)
      : String(value);
    
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  }

  // 事件监听
  onVariableChange(callback) {
    this.listeners.variableChange.push(callback);
  }

  _emit(event, data) {
    this.listeners.variableChange.forEach(cb => cb(data));
  }
}

// 导出
window.VariableInspector = VariableInspector;