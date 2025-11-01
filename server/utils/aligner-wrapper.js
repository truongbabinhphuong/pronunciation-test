/**
 * Forced Aligner Wrapper
 * Supports Montreal Forced Aligner (MFA) and Gentle
 * 
 * NOTE: This is a template implementation. Actual aligner integration
 * requires the aligner to be installed on the system.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run forced aligner on audio file
 * @param {string} audioPath - Path to audio file
 * @param {string} word - Target word
 * @param {string} expectedIPA - Expected IPA transcription
 * @param {string} alignerType - Type of aligner ('mfa' or 'gentle')
 * @returns {Promise<object>} Aligner result with studentIPA
 */
async function runAligner(audioPath, word, expectedIPA, alignerType = 'mfa') {
    try {
        if (alignerType === 'mfa') {
            return await runMFA(audioPath, word, expectedIPA);
        } else if (alignerType === 'gentle') {
            return await runGentle(audioPath, word);
        } else {
            throw new Error(`Unknown aligner type: ${alignerType}`);
        }
    } catch (error) {
        console.error('Aligner error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Run Montreal Forced Aligner
 * 
 * Installation instructions:
 * 1. Install MFA: conda install -c conda-forge montreal-forced-aligner
 * 2. Download acoustic model: mfa model download acoustic english_us_arpa
 * 3. Download dictionary: mfa model download dictionary english_us_arpa
 * 
 * For more info: https://montreal-forced-aligner.readthedocs.io/
 */
async function runMFA(audioPath, word, expectedIPA) {
    return new Promise((resolve, reject) => {
        // TODO: Implement MFA integration
        // This is a placeholder implementation
        
        console.log('[MFA] Aligner called but not fully implemented');
        console.log('[MFA] To implement:');
        console.log('  1. Create temporary text file with word transcription');
        console.log('  2. Run: mfa align <audio_path> <dict_path> <acoustic_model> <output_dir>');
        console.log('  3. Parse TextGrid output to extract phoneme timings');
        console.log('  4. Convert aligned phonemes to IPA');
        
        // Placeholder response
        resolve({
            success: false,
            error: 'MFA not fully implemented. Install MFA and update this function.',
            message: 'See server/utils/aligner-wrapper.js for implementation notes'
        });
        
        /* Example implementation structure:
        
        const tempDir = path.join(__dirname, '../../temp-mfa');
        await fs.mkdir(tempDir, { recursive: true });
        
        // Create transcript file
        const transcriptPath = path.join(tempDir, 'transcript.txt');
        await fs.writeFile(transcriptPath, word);
        
        // Run MFA
        const mfaProcess = spawn('mfa', [
            'align',
            audioPath,
            transcriptPath,
            process.env.MFA_DICTIONARY_PATH || 'english_us_arpa',
            'english_us_arpa',
            tempDir
        ]);
        
        let stdout = '';
        let stderr = '';
        
        mfaProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        mfaProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        mfaProcess.on('close', async (code) => {
            if (code === 0) {
                // Parse TextGrid file
                const textGridPath = path.join(tempDir, path.basename(audioPath, path.extname(audioPath)) + '.TextGrid');
                const alignmentData = await parseTextGrid(textGridPath);
                
                resolve({
                    success: true,
                    studentIPA: alignmentData.ipa,
                    alignment: alignmentData.phonemes,
                    rawOutput: stdout
                });
            } else {
                resolve({
                    success: false,
                    error: stderr || 'MFA alignment failed'
                });
            }
            
            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
        });
        
        */
    });
}

/**
 * Run Gentle forced aligner
 * 
 * Installation instructions:
 * 1. Install Gentle: https://github.com/lowerquality/gentle
 * 2. Start Gentle server: python serve.py
 * 3. Default runs on http://localhost:8765
 */
async function runGentle(audioPath, word) {
    return new Promise((resolve, reject) => {
        // TODO: Implement Gentle integration
        
        console.log('[Gentle] Aligner called but not fully implemented');
        console.log('[Gentle] To implement:');
        console.log('  1. Send POST request to http://localhost:8765/transcriptions');
        console.log('  2. Include audio file and transcript');
        console.log('  3. Parse JSON response with phoneme timings');
        
        resolve({
            success: false,
            error: 'Gentle not fully implemented. Install Gentle and update this function.',
            message: 'See server/utils/aligner-wrapper.js for implementation notes'
        });
        
        /* Example implementation structure:
        
        const FormData = require('form-data');
        const fetch = require('node-fetch');
        
        const form = new FormData();
        form.append('audio', fs.createReadStream(audioPath));
        form.append('transcript', word);
        
        const response = await fetch('http://localhost:8765/transcriptions?async=false', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        
        if (result.words && result.words.length > 0) {
            // Extract phonemes from result
            const phonemes = result.words[0].phones || [];
            const studentIPA = phonemesToIPA(phonemes);
            
            resolve({
                success: true,
                studentIPA,
                alignment: phonemes,
                rawOutput: JSON.stringify(result, null, 2)
            });
        } else {
            resolve({
                success: false,
                error: 'Gentle could not align audio'
            });
        }
        
        */
    });
}

/**
 * Parse aligner output to extract student IPA
 * This is a simplified parser - actual implementation depends on aligner format
 */
function parseAlignerOutput(rawOutput, alignerType) {
    // TODO: Implement parser for specific aligner format
    
    console.log('[Parser] Parsing aligner output (placeholder)');
    
    return {
        studentIPA: null,
        phonemes: [],
        error: 'Parser not implemented'
    };
}

/**
 * Parse TextGrid file from MFA
 * TextGrid is a Praat format file containing alignment data
 */
async function parseTextGrid(textGridPath) {
    // TODO: Implement TextGrid parser
    // See: https://github.com/kylebgorman/textgrid
    
    const content = await fs.readFile(textGridPath, 'utf-8');
    
    // Placeholder parsing
    return {
        ipa: '',
        phonemes: []
    };
}

/**
 * Convert ARPABET or other phoneme notation to IPA
 */
function phonemesToIPA(phonemes) {
    // Mapping from ARPABET to IPA (simplified)
    const arpabetToIPA = {
        'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ',
        'AY': 'aɪ', 'B': 'b', 'CH': 't͡ʃ', 'D': 'd', 'DH': 'ð',
        'EH': 'ɛ', 'ER': 'ɚ', 'EY': 'eɪ', 'F': 'f', 'G': 'ɡ',
        'HH': 'h', 'IH': 'ɪ', 'IY': 'i', 'JH': 'd͡ʒ', 'K': 'k',
        'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'OW': 'oʊ',
        'OY': 'ɔɪ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ',
        'T': 't', 'TH': 'θ', 'UH': 'ʊ', 'UW': 'u', 'V': 'v',
        'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
    };
    
    return phonemes.map(p => {
        // Remove stress markers (0, 1, 2)
        const clean = p.replace(/[012]/g, '');
        return arpabetToIPA[clean] || p;
    }).join('');
}

module.exports = {
    runAligner,
    parseAlignerOutput,
    phonemesToIPA
};
