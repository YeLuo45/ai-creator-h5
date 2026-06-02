/**
 * Test Runner for ai-creator-h5
 * Run with: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');

// Setup global mock objects
global.window = global;
global.document = { addEventListener: () => {} };

// Helper to extract code from IIFE
function loadService(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Remove IIFE wrapper: (function() { 'use strict'; ... })()
  // Match from (function() to the final })()
  code = code.replace(/^\(function\(\)\s*/, '');
  code = code.replace(/\}\)\(\)\s*$/, '');
  eval(code);
  console.log('Loaded:', path.basename(filePath));
}

// Load services in order
loadService(path.join(__dirname, '..', 'services', 'MemoryLayer.js'));
loadService(path.join(__dirname, '..', 'services', 'DreamConsolidation.js'));
loadService(path.join(__dirname, '..', 'services', 'AgentOrchestrator.js'));
loadService(path.join(__dirname, '..', 'services', 'TaskScheduler.js'));

console.log('\nServices loaded successfully');
console.log('- MemoryLayer:', typeof global.MemoryLayer);
console.log('- DreamConsolidation:', typeof global.DreamConsolidation);
console.log('- AgentOrchestrator:', typeof global.AgentOrchestrator);
console.log('- TaskScheduler:', typeof global.TaskScheduler);

// Run test files
const testFiles = [
  'MemoryLayer.test.js',
  'DreamConsolidation.test.js',
  'AgentOrchestrator.test.js',
  'TaskScheduler.test.js'
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