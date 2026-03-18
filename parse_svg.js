const fs = require('fs');
const svg = fs.readFileSync('Types_of_teeth.svg', 'utf8');
const matches = [...svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/g)];
console.log('Total paths found:', matches.length);
matches.forEach((m, i) => {
  const d = m[1];
  console.log('Path ' + i + ' Length: ' + d.length + ', Starts with: ' + d.substring(0, 30));
});
