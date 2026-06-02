/**
 * cryptoService.js - End-to-End Encryption Service
 * Uses Web Crypto API with AES-256-GCM for encryption/decryption
 * Provides lock/unlock functionality with auto-lock timeout
 */

const CryptoService = {
  // Encryption state
  _isLocked: true,
  _encryptionKey: null,
  _autoLockTimer: null,
  _lastActivity: Date.now(),
  
  // Configuration
  _config: {
    autoLockTimeout: 300000, // 5 minutes in ms
    keyIterations: 100000,
    saltLength: 16,
    ivLength: 12,
  },

  /**
   * Generate a random encryption key
   */
  async generateKey() {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
    return key;
  },

  /**
   * Derive a key from password using PBKDF2
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive AES-GCM key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this._config.keyIterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  },

  /**
   * Encrypt plaintext data
   */
  async encrypt(plaintext, key) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this._config.ivLength));
      
      // Encrypt data
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data
      );
      
      // Combine IV + ciphertext and return as base64
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);
      
      return this._arrayBufferToBase64(combined.buffer);
    } catch (e) {
      console.error('[CryptoService] Encryption error:', e);
      throw new Error('Encryption failed');
    }
  },

  /**
   * Decrypt ciphertext data
   */
  async decrypt(ciphertextBase64, key) {
    try {
      // Decode base64 to array
      const combined = this._base64ToArrayBuffer(ciphertextBase64);
      const combinedArray = new Uint8Array(combined);
      
      // Extract IV and ciphertext
      const iv = combinedArray.slice(0, this._config.ivLength);
      const ciphertext = combinedArray.slice(this._config.ivLength);
      
      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext
      );
      
      // Decode and return plaintext
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      console.error('[CryptoService] Decryption error:', e);
      throw new Error('Decryption failed');
    }
  },

  /**
   * Initialize encryption with password
   */
  async init(password) {
    try {
      // Check if we have an existing salt
      let salt = localStorage.getItem('crypto_salt');
      
      if (salt) {
        // Existing salt - derive key and verify password
        salt = this._base64ToArrayBuffer(salt);
        const key = await this.deriveKey(password, new Uint8Array(salt));
        
        // Verify by checking if we can decrypt the test value
        const testEncrypted = localStorage.getItem('crypto_test');
        if (testEncrypted) {
          try {
            await this.decrypt(testEncrypted, key);
          } catch (e) {
            // Password verification failed
            localStorage.removeItem('crypto_salt');
            localStorage.removeItem('crypto_test');
            salt = null;
          }
        }
        
        if (!localStorage.getItem('crypto_salt')) {
          // Salt was removed, recreate it
          salt = crypto.getRandomValues(new Uint8Array(this._config.saltLength));
          localStorage.setItem('crypto_salt', this._arrayBufferToBase64(salt.buffer));
          
          // Create test value for password verification
          const testKey = await this.deriveKey(password, salt);
          const testEncrypted = await this.encrypt('crypto_test_value', testKey);
          localStorage.setItem('crypto_test', testEncrypted);
          
          this._encryptionKey = testKey;
          this._isLocked = false;
          this._startAutoLockTimer();
          return { success: true, isNew: true };
        }
        
        this._encryptionKey = key;
        this._isLocked = false;
        this._startAutoLockTimer();
        return { success: true, isNew: false };
      } else {
        // No existing salt - create new encryption setup
        salt = crypto.getRandomValues(new Uint8Array(this._config.saltLength));
        localStorage.setItem('crypto_salt', this._arrayBufferToBase64(salt.buffer));
        
        // Create test value for password verification
        const key = await this.deriveKey(password, salt);
        const testEncrypted = await this.encrypt('crypto_test_value', key);
        localStorage.setItem('crypto_test', testEncrypted);
        
        this._encryptionKey = key;
        this._isLocked = false;
        this._startAutoLockTimer();
        return { success: true, isNew: true };
      }
    } catch (e) {
      console.error('[CryptoService] Init error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Lock the encryption (clear key from memory)
   */
  lock() {
    this._encryptionKey = null;
    this._isLocked = true;
    this._stopAutoLockTimer();
    this._broadcastStateChange();
    console.log('[CryptoService] Locked');
  },

  /**
   * Unlock with password
   */
  async unlock(password) {
    try {
      const saltBase64 = localStorage.getItem('crypto_salt');
      if (!saltBase64) {
        return { success: false, error: 'No encryption configured' };
      }
      
      const salt = new Uint8Array(this._base64ToArrayBuffer(saltBase64));
      const key = await this.deriveKey(password, salt);
      
      // Verify password by decrypting test value
      const testEncrypted = localStorage.getItem('crypto_test');
      try {
        await this.decrypt(testEncrypted, key);
      } catch (e) {
        return { success: false, error: 'Invalid password' };
      }
      
      this._encryptionKey = key;
      this._isLocked = false;
      this._startAutoLockTimer();
      this._broadcastStateChange();
      console.log('[CryptoService] Unlocked');
      
      return { success: true };
    } catch (e) {
      console.error('[CryptoService] Unlock error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Check if encryption is enabled
   */
  isEnabled() {
    return localStorage.getItem('crypto_salt') !== null;
  },

  /**
   * Check if currently locked
   */
  isLocked() {
    return this._isLocked;
  },

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      enabled: this.isEnabled(),
      locked: this._isLocked,
      autoLockTimeout: this._config.autoLockTimeout,
    };
  },

  /**
   * Encrypt sensitive data and store
   */
  async encryptAndStore(keyName, data) {
    if (this._isLocked || !this._encryptionKey) {
      throw new Error('Cannot encrypt: vault is locked');
    }
    
    const jsonString = JSON.stringify(data);
    const encrypted = await this.encrypt(jsonString, this._encryptionKey);
    localStorage.setItem(`encrypted_${keyName}`, encrypted);
    return encrypted;
  },

  /**
   * Retrieve and decrypt data
   */
  async retrieveAndDecrypt(keyName) {
    if (this._isLocked || !this._encryptionKey) {
      throw new Error('Cannot decrypt: vault is locked');
    }
    
    const encrypted = localStorage.getItem(`encrypted_${keyName}`);
    if (!encrypted) {
      return null;
    }
    
    const decrypted = await this.decrypt(encrypted, this._encryptionKey);
    return JSON.parse(decrypted);
  },

  /**
   * Enable encryption with new password
   */
  async enableEncryption(password) {
    return await this.init(password);
  },

  /**
   * Disable encryption (dangerous - clears all encrypted data)
   */
  async disableEncryption() {
    if (!this._isLocked) {
      // Clear encrypted data
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('encrypted_')) {
          localStorage.removeItem(key);
        }
      }
    }
    
    // Clear encryption keys
    localStorage.removeItem('crypto_salt');
    localStorage.removeItem('crypto_test');
    
    this.lock();
    console.log('[CryptoService] Encryption disabled');
    return { success: true };
  },

  /**
   * Change encryption password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      // First verify old password
      const saltBase64 = localStorage.getItem('crypto_salt');
      if (!saltBase64) {
        return { success: false, error: 'No encryption configured' };
      }
      
      const salt = new Uint8Array(this._base64ToArrayBuffer(saltBase64));
      const oldKey = await this.deriveKey(oldPassword, salt);
      
      // Verify old password
      const testEncrypted = localStorage.getItem('crypto_test');
      try {
        await this.decrypt(testEncrypted, oldKey);
      } catch (e) {
        return { success: false, error: 'Invalid current password' };
      }
      
      // Re-encrypt all data with new password
      const oldTestValue = await this.decrypt(testEncrypted, oldKey);
      
      // Create new key
      const newKey = await this.deriveKey(newPassword, salt);
      
      // Re-encrypt test value
      const newTestEncrypted = await this.encrypt(oldTestValue, newKey);
      localStorage.setItem('crypto_test', newTestEncrypted);
      
      // Re-encrypt all encrypted data
      const encryptedKeys = Object.keys(localStorage).filter(k => k.startsWith('encrypted_'));
      for (const key of encryptedKeys) {
        const data = await this.decrypt(localStorage.getItem(key), oldKey);
        const newEncrypted = await this.encrypt(data, newKey);
        localStorage.setItem(key, newEncrypted);
      }
      
      this._encryptionKey = newKey;
      return { success: true };
    } catch (e) {
      console.error('[CryptoService] Change password error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Set auto-lock timeout
   */
  setAutoLockTimeout(minutes) {
    this._config.autoLockTimeout = minutes * 60 * 1000;
    this._resetAutoLockTimer();
  },

  /**
   * Record user activity (resets auto-lock timer)
   */
  recordActivity() {
    this._lastActivity = Date.now();
    this._resetAutoLockTimer();
  },

  // ========== Private Methods ==========

  _startAutoLockTimer() {
    this._stopAutoLockTimer();
    this._autoLockTimer = setTimeout(() => {
      if (!this._isLocked) {
        console.log('[CryptoService] Auto-lock triggered');
        this.lock();
        showToast('加密已自动锁定', 'info');
      }
    }, this._config.autoLockTimeout);
  },

  _stopAutoLockTimer() {
    if (this._autoLockTimer) {
      clearTimeout(this._autoLockTimer);
      this._autoLockTimer = null;
    }
  },

  _resetAutoLockTimer() {
    if (!this._isLocked) {
      this._startAutoLockTimer();
    }
  },

  _broadcastStateChange() {
    window.dispatchEvent(new CustomEvent('cryptoStateChange', {
      detail: { locked: this._isLocked }
    }));
  },

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },
};

// Listen for visibility change (auto-lock on page hide)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Record activity when page hides
    if (window.CryptoService && !window.CryptoService.isLocked()) {
      window.CryptoService.recordActivity();
    }
  } else {
    // Check if we should auto-lock when page becomes visible
    if (window.CryptoService && !window.CryptoService.isLocked()) {
      const elapsed = Date.now() - window.CryptoService._lastActivity;
      if (elapsed > window.CryptoService._config.autoLockTimeout) {
        window.CryptoService.lock();
        showToast('加密已自动锁定', 'info');
      }
    }
  }
});

// Listen for activity (click/keypress resets timer)
document.addEventListener('click', () => {
  if (window.CryptoService && !window.CryptoService.isLocked()) {
    window.CryptoService.recordActivity();
  }
});

document.addEventListener('keypress', () => {
  if (window.CryptoService && !window.CryptoService.isLocked()) {
    window.CryptoService.recordActivity();
  }
});

// Export
window.CryptoService = CryptoService;