
const fs = require('fs');
const content = fs.readFileSync('src/app/reformers/page.tsx', 'utf8');

let depth = 0;
let lineNum = 1;
const lines = content.split('\n');

for (let line of lines) {
    const opens = (line.match(/<div(\s|>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (lineNum === 28) depth = 0;
    if (lineNum >= 28 && lineNum < 929) {
        if (opens > closes) console.log(`${lineNum}: +${opens-closes} | depth=${depth} | ${line.trim()}`);
        if (closes > opens) console.log(`${lineNum}: -${closes-opens} | depth=${depth} | ${line.trim()}`);
    }
    lineNum++;
}
console.log(`Final depth: ${depth}`);
