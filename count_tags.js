const fs = require('fs');
const content = fs.readFileSync(
  'd:/Repository Github/sipoma-ver-2/sipoma-versi-2/pages/plant_operations/CcrDataEntryPage.tsx',
  'utf8'
);

function countTags(tagName) {
  const openRegex = new RegExp('<' + tagName + '(?![a-zA-Z])', 'g');
  const closeRegex = new RegExp('</' + tagName + '>', 'g');
  const selfClosingRegex = new RegExp('<' + tagName + '[^>]*/>', 'g');

  const openCount = (content.match(openRegex) || []).length;
  const closeCount = (content.match(closeRegex) || []).length;
  const selfClosingCount = (content.match(selfClosingRegex) || []).length;

  return {
    open: openCount,
    close: closeCount,
    selfClosing: selfClosingCount,
    balanced: openCount === closeCount + selfClosingCount,
  };
}

console.log('div:', countTags('div'));
console.log('motion.div:', countTags('motion.div'));
console.log('EnhancedCard:', countTags('EnhancedCard'));
console.log('Modal:', countTags('Modal'));
