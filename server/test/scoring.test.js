/**
 * Simple test for scoring algorithm
 * Run with: node test/scoring.test.js
 */

const { levenshteinDistance, calculateSimilarity, calculateScore } = require('../utils/scoring');

console.log('Testing Pronunciation Scoring Algorithm\n');
console.log('='.repeat(50));

// Test 1: Levenshtein Distance
console.log('\n1. Testing Levenshtein Distance:');
const testCases = [
    { str1: 'kitten', str2: 'sitting', expected: 3 },
    { str1: 'saturday', str2: 'sunday', expected: 3 },
    { str1: 'hello', str2: 'hello', expected: 0 },
    { str1: 'abc', str2: 'xyz', expected: 3 }
];

let passed = 0;
let failed = 0;

testCases.forEach(({ str1, str2, expected }) => {
    const result = levenshteinDistance(str1, str2);
    const status = result === expected ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: distance("${str1}", "${str2}") = ${result} (expected ${expected})`);
    if (result === expected) passed++; else failed++;
});

// Test 2: Similarity Calculation
console.log('\n2. Testing Similarity Calculation:');
const similarityTests = [
    { str1: 'hello', str2: 'hello', min: 100, max: 100 },
    { str1: 'hello', str2: 'hallo', min: 75, max: 85 },
    { str1: 'abc', str2: 'xyz', min: 0, max: 10 }
];

similarityTests.forEach(({ str1, str2, min, max }) => {
    const result = calculateSimilarity(str1, str2);
    const status = (result >= min && result <= max) ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: similarity("${str1}", "${str2}") = ${result}% (expected ${min}-${max}%)`);
    if (result >= min && result <= max) passed++; else failed++;
});

// Test 3: IPA Score Calculation
console.log('\n3. Testing IPA Score Calculation:');
const ipaTests = [
    { expected: 'θruː', student: 'θruː', description: 'Perfect match' },
    { expected: 'θruː', student: 'truː', description: 'One phoneme off' },
    { expected: 'hɛloʊ', student: 'hɛloʊ', description: 'Perfect match (hello)' },
    { expected: 'hɛloʊ', student: 'həloʊ', description: 'Close match' }
];

ipaTests.forEach(({ expected, student, description }) => {
    const result = calculateScore(expected, student);
    console.log(`  ${description}:`);
    console.log(`    Expected: "${expected}" → Student: "${student}"`);
    console.log(`    Score: ${result.scorePercent}% (${result.matchCount}/${result.expectedCount} matches)`);
    
    // Basic validation
    if (result.scorePercent >= 0 && result.scorePercent <= 100) {
        console.log(`    ✓ PASS: Valid score range`);
        passed++;
    } else {
        console.log(`    ✗ FAIL: Invalid score: ${result.scorePercent}`);
        failed++;
    }
});

// Test 4: Edge Cases
console.log('\n4. Testing Edge Cases:');
const edgeCases = [
    { expected: '', student: '', description: 'Empty strings' },
    { expected: 'abc', student: '', description: 'Empty student' },
    { expected: '', student: 'abc', description: 'Empty expected' }
];

edgeCases.forEach(({ expected, student, description }) => {
    const result = calculateScore(expected, student);
    const isValid = !isNaN(result.scorePercent) && result.scorePercent >= 0 && result.scorePercent <= 100;
    const status = isValid ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: ${description} → Score: ${result.scorePercent}%`);
    if (isValid) passed++; else failed++;
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\nTest Summary:');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed === 0) {
    console.log('\n✓ All tests passed!\n');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed.\n');
    process.exit(1);
}
