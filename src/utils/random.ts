/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * Generates a random list of unique token IDs from 0 to maxId - 1.
 * Ensures no duplicates and returns up to maxTokens.
 */
export const getRandomTokenIds = (maxId: number, maxTokens: number = 50): number[] => {
    const allIds = Array.from({ length: maxId }, (_, i) => i);
    const shuffled = shuffleArray(allIds);
    return shuffled.slice(0, Math.min(maxTokens, maxId));
};
  