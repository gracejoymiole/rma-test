// ============================================
// QUESTION MAP RENDERING FUNCTIONS
// Add these to teacher-portal.js
// ============================================

/**
 * Render all questions from the QUESTION_BANK to the Question Map panel
 */
function renderAllQuestions() {
  const container = document.getElementById('questionsGrid');
  if (!container) return;

  // Get current filters
  const searchText = document.getElementById('questionSearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('questionTypeFilter')?.value || 'all';
  const masteryFilter = document.getElementById('masteryFilter')?.value || 'all';

  // Flatten all questions from all grades
  let allQuestions = [];
  Object.values(QUESTION_BANK).forEach(gradeQuestions => {
    gradeQuestions.forEach(q => {
      // Add the RMA question itself
      allQuestions.push({ ...q, questionType: 'rma' });
      // Add aligned questions
      if (q.alignedQuestions) {
        q.alignedQuestions.forEach(aligned => {
          allQuestions.push({ 
            ...aligned, 
            questionType: 'aligned',
            parentId: q.id,
            parentText: q.text,
            category: q.category,
            masteryRate: q.masteryRate,
            type: 'aligned'
          });
        });
      }
    });
  });

  // Apply filters
  let filteredQuestions = allQuestions.filter(q => {
    // Search filter
    if (searchText && !q.text.toLowerCase().includes(searchText)) {
      return false;
    }
    // Type filter
    if (typeFilter !== 'all' && q.questionType !== typeFilter) {
      return false;
    }
    // Mastery filter (for RMA questions)
    if (masteryFilter !== 'all' && q.masteryRate !== undefined) {
      if (masteryFilter === 'high' && q.masteryRate < 80) return false;
      if (masteryFilter === 'medium' && (q.masteryRate < 60 || q.masteryRate >= 80)) return false;
      if (masteryFilter === 'low' && q.masteryRate >= 60) return false;
    }
    return true;
  });

  // Render filtered questions
  if (filteredQuestions.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--muted);">No questions match your filters.</p>';
    return;
  }

  container.innerHTML = filteredQuestions.map(q => {
    const isAligned = q.questionType === 'aligned';
    const isRMA = q.questionType === 'rma';
    const hasOptions = q.options && q.options.length > 0;
    
    // Determine mastery level for RMA questions
    let masteryLevel = '';
    let masteryClass = '';
    if (q.masteryRate !== undefined) {
      if (q.masteryRate >= 80) { masteryLevel = 'High'; masteryClass = 'status-mastered'; }
      else if (q.masteryRate >= 60) { masteryLevel = 'Medium'; masteryClass = 'status-track'; }
      else if (q.masteryRate >= 40) { masteryLevel = 'Emerging'; masteryClass = 'status-emerging'; }
      else { masteryLevel = 'Low'; masteryClass = 'status-needs-support'; }
    }

    return `
      <div class="question-card" data-type="${q.questionType}" data-category="${q.category || ''}" data-mastery="${q.masteryRate || 0}">
        <div class="question-header">
          <span class="question-id">${q.id}</span>
          <span class="question-type-badge">${isRMA ? 'RMA Original' : 'Aligned'}</span>
        </div>
        
        ${isAligned ? `<p style="font-size:0.85rem; color:var(--muted); margin-bottom:8px;"><strong>Parent:</strong> ${q.parentId}</p>` : ''}
        
        <p style="margin:0 0 12px; line-height:1.5;">${q.text}</p>
        
        ${hasOptions ? `
          <div style="margin:10px 0; padding:10px; background:#f8f4e8; border-radius:8px;">
            <strong style="display:block; margin-bottom:6px; color:var(--wine);">Options:</strong>
            <ul style="margin:0; padding-left:20px;">
              ${q.options.map((opt, i) => {
                const isCorrect = opt === q.answer;
                return `<li style="margin:4px 0; ${isCorrect ? 'font-weight:700; color:var(--wine);' : ''}">${opt}</li>`;
              }).join('')}
            </ul>
            <p style="margin:6px 0 0; font-size:0.85rem;"><strong>Answer:</strong> ${q.answer}</p>
          </div>
        ` : ''}
        
        ${q.feedback ? `
          <details style="margin-top:10px;">
            <summary style="cursor:pointer; color:var(--wine); font-weight:700; font-size:0.85rem;">
              ${isRMA ? 'View Aligned Questions' : 'View Feedback'}
            </summary>
            <div style="margin-top:8px; padding:10px; background:#f8f4e8; border-radius:8px; font-size:0.85rem; line-height:1.5;">
              ${isRMA ? `
                ${q.alignedQuestions ? `
                  <ul style="margin:0; padding-left:20px;">
                    ${q.alignedQuestions.slice(0, 3).map(aligned => `
                      <li style="margin:6px 0;">${aligned.text}</li>
                    `).join('')}
                    ${q.alignedQuestions.length > 3 ? `<li style="margin:6px 0; color:var(--muted);">+ ${q.alignedQuestions.length - 3} more aligned questions</li>` : ''}
                  </ul>
                ` : 'No aligned questions yet'}
              ` : q.feedback}
            </div>
          </details>
        ` : ''}
        
        ${masteryLevel ? `
          <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
            <span class="status ${masteryClass}">${masteryLevel} Mastery</span>
            <span style="font-size:0.85rem; color:var(--muted);">${q.masteryRate}%</span>
          </div>
        ` : ''}
        
        ${q.category ? `
          <span style="display:inline-block; margin-top:8px; padding:4px 10px; background:#e2e8f0; border-radius:6px; font-size:0.75rem; color:var(--wine);">
            ${q.category}
          </span>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Filter questions based on search and filter criteria
 */
function filterQuestions() {
  renderAllQuestions();
}

/**
 * Toggle visibility of aligned questions for a specific RMA question
 */
function toggleAlignedQuestions(questionId) {
  const card = document.querySelector(`[data-question-id="${questionId}"]`);
  if (card) {
    const alignedContainer = card.querySelector('.aligned-questions');
    if (alignedContainer) {
      alignedContainer.style.display = alignedContainer.style.display === 'none' ? 'block' : 'none';
    }
  }
}

/**
 * Initialize the Question Map tab
 */
function initQuestionMap() {
  // Check if we're on the Question Map tab
  const tab = document.getElementById('tabQuestionMapContent');
  if (tab && !tab.hidden) {
    renderAllQuestions();
  }
}

/**
 * Show the Question Map tab and render questions
 */
function showQuestionMap() {
  showTab('questionMap');
  setTimeout(() => {
    renderAllQuestions();
  }, 100);
}

// Add to the tab switching mechanism
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('[id^="tab"]').forEach(tab => {
    if (tab.id !== `tab${tabName}Content` && !tab.id.endsWith('Content')) {
      // This is a tab button
    }
  });
  
  // Show selected tab content
  document.querySelectorAll('[id^="tab"][id$="Content"]').forEach(content => {
    content.hidden = content.id !== `tab${tabName}Content`;
  });
  
  // If showing Question Map, render questions
  if (tabName === 'questionMap') {
    setTimeout(renderAllQuestions, 100);
  }
}

// Note: These functions need to be integrated into the main teacher-portal.js file
// The QUESTION_BANK also needs to be updated with all 47 Grade 10 questions
