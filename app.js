/**
 * Pronunciation Competition - Frontend Application
 * Vanilla JavaScript application for recording and analyzing student pronunciation
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = {
    geminiApiKey: localStorage.getItem('geminiApiKey') || '',
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
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Open settings modal
 */
function openSettings() {
    const modal = document.getElementById('settingsModal');
    document.getElementById('geminiApiKey').value = state.geminiApiKey;
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
    const geminiApiKey = document.getElementById('geminiApiKey').value.trim();
    const teacherName = document.getElementById('teacherName').value.trim();
    
    if (!geminiApiKey) {
        showToast('Gemini API key is required', 'error');
        return;
    }
    
    state.geminiApiKey = geminiApiKey;
    state.teacherName = teacherName;
    
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('teacherName', teacherName);
    
    showToast('Settings saved successfully', 'success');
    closeSettings();
}

// ============================================================================
// WORD CONFIGURATION
// ============================================================================

/**
 * Call Gemini API to get IPA from word
 */
async function getIPAFromGemini(word) {
    if (!state.geminiApiKey) {
        showToast('Please configure your Gemini API key in Settings', 'error');
        return null;
    }
    
    try {
        const prompt = `Return ONLY the International Phonetic Alphabet (IPA) transcription for the English word "${word}". Return just the IPA symbols, nothing else. Use standard IPA notation.`;
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 100
                    }
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error('Failed to call Gemini API');
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            let ipa = data.candidates[0].content.parts[0].text.trim();
            // Remove common formatting
            ipa = ipa.replace(/^IPA:\s*/i, '');
            ipa = ipa.replace(/^\//, '').replace(/\/$/, '');
            ipa = ipa.replace(/^\[/, '').replace(/\]$/, '');
            return ipa;
        }
        
        return null;
    } catch (error) {
        console.error('Error calling Gemini API for IPA:', error);
        return null;
    }
}

/**
 * Lookup IPA from Gemini
 */
async function lookupIPA() {
    const word = document.getElementById('targetWord').value.trim();
    
    if (!word) {
        showToast('Please enter a target word first', 'warning');
        return;
    }
    
    if (!state.geminiApiKey) {
        showToast('Please configure your Gemini API key in Settings first', 'error');
        openSettings();
        return;
    }
    
    const btn = document.getElementById('lookupIPABtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Looking up...';
    
    try {
        const ipa = await getIPAFromGemini(word);
        
        if (ipa) {
            document.getElementById('expectedIPA').value = ipa;
            showToast('IPA found successfully', 'success');
        } else {
            showToast('Could not find IPA. Please enter manually.', 'warning');
        }
    } catch (error) {
        console.error('Error looking up IPA:', error);
        showToast('Error calling Gemini API', 'error');
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
 * Call Gemini API to analyze audio and get student IPA
 */
async function getStudentIPAFromAudio(audioBlob, word, expectedIPA) {
    if (!state.geminiApiKey) {
        throw new Error('Gemini API key not configured');
    }
    
    try {
        // Convert blob to base64
        const audioBase64 = await blobToBase64(audioBlob);
        
        // Determine MIME type
        let mimeType = audioBlob.type || 'audio/webm';
        
        const prompt = `You are a precise phonetics assistant. Listen to this audio clip of a student attempting to pronounce the word "${word}".

Task: Transcribe the student's pronunciation into IPA (International Phonetic Alphabet) notation. Return ONLY the IPA transcription, nothing else. Be as accurate as possible with the phonetic symbols.

${expectedIPA ? `Expected pronunciation: ${expectedIPA}` : ''}

Return just the IPA symbols for what you hear.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: audioBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 200
                    }
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error('Failed to analyze audio');
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            let ipa = data.candidates[0].content.parts[0].text.trim();
            // Clean up formatting
            ipa = ipa.replace(/^IPA:\s*/i, '');
            ipa = ipa.replace(/^\//, '').replace(/\/$/, '');
            ipa = ipa.replace(/^\[/, '').replace(/\]$/, '');
            return ipa;
        }
        
        return null;
    } catch (error) {
        console.error('Error calling Gemini API for audio analysis:', error);
        throw error;
    }
}

/**
 * Call Gemini API to get hints for mismatches
 */
async function getHintsForMismatches(expectedIPA, studentIPA, word) {
    if (!state.geminiApiKey) {
        return null;
    }
    
    try {
        const prompt = `Compare the expected IPA pronunciation with the student's actual pronunciation:

Word: "${word}"
Expected IPA: ${expectedIPA}
Student IPA: ${studentIPA}

Analyze the differences between expected and student IPA. For each mismatch or error:
1. Identify which phoneme was expected
2. Identify what the student said instead
3. Provide a brief, helpful hint (max 80 characters) on how to correct it

Return a JSON object with this structure:
{
  "aiComments": "Brief summary of main pronunciation issues (1-2 sentences)",
  "mismatches": [
    {"expected": "θ", "actual": "t", "hint": "Place tongue between teeth for /θ/ sound"}
  ]
}

Return ONLY valid JSON, no additional text.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 500
                    }
                })
            }
        );
        
        if (!response.ok) {
            console.error('Gemini API error getting hints');
            return null;
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            let text = data.candidates[0].content.parts[0].text.trim();
            // Try to extract JSON from markdown code blocks
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse Gemini JSON response:', parseError);
                return { aiComments: text, mismatches: [] };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error calling Gemini API for hints:', error);
        return null;
    }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Split IPA string into phonemes
 */
function splitIntoPhonemes(ipa) {
    if (!ipa) return [];
    
    // Common IPA multi-character sequences
    const multiChar = ['t͡ʃ', 'd͡ʒ', 'aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'ɪə', 'eə', 'ʊə'];
    
    let result = [];
    let i = 0;
    
    while (i < ipa.length) {
        let found = false;
        
        // Check for multi-character phonemes
        for (const mc of multiChar) {
            if (ipa.substring(i, i + mc.length) === mc) {
                result.push(mc);
                i += mc.length;
                found = true;
                break;
            }
        }
        
        if (!found) {
            // Single character phoneme
            const char = ipa[i];
            // Skip modifiers that attach to previous phoneme
            if (char !== 'ː' && char !== 'ˑ' && char !== '̆' && char !== 'ˈ' && char !== 'ˌ') {
                result.push(char);
            } else if (result.length > 0) {
                // Attach modifier to previous phoneme
                result[result.length - 1] += char;
            }
            i++;
        }
    }
    
    return result;
}

/**
 * Align two phoneme sequences using dynamic programming
 */
function alignPhonemes(expected, actual) {
    const m = expected.length;
    const n = actual.length;
    
    // Create DP table
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // Fill DP table
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (expected[i - 1] === actual[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }
    
    // Backtrack to get alignment
    const alignment = [];
    let i = m, j = n;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
            alignment.unshift({ expected: expected[i - 1], actual: actual[j - 1] });
            i--; j--;
        } else if (i > 0 && (j === 0 || dp[i - 1][j] <= dp[i][j - 1])) {
            alignment.unshift({ expected: expected[i - 1], actual: null });
            i--;
        } else {
            alignment.unshift({ expected: null, actual: actual[j - 1] });
            j--;
        }
    }
    
    return alignment;
}

/**
 * Get simple hint for phoneme mismatch
 */
function getSimpleHint(expected, actual) {
    if (!expected) return 'Extra sound - try to remove this';
    if (!actual) return `Missing sound - add ${expected}`;
    
    // Simple hint dictionary
    const hints = {
        'θ': 'Place tongue between teeth for /θ/ (voiceless)',
        'ð': 'Place tongue between teeth for /ð/ (voiced)',
        'ŋ': 'Use back of tongue against soft palate for /ŋ/',
        'ʃ': 'Round lips and push air between tongue and roof of mouth for /ʃ/',
        'ʒ': 'Same as /ʃ/ but voiced for /ʒ/',
        'r': 'Curl tongue tip back slightly for /r/',
        'l': 'Touch tongue to roof of mouth for /l/',
        'w': 'Round lips and use voice for /w/',
        'j': 'Raise middle of tongue toward palate for /j/'
    };
    
    if (hints[expected]) {
        return hints[expected];
    }
    
    return `Try to pronounce /${expected}/ instead of /${actual || 'nothing'}/`;
}

/**
 * Compare phonemes and find mismatches
 */
function comparePhonemes(expectedIPA, studentIPA) {
    const expectedPhonemes = splitIntoPhonemes(expectedIPA);
    const studentPhonemes = splitIntoPhonemes(studentIPA);
    
    const expectedCount = expectedPhonemes.length;
    let matchCount = 0;
    const mismatches = [];
    
    // Use alignment for comparison
    const alignment = alignPhonemes(expectedPhonemes, studentPhonemes);
    
    alignment.forEach((pair, index) => {
        if (pair.expected === pair.actual) {
            matchCount++;
        } else {
            mismatches.push({
                index: index,
                expected: pair.expected || '',
                actual: pair.actual || '',
                hint: getSimpleHint(pair.expected, pair.actual)
            });
        }
    });
    
    const scorePercent = expectedCount > 0 ? Math.round((matchCount / expectedCount) * 100) : 0;
    
    return {
        scorePercent,
        matchCount,
        expectedCount,
        mismatches
    };
}

/**
 * Upload attempt to server for analysis
 */
async function uploadAttempt(attempt) {
    try {
        if (!state.geminiApiKey) {
            throw new Error('Gemini API key not configured. Please configure it in Settings.');
        }
        
        // Get expected IPA if not provided
        let expectedIPA = attempt.expectedIPA;
        if (!expectedIPA) {
            expectedIPA = await getIPAFromGemini(attempt.word);
        }
        
        if (!expectedIPA) {
            throw new Error('Could not determine expected IPA. Please provide it manually.');
        }
        
        // Get student IPA from audio
        const studentIPA = await getStudentIPAFromAudio(attempt.audioBlob, attempt.word, expectedIPA);
        
        if (!studentIPA) {
            throw new Error('Could not analyze audio. Please check your audio quality and try again.');
        }
        
        // Calculate deterministic score
        const scoreResult = comparePhonemes(expectedIPA, studentIPA);
        
        // Get AI hints and comments
        let aiComments = 'Analysis complete.';
        let enhancedMismatches = scoreResult.mismatches;
        
        try {
            const hints = await getHintsForMismatches(expectedIPA, studentIPA, attempt.word);
            if (hints) {
                if (hints.aiComments) {
                    aiComments = hints.aiComments;
                }
                
                // Merge AI hints with deterministic mismatches
                if (hints.mismatches && hints.mismatches.length > 0) {
                    enhancedMismatches = scoreResult.mismatches.map((m, idx) => {
                        const aiHint = hints.mismatches.find(h =>
                            h.expected === m.expected && h.actual === m.actual
                        );
                        return {
                            ...m,
                            hint: aiHint?.hint || m.hint
                        };
                    });
                }
            }
        } catch (hintError) {
            console.error('Error getting hints:', hintError);
            // Continue with basic hints
        }
        
        // Find attempt and update with analysis
        const attemptIndex = state.attempts.findIndex(a => a.id === attempt.id);
        if (attemptIndex !== -1) {
            state.attempts[attemptIndex].status = 'complete';
            state.attempts[attemptIndex].analysis = {
                success: true,
                attemptName: attempt.name,
                word: attempt.word,
                expectedIPA,
                studentIPA,
                scorePercent: scoreResult.scorePercent,
                matchCount: scoreResult.matchCount,
                expectedCount: scoreResult.expectedCount,
                mismatches: enhancedMismatches,
                aiComments
            };
            
            saveAttempts();
            renderAttempts();
        }
    } catch (error) {
        console.error('Upload error:', error);
        
        // Update attempt status
        const attemptIndex = state.attempts.findIndex(a => a.id === attempt.id);
        if (attemptIndex !== -1) {
            state.attempts[attemptIndex].status = 'error';
            state.attempts[attemptIndex].error = error.message || 'Failed to analyze pronunciation';
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
    
    // Escape all user inputs to prevent XSS
    const escapedName = escapeHtml(attempt.name);
    const escapedId = escapeHtml(attempt.id);
    const escapedWord = escapeHtml(attempt.word);
    
    return `
        <div class="attempt-card">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg">
                        <input 
                            type="text" 
                            value="${escapedName}" 
                            onchange="updateAttemptName('${escapedId}', this.value)"
                            class="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1">
                    </h3>
                    <p class="text-sm text-gray-600">Word: <span class="font-medium">${escapedWord}</span></p>
                    <p class="text-xs text-gray-500">${formatTimestamp(attempt.timestamp)}</p>
                </div>
                <div class="flex gap-2">
                    ${attempt.status === 'complete' ? `
                        <button 
                            onclick="toggleReveal('${escapedId}')"
                            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            ${attempt.revealed ? '🙈 Hide' : '👁️ Reveal'}
                        </button>
                    ` : ''}
                    <button 
                        onclick="deleteAttempt('${escapedId}')"
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                        🗑️
                    </button>
                </div>
            </div>
            
            <audio id="audio-${escapedId}" controls class="mb-3"></audio>
            
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
                <p class="text-sm text-red-500">${escapeHtml(attempt.error || 'Unknown error')}</p>
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
    
    // Escape all user-controllable data
    const escapedId = escapeHtml(attempt.id);
    const escapedTeacherNotes = escapeHtml(attempt.teacherNotes || '');
    
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
                            Expected "<span class="text-red-600 font-semibold">${escapeHtml(m.expected || '')}</span>" 
                            but got "<span class="text-orange-600 font-semibold">${escapeHtml(m.actual || 'missing')}</span>"
                            ${m.hint ? `<br><span class="text-gray-700">💡 ${escapeHtml(m.hint)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${analysis.aiComments ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <p class="text-sm font-medium text-gray-700 mb-1">AI Feedback:</p>
                    <p class="text-sm text-gray-700">${escapeHtml(analysis.aiComments)}</p>
                </div>
            ` : ''}
            
            <div class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Teacher Override / Notes:</label>
                <textarea 
                    onchange="updateAttemptNotes('${escapedId}', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Add teacher notes or override score...">${escapedTeacherNotes}</textarea>
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
    
    // Show settings if API key not configured
    if (!state.geminiApiKey) {
        setTimeout(() => {
            showToast('Please configure your Gemini API key to get started', 'warning');
            setTimeout(() => {
                openSettings();
            }, 1000);
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
