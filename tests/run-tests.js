/**
 * Test Runner for ai-creator-h5
 * Run with: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');

// Setup global mock objects
global.window = global;
global.document = { addEventListener: () => {} };

// Helper to load service files - handles various IIFE patterns
function loadService(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Pattern 1: (function(global) { ... })(window/global)
  // Pattern 2: (function() { ... })()
  // Pattern 3: (function() { ... }(window))
  
  // For services that use (function(global) { ... })(typeof window !== 'undefined' ? window : global);
  if (code.includes('typeof window')) {
    // This is the window/global pattern - just eval, context is set
    eval(code);
  } else if (/^\(function\(\)\s*\{/.test(code)) {
    // Simple (function() { ... })() - eval directly
    eval(code);
  } else if (/^\(function\([a-zA-Z_$][a-zA-Z0-9_$]*\)\s*\{/.test(code)) {
    // Has parameter but no window check - extract body and rewrap
    const braceStart = code.indexOf('{');
    const lastBrace = code.lastIndexOf('}');
    const body = code.slice(braceStart + 1, lastBrace);
    const paramMatch = code.match(/^\(function\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/);
    if (paramMatch) {
      eval(`(function(${paramMatch[1]}) { ${body} })(global)`);
    }
  } else {
    eval(code);
  }
  console.log('Loaded:', path.basename(filePath));
  return true;
}

// Load services in order
loadService(path.join(__dirname, '..', 'services', 'MemoryLayer.js'));
loadService(path.join(__dirname, '..', 'services', 'DreamConsolidation.js'));
loadService(path.join(__dirname, '..', 'services', 'AgentOrchestrator.js'));
loadService(path.join(__dirname, '..', 'services', 'TaskScheduler.js'));
loadService(path.join(__dirname, '..', 'services', 'CreativePlannerAgent.js'));
loadService(path.join(__dirname, '..', 'services', 'ContentGeneratorAgent.js'));
loadService(path.join(__dirname, '..', 'services', 'ReviewOptimizerAgent.js'));
loadService(path.join(__dirname, '..', 'services', 'MultiModelRouter.js'));
loadService(path.join(__dirname, '..', 'services', 'CreativePipeline.js'));

console.log('\nServices loaded successfully');
console.log('- MemoryLayer:', typeof global.MemoryLayer);
console.log('- DreamConsolidation:', typeof global.DreamConsolidation);
console.log('- AgentOrchestrator:', typeof global.AgentOrchestrator);
console.log('- TaskScheduler:', typeof global.TaskScheduler);
console.log('- CreativePlannerAgent:', typeof global.CreativePlannerAgent);
console.log('- ContentGeneratorAgent:', typeof global.ContentGeneratorAgent);
console.log('- ReviewOptimizerAgent:', typeof global.ReviewOptimizerAgent);
console.log('- MultiModelRouter:', typeof global.MultiModelRouter);
console.log('- CreativePipeline:', typeof global.CreativePipeline);

// Results collector
const runResults = [];

// Override console.assert to track results
const originalAssert = console.assert;
console.assert = function(condition, message) {
  if (condition) {
    runResults.push({ status: 'passed', test: message });
  } else {
    runResults.push({ status: 'failed', test: message });
    originalAssert.call(console, condition, message);
  }
};

// Run test files
const testFiles = [
  'MemoryLayer.test.js',
  'DreamConsolidation.test.js',
  'AgentOrchestrator.test.js',
  'TaskScheduler.test.js',
  'CreativePipeline.test.js'
];

testFiles.forEach(testFile => {
  const testPath = path.join(__dirname, testFile);
  if (fs.existsSync(testPath)) {
    console.log(`\n========== Running ${testFile} ==========`);
    try {
      const testCode = fs.readFileSync(testPath, 'utf8');
      eval(testCode);
    } catch (e) {
      console.error(`Error in ${testFile}:`, e.message);
    }
  }
});

console.log('\n========== All Tests Completed ==========');