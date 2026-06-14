const fs = require('fs');
const content = fs.readFileSync('ref.js', 'utf8');
const classMatches = content.match(/className:\s*"([^"]+)"/g) || [];
const stringMatches = content.match(/"([^"]+)"/g) || [];
const allMatches = [...classMatches, ...stringMatches];
const twClasses = Array.from(new Set(allMatches))
  .filter(s => s.includes('bg-') || s.includes('text-') || s.includes('flex-') || s.includes('rounded-') || s.includes('shadow-') || s.includes('gradient'))
  .slice(0, 100);
console.log(twClasses.join('\n'));
