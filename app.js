/**
 * Pronunciation Competition - Frontend Application
 * Vanilla JavaScript application for recording and analyzing student pronunciation
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = {
    serverURL: localStorage.getItem('serverURL') || 'http://localhost:3000',
    teacherName: localStorage.getItem('teacherName') || '',
    targetWord: '',
    expectedIPA: '',
    attempts: JSON.parse(localStorage.getItem('attempts') || '[]'),
    mediaRecorder: null,
    audioChunks: [],
    recordingStartTime: null,
    recordingInterval: null,
    globalRevealAll: false,
    currentAudioBlob: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Save attempts to localStorage
 */
function saveAttempts() {
    localStorage.setItem('attempts', JSON.stringify(state.attempts));
}

/**
 * Format timestamp
 */
function formatTimestamp(date) {
    return new Date(date).toLocaleString();
}

/**
 * Format recording duration
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Open settings modal
 */
function openSettings() {
    const modal = document.getElementById('settingsModal');
    document.getElementById('serverURL').value = state.serverURL;
    document.getElementById('teacherName').value = state.teacherName;
    modal.classList.remove('hidden');
}

/**
 * Close settings modal
 */
function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

/**
 * Save settings
 */
function saveSettings() {
    const serverURL = document.getElementById('serverURL').value.trim();
    const teacherName = document.getElementById('teacherName').value.trim();
    
    if (!serverURL) {
        showToast('Server URL is required', 'error');
        return;
    }
    
    state.serverURL = serverURL;
    state.teacherName = teacherName;
    
    localStorage.setItem('serverURL', serverURL);
    localStorage.setItem('teacherName', teacherName);
    
    showToast('Settings saved successfully', 'success');
    closeSettings();
}

// ============================================================================
// WORD CONFIGURATION
// ============================================================================

/**
 * Lookup IPA from server using Gemini
 */
async function lookupIPA() {
    const word = document.getElementById('targetWord').value.trim();
    
    if (!word) {
        showToast('Please enter a target word first', 'warning');
        return;
    }
    
    const btn = document.getElementById('lookupIPABtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Looking up...';
    
    try {
        const response = await fetch(`${state.serverURL}/api/lookup-ipa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word })
        });
        
        const data = await response.json();
        
        if (data.success && data.ipa) {
            document.getElementById('expectedIPA').value = data.ipa;
            showToast('IPA found successfully', 'success');
        } else {
            showToast('Could not find IPA. Please enter manually.', 'warning');
        }
    } catch (error) {
        console.error('Error looking up IPA:', error);
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔍 Lookup IPA';
    }
}

/**
 * Set target word
 */
function setWord() {
    const word = document.getElementById('targetWord').value.trim();
    const ipa = document.getElementById('expectedIPA').value.trim();
    
    if (!word) {
        showToast('Please enter a target word', 'warning');
        return;
    }
    
    state.targetWord = word;
    state.expectedIPA = ipa;
    
    document.getElementById('currentWord').textContent = word;
    document.getElementById('currentIPADisplay').textContent = ipa ? `Expected IPA: ${ipa}` : '';
    document.getElementById('currentWordDisplay').classList.remove('hidden');
    
    showToast('Target word set successfully', 'success');
}

// ============================================================================
// MICROPHONE & RECORDING
// ============================================================================

/**
 * Test microphone access
 */
async function testMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        showToast('Microphone access granted! Ready to record.', 'success');
        stream.getTracks().forEach(track => track.stop());
    } catch (error) {
        console.error('Microphone error:', error);
        showToast('Microphone access denied or unavailable', 'error');
    }
}

/**
 * Start recording
 */
async function startRecording() {
    if (!state.targetWord) {
        showToast('Please set a target word first', 'warning');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Determine supported mime type
        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/ogg';
            }
        }
        
        state.mediaRecorder = new MediaRecorder(stream, { mimeType });
        state.audioChunks = [];
        
        state.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.audioChunks.push(event.data);
            }
        };
        
        state.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(state.audioChunks, { type: mimeType });
            state.currentAudioBlob = audioBlob;
            stream.getTracks().forEach(track => track.stop());
            
            // Show attempt name modal
            openAttemptNameModal();
        };
        
        state.mediaRecorder.start();
        
        // Update UI
        document.getElementById('startRecordingBtn').classList.add('hidden');
        document.getElementById('stopRecordingBtn').classList.remove('hidden');
        document.getElementById('recordingStatus').classList.remove('hidden');
        
        // Start timer
        state.recordingStartTime = Date.now();
        state.recordingInterval = setInterval(updateRecordingTimer, 1000);
        
        showToast('Recording started', 'success');
    } catch (error) {
        console.error('Recording error:', error);
        showToast('Failed to start recording', 'error');
    }
}

/**
 * Stop recording
 */
function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
        
        // Update UI
        document.getElementById('startRecordingBtn').classList.remove('hidden');
        document.getElementById('stopRecordingBtn').classList.add('hidden');
        document.getElementById('recordingStatus').classList.add('hidden');
        
        // Clear timer
        clearInterval(state.recordingInterval);
        document.getElementById('recordingTimer').textContent = '0:00';
    }
}

/**
 * Update recording timer
 */
function updateRecordingTimer() {
    const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
    document.getElementById('recordingTimer').textContent = formatDuration(elapsed);
}

// ============================================================================
// ATTEMPT NAME MODAL
// ============================================================================

/**
 * Open attempt name modal
 */
function openAttemptNameModal() {
    document.getElementById('attemptNameModal').classList.remove('hidden');
    document.getElementById('attemptName').value = '';
    document.getElementById('attemptName').focus();
}

/**
 * Close attempt name modal
 */
function closeAttemptNameModal() {
    document.getElementById('attemptNameModal').classList.add('hidden');
    state.currentAudioBlob = null;
}

/**
 * Save attempt name and upload to server
 */
async function saveAttemptName() {
    const attemptName = document.getElementById('attemptName').value.trim();
    
    if (!attemptName) {
        showToast('Please enter an attempt name', 'warning');
        return;
    }
    
    closeAttemptNameModal();
    
    // Create attempt object
    const attempt = {
        id: generateId(),
        name: attemptName,
        word: state.targetWord,
        expectedIPA: state.expectedIPA,
        timestamp: Date.now(),
        audioBlob: state.currentAudioBlob,
        status: 'processing',
        analysis: null,
        revealed: state.globalRevealAll
    };
    
    state.attempts.unshift(attempt);
    saveAttempts();
    renderAttempts();
    
    // Upload to server for analysis
    await uploadAttempt(attempt);
}

// ============================================================================
// SERVER COMMUNICATION
// ============================================================================

/**
 * Upload attempt to server for analysis
 */
async function uploadAttempt(attempt) {
    try {
        const formData = new FormData();
        formData.append('audio', attempt.audioBlob, `${attempt.id}.webm`);
        formData.append('word', attempt.word);
        formData.append('attemptName', attempt.name);
        formData.append('expectedIPA', attempt.expectedIPA || '');
        
        const response = await fetch(`${state.serverURL}/api/analyze`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Find attempt and update with analysis
        const attemptIndex = state.attempts.findIndex(a => a.id === attempt.id);
        if (attemptIndex !== -1) {
            if (data.success) {
                state.attempts[attemptIndex].status = 'complete';
                state.attempts[attemptIndex].analysis = data;
            } else {
                state.attempts[attemptIndex].status = 'error';
                state.attempts[attemptIndex].error = data.error || 'Analysis failed';
            }
            
            saveAttempts();
            renderAttempts();
        }
    } catch (error) {
        console.error('Upload error:', error);
        
        // Update attempt status
        const attemptIndex = state.attempts.findIndex(a => a.id === attempt.id);
        if (attemptIndex !== -1) {
            state.attempts[attemptIndex].status = 'error';
            state.attempts[attemptIndex].error = 'Failed to connect to server';
            saveAttempts();
            renderAttempts();
        }
    }
}

// ============================================================================
// ATTEMPTS RENDERING
// ============================================================================

/**
 * Render all attempts
 */
function renderAttempts() {
    const container = document.getElementById('attemptsList');
    
    if (state.attempts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No attempts recorded yet. Start recording to create attempts.</p>';
        return;
    }
    
    container.innerHTML = state.attempts.map(attempt => renderAttemptCard(attempt)).join('');
    
    // Restore audio from blobs
    state.attempts.forEach(attempt => {
        if (attempt.audioBlob) {
            const audioElement = document.getElementById(`audio-${attempt.id}`);
            if (audioElement) {
                audioElement.src = URL.createObjectURL(attempt.audioBlob);
            }
        }
    });
}

/**
 * Render single attempt card
 */
function renderAttemptCard(attempt) {
    const scoreClass = attempt.analysis && attempt.analysis.scorePercent >= 80 ? 'score-high' :
                       attempt.analysis && attempt.analysis.scorePercent >= 60 ? 'score-medium' : 'score-low';
    
    return `
        <div class="attempt-card">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg">
                        <input 
                            type="text" 
                            value="${attempt.name}" 
                            onchange="updateAttemptName('${attempt.id}', this.value)"
                            class="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1">
                    </h3>
                    <p class="text-sm text-gray-600">Word: <span class="font-medium">${attempt.word}</span></p>
                    <p class="text-xs text-gray-500">${formatTimestamp(attempt.timestamp)}</p>
                </div>
                <div class="flex gap-2">
                    ${attempt.status === 'complete' ? `
                        <button 
                            onclick="toggleReveal('${attempt.id}')"
                            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            ${attempt.revealed ? '🙈 Hide' : '👁️ Reveal'}
                        </button>
                    ` : ''}
                    <button 
                        onclick="deleteAttempt('${attempt.id}')"
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                        🗑️
                    </button>
                </div>
            </div>
            
            <audio id="audio-${attempt.id}" controls class="mb-3"></audio>
            
            ${renderAttemptStatus(attempt, scoreClass)}
        </div>
    `;
}

/**
 * Render attempt status and analysis
 */
function renderAttemptStatus(attempt, scoreClass) {
    if (attempt.status === 'processing') {
        return `
            <div class="flex items-center gap-2 text-blue-600">
                <span class="spinner"></span>
                <span>Processing analysis...</span>
            </div>
        `;
    }
    
    if (attempt.status === 'error') {
        return `
            <div class="bg-red-50 border border-red-200 rounded p-3">
                <p class="text-red-600 font-medium">Error</p>
                <p class="text-sm text-red-500">${attempt.error}</p>
            </div>
        `;
    }
    
    if (attempt.status === 'complete' && !attempt.revealed) {
        return `
            <div class="bg-gray-50 border border-gray-200 rounded p-3">
                <p class="text-gray-600">✅ Analysis complete - Click "Reveal" to see results</p>
            </div>
        `;
    }
    
    if (attempt.status === 'complete' && attempt.revealed && attempt.analysis) {
        return renderAnalysis(attempt, scoreClass);
    }
    
    return '';
}

/**
 * Render analysis results
 */
function renderAnalysis(attempt, scoreClass) {
    const analysis = attempt.analysis;
    
    return `
        <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <div class="text-center mb-4">
                <div class="score-display ${scoreClass}">${analysis.scorePercent}%</div>
                <p class="text-sm text-gray-600">Score: ${analysis.matchCount} / ${analysis.expectedCount} phonemes correct</p>
            </div>
            
            <div class="grid gap-3 mb-4">
                <div>
                    <p class="text-sm font-medium text-gray-700">Expected IPA:</p>
                    <div class="ipa-display">${renderIPAWithMatches(analysis.expectedIPA, analysis.mismatches, true)}</div>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700">Student IPA:</p>
                    <div class="ipa-display">${renderIPAWithMatches(analysis.studentIPA, analysis.mismatches, false)}</div>
                </div>
            </div>
            
            ${analysis.mismatches && analysis.mismatches.length > 0 ? `
                <div class="mb-3">
                    <p class="text-sm font-medium text-gray-700 mb-2">Mismatches & Hints:</p>
                    ${analysis.mismatches.map(m => `
                        <div class="mismatch-hint">
                            <span class="font-medium">Position ${m.index + 1}:</span> 
                            Expected "<span class="text-red-600 font-semibold">${m.expected}</span>" 
                            but got "<span class="text-orange-600 font-semibold">${m.actual || 'missing'}</span>"
                            ${m.hint ? `<br><span class="text-gray-700">💡 ${m.hint}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${analysis.aiComments ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <p class="text-sm font-medium text-gray-700 mb-1">AI Feedback:</p>
                    <p class="text-sm text-gray-700">${analysis.aiComments}</p>
                </div>
            ` : ''}
            
            <div class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Teacher Override / Notes:</label>
                <textarea 
                    onchange="updateAttemptNotes('${attempt.id}', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Add teacher notes or override score...">${attempt.teacherNotes || ''}</textarea>
            </div>
        </div>
    `;
}

/**
 * Render IPA with color-coded phonemes
 */
function renderIPAWithMatches(ipa, mismatches, isExpected) {
    if (!ipa || !mismatches || mismatches.length === 0) {
        return ipa || '';
    }
    
    // Convert IPA string to array of phonemes (simple split for now)
    const phonemes = ipa.split('');
    
    return phonemes.map((phoneme, index) => {
        const mismatch = mismatches.find(m => m.index === index);
        
        if (mismatch) {
            return `<span class="phoneme incorrect">${phoneme}</span>`;
        }
        return `<span class="phoneme correct">${phoneme}</span>`;
    }).join('');
}

// ============================================================================
// ATTEMPT ACTIONS
// ============================================================================

/**
 * Update attempt name
 */
function updateAttemptName(attemptId, newName) {
    const attempt = state.attempts.find(a => a.id === attemptId);
    if (attempt) {
        attempt.name = newName;
        saveAttempts();
        showToast('Attempt name updated', 'success');
    }
}

/**
 * Update attempt notes
 */
function updateAttemptNotes(attemptId, notes) {
    const attempt = state.attempts.find(a => a.id === attemptId);
    if (attempt) {
        attempt.teacherNotes = notes;
        saveAttempts();
        showToast('Teacher notes saved', 'success');
    }
}

/**
 * Toggle reveal for single attempt
 */
function toggleReveal(attemptId) {
    const attempt = state.attempts.find(a => a.id === attemptId);
    if (attempt) {
        attempt.revealed = !attempt.revealed;
        saveAttempts();
        renderAttempts();
    }
}

/**
 * Delete attempt
 */
function deleteAttempt(attemptId) {
    if (confirm('Are you sure you want to delete this attempt?')) {
        state.attempts = state.attempts.filter(a => a.id !== attemptId);
        saveAttempts();
        renderAttempts();
        showToast('Attempt deleted', 'success');
    }
}

// ============================================================================
// GLOBAL ACTIONS
// ============================================================================

/**
 * Toggle reveal all results
 */
function toggleRevealAll() {
    state.globalRevealAll = !state.globalRevealAll;
    
    state.attempts.forEach(attempt => {
        if (attempt.status === 'complete') {
            attempt.revealed = state.globalRevealAll;
        }
    });
    
    saveAttempts();
    renderAttempts();
    showToast(state.globalRevealAll ? 'All results revealed' : 'All results hidden', 'success');
}

/**
 * Export attempts as JSON
 */
function exportAttempts() {
    // Prepare data for export (exclude blob data)
    const exportData = state.attempts.map(attempt => ({
        id: attempt.id,
        name: attempt.name,
        word: attempt.word,
        expectedIPA: attempt.expectedIPA,
        timestamp: attempt.timestamp,
        status: attempt.status,
        analysis: attempt.analysis,
        teacherNotes: attempt.teacherNotes,
        error: attempt.error
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pronunciation-attempts-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Attempts exported successfully', 'success');
}

/**
 * Clear all attempts
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all attempts? This cannot be undone.')) {
        state.attempts = [];
        saveAttempts();
        renderAttempts();
        showToast('All attempts cleared', 'success');
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Word configuration
    document.getElementById('lookupIPABtn').addEventListener('click', lookupIPA);
    document.getElementById('setWordBtn').addEventListener('click', setWord);
    
    // Recording controls
    document.getElementById('testMicBtn').addEventListener('click', testMicrophone);
    document.getElementById('startRecordingBtn').addEventListener('click', startRecording);
    document.getElementById('stopRecordingBtn').addEventListener('click', stopRecording);
    
    // Attempt name modal
    document.getElementById('saveAttemptNameBtn').addEventListener('click', saveAttemptName);
    document.getElementById('cancelAttemptBtn').addEventListener('click', closeAttemptNameModal);
    document.getElementById('attemptName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveAttemptName();
    });
    
    // Global actions
    document.getElementById('revealAllBtn').addEventListener('click', toggleRevealAll);
    document.getElementById('exportBtn').addEventListener('click', exportAttempts);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    
    // Close modals on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettings();
    });
    document.getElementById('attemptNameModal').addEventListener('click', (e) => {
        if (e.target.id === 'attemptNameModal') closeAttemptNameModal();
    });
    
    // Initial render
    renderAttempts();
    
    // Show settings if server URL not set
    if (!state.serverURL || state.serverURL === 'http://localhost:3000') {
        setTimeout(() => {
            if (confirm('Would you like to configure the server URL now?')) {
                openSettings();
            }
        }, 500);
    }
});

// ============================================================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE (for inline event handlers)
// ============================================================================

window.updateAttemptName = updateAttemptName;
window.updateAttemptNotes = updateAttemptNotes;
window.toggleReveal = toggleReveal;
window.deleteAttempt = deleteAttempt;
