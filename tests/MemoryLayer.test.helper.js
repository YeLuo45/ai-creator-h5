/**
 * MemoryLayer.test.helper.js - Load MemoryLayer into global scope for Node.js testing
 */

const fs = require('fs');
const path = require('path');

// Read the MemoryLayer.js file content
const memoryLayerPath = path.join(__dirname, '..', 'services', 'MemoryLayer.js');
let memoryLayerCode = fs.readFileSync(memoryLayerPath, 'utf8');

// Wrap in function to avoid IIFE issues and inject global
const wrappedCode = `
(function(global) {
${memoryLayerCode}
})(global);
`;

// Execute to load into global
eval(wrappedCode);

console.log('MemoryLayer loaded into global scope');