/**
 * Workflow Logger UI Adapter
 * 将 WorkflowLogger 与 UI 日志面板集成
 */
(function() {
  let logContainer = null;
  let logCountEl = null;

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function appendLog(entry) {
    if (!logContainer) return;
    
    const div = document.createElement('div');
    div.className = 'log-entry';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = formatTime(entry.timestamp);
    
    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-message ' + (entry.level || 'info');
    msgSpan.textContent = entry.message;
    
    div.appendChild(timeSpan);
    div.appendChild(msgSpan);
    logContainer.appendChild(div);
    
    // Auto-scroll
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Update count
    if (logCountEl) {
      const count = logContainer.querySelectorAll('.log-entry').length;
      logCountEl.textContent = count;
    }
  }

  window.WorkflowLoggerUI = {
    init(containerEl, countEl) {
      logContainer = containerEl;
      logCountEl = countEl;
      
      // Subscribe to logger updates
      WorkflowLogger.subscribe((logs) => {
        if (!logContainer) return;
        
        // Clear and re-render all logs
        logContainer.innerHTML = '';
        logs.forEach(entry => {
          const div = document.createElement('div');
          div.className = 'log-entry';
          
          const timeSpan = document.createElement('span');
          timeSpan.className = 'log-time';
          timeSpan.textContent = formatTime(entry.timestamp);
          
          const msgSpan = document.createElement('span');
          msgSpan.className = 'log-message ' + (entry.level || 'info');
          msgSpan.textContent = entry.message;
          
          div.appendChild(timeSpan);
          div.appendChild(msgSpan);
          logContainer.appendChild(div);
        });
        
        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Update count
        if (logCountEl) {
          logCountEl.textContent = logs.length;
        }
      });
    },
    
    clear() {
      if (logContainer) {
        logContainer.innerHTML = '';
      }
      if (logCountEl) {
        logCountEl.textContent = '0';
      }
    }
  };
})();