
const fs = require('fs');
const content = fs.readFileSync('src/app/reformers/page.tsx', 'utf8');

let depth = 0;
let lineNum = 1;
const lines = content.split('\n');

for (let line of lines) {
    if (lineNum === 929) depth = 0; // Reset at start of ReformersPageContent
    
    // Count opening divs that are NOT self-closing
    // Regex matches <div ...> but NOT <div ... />
    let opens = 0;
    const openMatches = line.matchAll(/<div(\s+[^>]*)?>/g);
    for (const match of openMatches) {
        if (!match[0].endsWith('/>')) {
            opens++;
        }
    }
    
    // Count closing divs
    const closes = (line.match(/<\/div>/g) || []).length;
    
    depth += opens - closes;
    
    if (lineNum >= 1160 && lineNum <= 1170) {
        console.log(`${lineNum}: +${opens} -${closes} | depth=${depth} | ${line.trim()}`);
    }
    if (lineNum >= 1740 && lineNum <= 1750) {
        console.log(`${lineNum}: +${opens} -${closes} | depth=${depth} | ${line.trim()}`);
    }
    lineNum++;
}
console.log(`Final depth: ${depth}`);
