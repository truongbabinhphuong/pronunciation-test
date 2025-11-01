/**
 * Scoring utilities for pronunciation comparison
 * Provides deterministic scoring based on phoneme comparison
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for phoneme sequence alignment
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    // Create distance matrix
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],      // deletion
                    dp[i][j - 1],      // insertion
                    dp[i - 1][j - 1]   // substitution
                );
            }
        }
    }
    
    return dp[m][n];
}

/**
 * Calculate similarity score as percentage
 */
function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    
    const distance = levenshteinDistance(str1, str2);
    const similarity = ((maxLen - distance) / maxLen) * 100;
    
    return Math.round(similarity);
}

/**
 * Calculate pronunciation score
 * Returns score percentage and detailed information
 */
function calculateScore(expectedIPA, studentIPA) {
    if (!expectedIPA || !studentIPA) {
        return {
            scorePercent: 0,
            matchCount: 0,
            expectedCount: expectedIPA ? expectedIPA.length : 0
        };
    }
    
    // Calculate similarity
    const scorePercent = calculateSimilarity(expectedIPA, studentIPA);
    
    // Calculate matches (approximate)
    const maxLen = Math.max(expectedIPA.length, studentIPA.length);
    const distance = levenshteinDistance(expectedIPA, studentIPA);
    const matchCount = maxLen - distance;
    
    return {
        scorePercent,
        matchCount: Math.max(0, matchCount),
        expectedCount: expectedIPA.length
    };
}

module.exports = {
    levenshteinDistance,
    calculateSimilarity,
    calculateScore
};
