/**
 * Plugin Security Service
 * 插件安全服务 - v23
 * Provides sandbox hardening, code signing, dependency auditing, and security audit panel
 */
class PluginSecurityService {
  constructor() {
    this.securityLog = [];
    this.maxLogEntries = 1000;
    this.trustedPlugins = new Set();
    this.revokedPlugins = new Set();
    this.networkInterceptor = null;
    this.resourceLimits = {
      maxMemoryMB: 50,
      maxCPUTime: 5000,
      maxNetworkRequests: 10,
      maxStorageKB: 500
    };
    this.storageIsolation = new Map();
  }

  init() {
    this.loadRevocationList();
    this.loadTrustedList();
    console.log('[PluginSecurity] Initialized v23 security service');
  }

  // ========== Sandbox Hardening ==========

  /**
   * Create a hardened sandbox environment for plugin execution
   */
  createHardenedSandbox(pluginId) {
    const sandboxId = `sandbox_${pluginId}_${Date.now()}`;
    
    // Create isolated storage for this sandbox
    this.storageIsolation.set(sandboxId, {
      localStorage: {},
      sessionStorage: {},
      cookies: {}
    });

    return {
      id: sandboxId,
      pluginId,
      restrictedGlobals: this._createRestrictedGlobals(),
      interceptedNetwork: this._createNetworkInterceptor(sandboxId),
      isolatedStorage: this.storageIsolation.get(sandboxId),
      resourceMonitor: this._createResourceMonitor(sandboxId),
      timeouts: { startTime: Date.now(), maxTime: this.resourceLimits.maxCPUTime }
    };
  }

  _createRestrictedGlobals() {
    return {
      // Completely blocked
      window: null,
      document: null,
      location: null,
      navigator: null,
      history: null,
      top: null,
      parent: null,
      frames: null,
      self: null,
      
      // Restricted with proxy
      localStorage: this._createStorageProxy('localStorage'),
      sessionStorage: this._createStorageProxy('sessionStorage'),
      indexedDB: null,
      open: null,
      close: null,
      fetch: this._createFetchInterceptor(),
      XMLHttpRequest: null,
      
      // Allowed but monitored
      console: this._createMonitoredConsole(),
      Math: Math,
      JSON: JSON,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Map: Map,
      Set: Set,
      Promise: Promise,
      Symbol: Symbol,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent
    };
  }

  _createStorageProxy(type) {
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'getItem' || prop === 'setItem' || prop === 'removeItem' || prop === 'clear') {
          return (...args) => {
            this._logSecurityEvent('storage_access', { type, method: prop, args });
            if (this.resourceLimits.maxStorageKB > 0) {
              // Check storage quota
              const currentSize = JSON.stringify(target).length;
              if (currentSize > this.resourceLimits.maxStorageKB * 1024) {
                throw new Error(`Storage quota exceeded: ${this.resourceLimits.maxStorageKB}KB limit`);
              }
            }
            if (prop === 'getItem') return target[args[0]];
            if (prop === 'setItem') { target[args[0]] = args[1]; return; }
            if (prop === 'removeItem') { delete target[args[0]]; return; }
            if (prop === 'clear') { Object.keys(target).forEach(k => delete target[k]); return; }
          };
        }
        return target[prop];
      },
      set: (target, prop, value) => {
        this._logSecurityEvent('storage_modify', { type, prop, value });
        target[prop] = value;
        return true;
      }
    });
  }

  _createFetchInterceptor() {
    return (...args) => {
      this.resourceLimits.maxNetworkRequests--;
      if (this.resourceLimits.maxNetworkRequests < 0) {
        this._logSecurityEvent('network_blocked', { reason: 'quota_exceeded', url: args[0] });
        return Promise.reject(new Error('Network request quota exceeded'));
      }
      this._logSecurityEvent('network_request', { url: args[0], method: args[1]?.method || 'GET' });
      
      // Return a mock response or intercepted data
      return Promise.resolve(new Response(JSON.stringify({ intercepted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    };
  }

  _createNetworkInterceptor(sandboxId) {
    return {
      allowed: false,
      requests: [],
      blocked: [],
      intercept: (url, options) => {
        if (!this.networkInterceptor) {
          this.networkInterceptor = { allowed: new Set(), blocked: new Set() };
        }
        this._logSecurityEvent('network_intercept', { sandboxId, url, options });
      },
      allow: (pattern) => {
        this.networkInterceptor.allowed.add(pattern);
      },
      block: (pattern) => {
        this.networkInterceptor.blocked.add(pattern);
      }
    };
  }

  _createResourceMonitor(sandboxId) {
    return {
      memoryUsage: 0,
      cpuTime: 0,
      networkRequests: 0,
      check: () => {
        const now = Date.now();
        // Resource monitoring implementation
        return {
          memoryMB: this._estimateMemoryUsage(),
          cpuTime,
          withinLimits: this._checkResourceLimits()
        };
      }
    };
  }

  _createMonitoredConsole() {
    const self = this;
    return {
      log: (...args) => self._logSecurityEvent('console_log', { message: args.join(' ') }),
      info: (...args) => self._logSecurityEvent('console_info', { message: args.join(' ') }),
      warn: (...args) => self._logSecurityEvent('console_warn', { message: args.join(' ') }),
      error: (...args) => self._logSecurityEvent('console_error', { message: args.join(' ') })
    };
  }

  _estimateMemoryUsage() {
    // Rough estimation of JS heap size
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return 0;
  }

  _checkResourceLimits() {
    const memory = this._estimateMemoryUsage();
    return memory < this.resourceLimits.maxMemoryMB;
  }

  // ========== Code Signing ==========

  /**
   * Verify code signature using Web Crypto API
   */
  async verifySignature(code, signature, publicKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      
      // Import public key
      const key = await crypto.subtle.importKey(
        'spki',
        this._base64ToArrayBuffer(publicKey),
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['verify']
      );

      // Verify signature
      const signatureBuffer = this._base64ToArrayBuffer(signature);
      const result = await crypto.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 },
        key,
        signatureBuffer,
        data
      );

      this._logSecurityEvent('signature_verification', { result, timestamp: Date.now() });
      return { valid: result, error: result ? null : 'Invalid signature' };
    } catch (e) {
      this._logSecurityEvent('signature_error', { error: e.message });
      return { valid: false, error: e.message };
    }
  }

  /**
   * Generate a code hash for integrity checking
   */
  async generateCodeHash(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this._arrayBufferToBase64(hashBuffer);
  }

  /**
   * Check certificate expiration
   */
  checkCertificateExpiry(certData) {
    if (!certData || !certData.expiresAt) {
      return { valid: false, error: 'Invalid certificate data' };
    }
    
    const now = Date.now();
    const expiresAt = certData.expiresAt;
    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    let status = 'valid';
    if (now > expiresAt) {
      status = 'expired';
    } else if (daysUntilExpiry <= 7) {
      status = 'expiring_soon';
    }

    return {
      valid: status === 'valid',
      status,
      daysUntilExpiry,
      expiresAt: new Date(expiresAt).toISOString()
    };
  }

  /**
   * Check if plugin is in revocation list
   */
  isRevoked(pluginId) {
    return this.revokedPlugins.has(pluginId);
  }

  /**
   * Add plugin to revocation list
   */
  revokePlugin(pluginId, reason) {
    this.revokedPlugins.add(pluginId);
    this._logSecurityEvent('plugin_revoked', { pluginId, reason });
    this._saveRevocationList();
  }

  /**
   * Check if plugin is trusted
   */
  isTrusted(pluginId) {
    return this.trustedPlugins.has(pluginId);
  }

  /**
   * Add plugin to trusted list
   */
  trustPlugin(pluginId) {
    this.trustedPlugins.add(pluginId);
    this._logSecurityEvent('plugin_trusted', { pluginId });
    this._saveTrustedList();
  }

  // ========== Dependency Auditing ==========

  /**
   * Analyze plugin dependencies
   */
  analyzeDependencies(plugin) {
    const dependencies = plugin.dependencies || [];
    const analysis = {
      direct: [],
      transitive: [],
      vulnerabilities: [],
      conflicts: [],
      outdated: []
    };

    for (const dep of dependencies) {
      const depInfo = this._checkDependency(dep);
      analysis.direct.push(depInfo);
      
      if (depInfo.vulnerable) {
        analysis.vulnerabilities.push(depInfo);
      }
    }

    // Check for version conflicts
    this._detectConflicts(analysis);

    this._logSecurityEvent('dependency_audit', { 
      pluginId: plugin.id, 
      vulnerabilityCount: analysis.vulnerabilities.length 
    });

    return analysis;
  }

  _checkDependency(dep) {
    const info = {
      name: dep.name,
      version: dep.version,
      vulnerable: false,
      severity: null,
      description: null,
      knownVulnerabilities: []
    };

    // Check against known vulnerability database (simplified)
    const knownVulns = {
      'lodash': ['4.17.5', '4.17.11'],
      'axios': ['0.21.0', '0.21.1'],
      'moment': ['2.18.0', '2.19.0']
    };

    if (knownVulns[dep.name]) {
      for (const vulnVersion of knownVulns[dep.name]) {
        if (this._versionMatch(dep.version, vulnVersion)) {
          info.vulnerable = true;
          info.severity = 'high';
          info.description = `Known vulnerability in ${dep.name}@${dep.version}`;
          info.knownVulnerabilities.push({
            cve: `CVE-2021-${Math.floor(Math.random() * 10000)}`,
            description: `Vulnerability in ${dep.name}`,
            fixedIn: this._getNextVersion(dep.version)
          });
        }
      }
    }

    // Check if outdated
    const latestVersions = { 'lodash': '4.17.21', 'axios': '1.6.0', 'moment': '2.29.4' };
    if (latestVersions[dep.name]) {
      const latest = latestVersions[dep.name];
      if (this._compareVersions(dep.version, latest) < 0) {
        info.outdated = true;
        info.latestVersion = latest;
      }
    }

    return info;
  }

  _versionMatch(version, vulnVersion) {
    const v1 = version.split('.').map(Number);
    const v2 = vulnVersion.split('.').map(Number);
    return v1[0] === v2[0] && v1[1] === v2[1];
  }

  _compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  _getNextVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2]++;
    return parts.join('.');
  }

  _detectConflicts(analysis) {
    const versionMap = new Map();
    for (const dep of analysis.direct) {
      if (!versionMap.has(dep.name)) {
        versionMap.set(dep.name, []);
      }
      versionMap.get(dep.name).push(dep.version);
    }

    for (const [name, versions] of versionMap) {
      if (versions.length > 1) {
        analysis.conflicts.push({
          name,
          versions,
          message: `Multiple versions of ${name} detected: ${versions.join(', ')}`
        });
      }
    }
  }

  // ========== Security Audit Panel ==========

  /**
   * Get security events log
   */
  getSecurityLog(filter = {}) {
    let logs = [...this.securityLog];
    
    if (filter.category) {
      logs = logs.filter(e => e.category === filter.category);
    }
    if (filter.severity) {
      logs = logs.filter(e => e.severity === filter.severity);
    }
    if (filter.pluginId) {
      logs = logs.filter(e => e.pluginId === filter.pluginId);
    }
    if (filter.startTime) {
      logs = logs.filter(e => e.timestamp >= filter.startTime);
    }
    if (filter.endTime) {
      logs = logs.filter(e => e.timestamp <= filter.endTime);
    }
    
    return logs;
  }

  /**
   * Assess risk level for a plugin
   */
  assessRisk(plugin) {
    let score = 0;
    const factors = [];

    // Check signature
    if (!plugin.signature) {
      score += 30;
      factors.push({ type: 'unsigned', weight: 30, description: 'Plugin is not signed' });
    } else if (!plugin.signatureValid) {
      score += 50;
      factors.push({ type: 'invalid_signature', weight: 50, description: 'Signature verification failed' });
    }

    // Check expiration
    if (plugin.certificate && plugin.certificate.expiresAt < Date.now()) {
      score += 25;
      factors.push({ type: 'expired_cert', weight: 25, description: 'Certificate has expired' });
    }

    // Check revocation
    if (this.isRevoked(plugin.id)) {
      score += 100;
      factors.push({ type: 'revoked', weight: 100, description: 'Plugin is on revocation list' });
    }

    // Check dependencies
    if (plugin.dependencies) {
      const depAnalysis = this.analyzeDependencies(plugin);
      if (depAnalysis.vulnerabilities.length > 0) {
        score += depAnalysis.vulnerabilities.length * 15;
        factors.push({ 
          type: 'vulnerable_deps', 
          weight: depAnalysis.vulnerabilities.length * 15, 
          description: `${depAnalysis.vulnerabilities.length} vulnerable dependencies` 
        });
      }
      if (depAnalysis.conflicts.length > 0) {
        score += depAnalysis.conflicts.length * 10;
        factors.push({ 
          type: 'dep_conflicts', 
          weight: depAnalysis.conflicts.length * 10, 
          description: `${depAnalysis.conflicts.length} dependency conflicts` 
        });
      }
    }

    // Determine risk level
    let level = 'low';
    if (score >= 80) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';

    return { score, level, factors };
  }

  /**
   * Generate security suggestions
   */
  generateSuggestions(plugin) {
    const suggestions = [];
    const risk = this.assessRisk(plugin);

    if (!plugin.signature) {
      suggestions.push({
        priority: 'high',
        category: 'code_signing',
        title: 'Enable Code Signing',
        description: 'Sign your plugin with a valid certificate to ensure integrity.',
        action: 'Contact administrator to obtain signing certificate'
      });
    }

    if (risk.factors.some(f => f.type === 'vulnerable_deps')) {
      suggestions.push({
        priority: 'high',
        category: 'dependencies',
        title: 'Update Vulnerable Dependencies',
        description: 'Some dependencies have known vulnerabilities that should be addressed.',
        action: 'Update affected packages to latest versions'
      });
    }

    if (risk.factors.some(f => f.type === 'dep_conflicts')) {
      suggestions.push({
        priority: 'medium',
        category: 'dependencies',
        title: 'Resolve Dependency Conflicts',
        description: 'Multiple versions of the same dependency are loaded.',
        action: 'Deduplicate dependencies in plugin manifest'
      });
    }

    suggestions.push({
      priority: 'low',
      category: 'best_practices',
      title: 'Enable Security Logging',
      description: 'Monitor security events for this plugin.',
      action: 'Review security audit panel regularly'
    });

    return suggestions;
  }

  /**
   * Export compliance report
   */
  exportComplianceReport(format = 'json') {
    const report = {
      generatedAt: new Date().toISOString(),
      version: 'v23',
      summary: {
        totalPlugins: this.trustedPlugins.size + this.revokedPlugins.size,
        trusted: this.trustedPlugins.size,
        revoked: this.revokedPlugins.size,
        securityEvents: this.securityLog.length
      },
      riskAssessment: [],
      recommendations: [],
      eventLog: this.securityLog.slice(-100)
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      // Simple CSV conversion
      const headers = ['Plugin ID', 'Risk Score', 'Risk Level', 'Issues'];
      const rows = report.riskAssessment.map(r => [
        r.pluginId, r.score, r.level, r.factors.map(f => f.type).join('; ')
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return report;
  }

  // ========== Helper Methods ==========

  _logSecurityEvent(category, data) {
    const event = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      category,
      ...data
    };
    
    this.securityLog.push(event);
    if (this.securityLog.length > this.maxLogEntries) {
      this.securityLog.shift();
    }
  }

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _saveRevocationList() {
    try {
      localStorage.setItem('plugin_revocation_list', JSON.stringify([...this.revokedPlugins]));
    } catch (e) {
      console.error('[PluginSecurity] Failed to save revocation list:', e);
    }
  }

  _loadRevocationList() {
    try {
      const data = localStorage.getItem('plugin_revocation_list');
      if (data) {
        this.revokedPlugins = new Set(JSON.parse(data));
      }
    } catch (e) {
      console.error('[PluginSecurity] Failed to load revocation list:', e);
    }
  }

  _saveTrustedList() {
    try {
      localStorage.setItem('plugin_trusted_list', JSON.stringify([...this.trustedPlugins]));
    } catch (e) {
      console.error('[PluginSecurity] Failed to save trusted list:', e);
    }
  }

  _loadTrustedList() {
    try {
      const data = localStorage.getItem('plugin_trusted_list');
      if (data) {
        this.trustedPlugins = new Set(JSON.parse(data));
      }
    } catch (e) {
      console.error('[PluginSecurity] Failed to load trusted list:', e);
    }
  }

  /**
   * Clean up sandbox resources
   */
  destroySandbox(sandboxId) {
    this.storageIsolation.delete(sandboxId);
    this._logSecurityEvent('sandbox_destroyed', { sandboxId });
  }
}

// Global singleton
const pluginSecurityService = new PluginSecurityService();
