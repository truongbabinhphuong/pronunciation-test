/**
 * Pronunciation Competition - Server
 * Express server for analyzing student pronunciation using Gemini AI
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Import utilities
const { calculateScore, levenshteinDistance } = require('./utils/scoring');
const { runAligner, parseAlignerOutput } = require('./utils/aligner-wrapper');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const USE_FORCED_ALIGNER = process.env.USE_FORCED_ALIGNER === 'true';
const ALIGNER_TYPE = process.env.ALIGNER_TYPE || 'mfa';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const DEBUG = process.env.DEBUG === 'true';

// Validate required configuration
if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is required. Please set it in .env file');
    console.error('Get your key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
}

// ============================================================================
// EXPRESS SETUP
// ============================================================================

const app = express();

// Middleware
// CORS Configuration
// NOTE: For production, set CORS_ORIGIN to your specific frontend domain in .env
// Example: CORS_ORIGIN=https://yourusername.github.io
// WARNING: Using '*' allows any origin and should only be used for development/testing
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
}));

// Rate Limiting Recommendation:
// For production, consider adding rate limiting middleware to prevent abuse:
// const rateLimit = require('express-rate-limit');
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use('/api/', limiter);

app.use(express.json());

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// ============================================================================
// LOGGING UTILITY
// ============================================================================

function log(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// ============================================================================
// GEMINI API FUNCTIONS
// ============================================================================

/**
 * Call Gemini API to get IPA from word
 */
async function getIPAFromWord(word) {
    try {
        const prompt = `Return ONLY the International Phonetic Alphabet (IPA) transcription for the English word "${word}". Return just the IPA symbols, nothing else. Use standard IPA notation.`;
        
        const response = await fetch(
            `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
        
        const data = await response.json();
        log('Gemini IPA lookup response:', JSON.stringify(data, null, 2));
        
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
 * Call Gemini API to analyze audio and get student IPA
 * Note: This is a template - actual implementation depends on Gemini's audio API availability
 */
async function getStudentIPAFromAudio(audioPath, word, expectedIPA) {
    try {
        // Read audio file
        const audioBuffer = await fs.readFile(audioPath);
        const audioBase64 = audioBuffer.toString('base64');
        
        // Determine MIME type from file extension
        const ext = path.extname(audioPath).toLowerCase();
        let mimeType = 'audio/webm';
        if (ext === '.mp3') mimeType = 'audio/mp3';
        else if (ext === '.wav') mimeType = 'audio/wav';
        else if (ext === '.ogg') mimeType = 'audio/ogg';
        else if (ext === '.mp4') mimeType = 'audio/mp4';
        
        const prompt = `You are a precise phonetics assistant. Listen to this audio clip of a student attempting to pronounce the word "${word}".

Task: Transcribe the student's pronunciation into IPA (International Phonetic Alphabet) notation. Return ONLY the IPA transcription, nothing else. Be as accurate as possible with the phonetic symbols.

${expectedIPA ? `Expected pronunciation: ${expectedIPA}` : ''}

Return just the IPA symbols for what you hear.`;

        const response = await fetch(
            `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
        
        const data = await response.json();
        log('Gemini audio analysis response:', JSON.stringify(data, null, 2));
        
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
        return null;
    }
}

/**
 * Call Gemini API to get hints for mismatches
 */
async function getHintsForMismatches(expectedIPA, studentIPA, word) {
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
            `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
        
        const data = await response.json();
        log('Gemini hints response:', JSON.stringify(data, null, 2));
        
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

// ============================================================================
// PHONEME COMPARISON & SCORING
// ============================================================================

/**
 * Split IPA string into phonemes
 * This is a simplified version - real IPA parsing is more complex
 */
function splitIntoPhonemes(ipa) {
    if (!ipa) return [];
    
    // Validate IPA string length to prevent DoS
    if (typeof ipa !== 'string' || ipa.length > 500) {
        console.warn('IPA string is invalid or too long:', ipa?.length);
        return [];
    }
    
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
            // Skip modifiers that attach to previous phoneme (simplified)
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
 * Compare phonemes and find mismatches using deterministic algorithm
 */
function comparePhonemes(expectedIPA, studentIPA) {
    const expectedPhonemes = splitIntoPhonemes(expectedIPA);
    const studentPhonemes = splitIntoPhonemes(studentIPA);
    
    const expectedCount = expectedPhonemes.length;
    let matchCount = 0;
    const mismatches = [];
    
    // Use Levenshtein-based alignment for comparison
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

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!GEMINI_API_KEY,
        forcedAlignerEnabled: USE_FORCED_ALIGNER
    });
});

/**
 * Lookup IPA for a word
 */
app.post('/api/lookup-ipa', async (req, res) => {
    try {
        const { word } = req.body;
        
        if (!word) {
            return res.status(400).json({
                success: false,
                error: 'Word is required'
            });
        }
        
        const ipa = await getIPAFromWord(word);
        
        if (ipa) {
            res.json({
                success: true,
                word,
                ipa
            });
        } else {
            res.json({
                success: false,
                error: 'Could not determine IPA for this word'
            });
        }
    } catch (error) {
        console.error('Error in /api/lookup-ipa:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Analyze pronunciation attempt
 */
app.post('/api/analyze', upload.single('audio'), async (req, res) => {
    let audioPath = null;
    
    try {
        // Validate request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Audio file is required'
            });
        }
        
        const { word, attemptName, expectedIPA: expectedIPAInput } = req.body;
        
        // Validate inputs
        if (!word || typeof word !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Word is required and must be a string'
            });
        }
        
        // Prevent excessively long inputs
        if (word.length > 100 || (expectedIPAInput && expectedIPAInput.length > 200)) {
            return res.status(400).json({
                success: false,
                error: 'Input too long'
            });
        }
        
        audioPath = req.file.path;
        
        // Validate audio path to prevent path traversal
        const normalizedPath = path.normalize(audioPath);
        const uploadsPath = path.resolve(uploadsDir);
        const resolvedPath = path.resolve(normalizedPath);
        
        if (!resolvedPath.startsWith(uploadsPath)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file path'
            });
        }
        
        log('Processing audio file:', audioPath);
        log('Word:', word, 'Expected IPA:', expectedIPAInput);
        
        // Get expected IPA if not provided
        let expectedIPA = expectedIPAInput;
        if (!expectedIPA) {
            expectedIPA = await getIPAFromWord(word);
            log('Looked up IPA:', expectedIPA);
        }
        
        if (!expectedIPA) {
            return res.status(400).json({
                success: false,
                error: 'Could not determine expected IPA. Please provide it manually.'
            });
        }
        
        let studentIPA = null;
        let alignerOutput = null;
        let processingMethod = 'gemini';
        
        // Try forced aligner if enabled
        if (USE_FORCED_ALIGNER) {
            try {
                log('Attempting forced aligner...');
                const alignerResult = await runAligner(audioPath, word, expectedIPA, ALIGNER_TYPE);
                
                if (alignerResult && alignerResult.success) {
                    studentIPA = alignerResult.studentIPA;
                    alignerOutput = alignerResult.rawOutput;
                    processingMethod = `aligner-${ALIGNER_TYPE}`;
                    log('Aligner succeeded:', studentIPA);
                } else {
                    log('Aligner failed, falling back to Gemini');
                }
            } catch (alignerError) {
                console.error('Aligner error:', alignerError);
                log('Aligner error, falling back to Gemini');
            }
        }
        
        // Fall back to Gemini if aligner didn't work
        if (!studentIPA) {
            log('Using Gemini for audio analysis...');
            studentIPA = await getStudentIPAFromAudio(audioPath, word, expectedIPA);
            
            if (!studentIPA) {
                return res.status(500).json({
                    success: false,
                    error: 'Could not analyze audio. Please check your audio quality and try again.'
                });
            }
        }
        
        log('Student IPA:', studentIPA);
        
        // Calculate deterministic score
        const scoreResult = comparePhonemes(expectedIPA, studentIPA);
        
        // Get AI hints and comments from Gemini
        let aiComments = 'Analysis complete.';
        let enhancedMismatches = scoreResult.mismatches;
        
        try {
            const hints = await getHintsForMismatches(expectedIPA, studentIPA, word);
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
        
        // Build response
        const response = {
            success: true,
            attemptName: attemptName || 'Unnamed',
            word,
            expectedIPA,
            studentIPA,
            scorePercent: scoreResult.scorePercent,
            matchCount: scoreResult.matchCount,
            expectedCount: scoreResult.expectedCount,
            mismatches: enhancedMismatches,
            aiComments,
            notes: `processed-with-${processingMethod}`
        };
        
        if (alignerOutput) {
            response.rawAlignerOutput = alignerOutput;
        }
        
        log('Sending response:', response);
        res.json(response);
        
    } catch (error) {
        console.error('Error in /api/analyze:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    } finally {
        // Clean up uploaded file
        if (audioPath) {
            try {
                await fs.unlink(audioPath);
                log('Cleaned up audio file:', audioPath);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('Pronunciation Competition Server');
    console.log('='.repeat(60));
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/analyze`);
    console.log('');
    console.log('Configuration:');
    console.log(`  Gemini Model: ${GEMINI_MODEL}`);
    console.log(`  Gemini API Key: ${GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    console.log(`  Forced Aligner: ${USE_FORCED_ALIGNER ? `Enabled (${ALIGNER_TYPE})` : 'Disabled'}`);
    console.log(`  CORS Origin: ${CORS_ORIGIN}`);
    console.log(`  Debug Mode: ${DEBUG ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(60));
    
    if (!GEMINI_API_KEY) {
        console.error('\n⚠️  WARNING: GEMINI_API_KEY not set! Server will not work properly.');
        console.error('    Set it in .env file. Get key from: https://makersuite.google.com/app/apikey\n');
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
