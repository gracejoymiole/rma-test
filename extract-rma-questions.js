// Script to extract RMA questions from grade HTML files
// Run this with Node.js to generate the QUESTION_BANK

const fs = require('fs');
const path = require('path');

// Grade file paths
const gradeFiles = {
  7: 'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  8: 'RMA G8 V2/G8 RMA V5.html',
  9: 'RMA G9 V1/rmag9 v3.html',
  10: 'RMA G10 V1/g10rma v4.html'
};

// Function to extract questions from a file
function extractQuestions(filePath, grade) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find the rawQuestions array
  const rawQuestionsMatch = content.match(/const rawQuestions = \[([\s\S]*?)\];/);
  if (!rawQuestionsMatch) {
    console.warn(`No rawQuestions array found in ${filePath}`);
    return [];
  }
  
  const rawQuestionsStr = rawQuestionsMatch[1];
  
  // Parse the questions array manually
  const questions = [];
  let current = '';
  let braceCount = 0;
  let inQuestion = false;
  
  for (let i = 0; i < rawQuestionsStr.length; i++) {
    const char = rawQuestionsStr[i];
    
    if (char === '{') {
      braceCount++;
      inQuestion = true;
      current = '{';
    } else if (char === '}' && inQuestion) {
      braceCount--;
      current += '}';
      
      if (braceCount === 0) {
        try {
          // Parse the question object
          const question = eval(`(${current})`);
          questions.push(question);
          current = '';
          inQuestion = false;
        } catch (e) {
          console.warn(`Error parsing question at position ${i}:`, e.message);
        }
      } else {
        current += char;
      }
    } else if (inQuestion) {
      current += char;
    }
  }
  
  return questions.map((q, index) => ({
    id: `RMA-Q${grade}-${index + 1}`,
    text: q.text || '',
    options: q.options || [],
    answer: q.answer || '',
    explanation: q.explanation || q.feedback || '',
    category: getCategory(grade, index + 1)
  }));
}

// Determine category based on grade and question number
function getCategory(grade, qNum) {
  const categories = {
    7: {
      1: 'Number Expressions', 2: 'Number Expressions', 3: 'Number Expressions', 
      4: 'Number Expressions', 5: 'Number Expressions', 6: 'Number Expressions',
      7: 'Number Expressions', 8: 'Data', 9: 'Data', 10: 'Data',
      11: 'Data', 12: 'Data', 13: 'Data', 14: 'Coordinates',
      15: 'Triangles', 16: 'Triangles', 17: 'Triangles',
      18: 'Triangles', 19: 'Triangles', 20: 'Circles', 21: 'Circles'
    },
    8: 'Linear Equations & Functions',
    9: 'Quadratic Equations & Geometry',
    10: 'Advanced Algebra & Statistics'
  };
  
  if (categories[grade] && typeof categories[grade] === 'object') {
    return categories[grade][qNum] || 'General';
  }
  return categories[grade] || 'General';
}

// Main function
async function main() {
  const allQuestions = {};
  
  for (const grade of Object.keys(gradeFiles)) {
    const filePath = path.join(__dirname, gradeFiles[grade]);
    try {
      const questions = extractQuestions(filePath, parseInt(grade));
      allQuestions[grade] = questions;
      console.log(`Grade ${grade}: Extracted ${questions.length} questions`);
    } catch (error) {
      console.error(`Error processing Grade ${grade}:`, error.message);
    }
  }
  
  // Count total
  const total = Object.values(allQuestions).reduce((sum, q) => sum + q.length, 0);
  console.log(`\nTotal RMA questions extracted: ${total}`);
  
  // Save to file
  fs.writeFileSync(
    path.join(__dirname, 'rma-questions-extracted.json'),
    JSON.stringify(allQuestions, null, 2),
    'utf8'
  );
  
  console.log('\nSaved to rma-questions-extracted.json');
}

main().catch(console.error);
