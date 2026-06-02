/**
 * Test Runner for ai-creator-h5 MemoryLayer and DreamConsolidation
 * Run with: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');

// Setup global mock objects
global.window = global;
global.document = {
  addEventListener: () => {}
};

// Load MemoryLayer.js
const memoryLayerPath = path.join(__dirname, '..', 'services', 'MemoryLayer.js');
const memoryLayerCode = fs.readFileSync(memoryLayerPath, 'utf8');

// Execute MemoryLayer to populate global
eval(`
(function(global) {
${memoryLayerCode}
})(global);
`);

// Load DreamConsolidation.js
const dreamPath = path.join(__dirname, '..', 'services', 'DreamConsolidation.js');
const dreamCode = fs.readFileSync(dreamPath, 'utf8');

eval(`
(function(global) {
${dreamCode}
})(global);
`);

console.log('Services loaded successfully');
console.log('MemoryLayer:', typeof global.MemoryLayer);
console.log('DreamConsolidation:', typeof global.DreamConsolidation);

// Now run tests by loading test files with global replacements
let testFiles = ['MemoryLayer.test.js', 'DreamConsolidation.test.js'];

testFiles.forEach(testFile => {
  const testPath = path.join(__dirname, testFile);
  let testCode = fs.readFileSync(testPath, 'utf8');
  
  // Replace window. with global. and document. with the mock
  testCode = testCode.replace(/window\./g, 'global.');
  testCode = testCode.replace(/document\.addEventListener/g, 'global.document.addEventListener');
  
  console.log(`\n========== Running ${testFile} ==========`);
  try {
    eval(testCode);
  } catch (e) {
    console.error(`Error running ${testFile}:`, e.message);
  }
});