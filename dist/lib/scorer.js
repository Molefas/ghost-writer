export function scoreInspiration(title, description, interestsContent) {
    const keywords = extractKeywords(interestsContent);
    if (keywords.length === 0)
        return 5; // Default score when no interests defined
    const text = `${title} ${description}`.toLowerCase();
    let matchCount = 0;
    for (const keyword of keywords) {
        if (text.includes(keyword)) {
            matchCount++;
        }
    }
    // Scale: 0 matches = 1, all matches = 10
    const ratio = matchCount / keywords.length;
    return Math.max(1, Math.min(10, Math.round(1 + ratio * 9)));
}
function extractKeywords(interestsContent) {
    const keywords = [];
    const lines = interestsContent.toLowerCase().split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headers and empty lines
        if (trimmed.startsWith('#') || trimmed.startsWith('<!--') || !trimmed)
            continue;
        // Extract items from list lines (- item, * item)
        const listMatch = trimmed.match(/^[-*]\s+(.+)/);
        if (listMatch) {
            // Split compound interests (e.g., "AI and machine learning" → ["ai", "machine learning"])
            const parts = listMatch[1]
                .split(/\s+and\s+|\s*,\s*/)
                .map((p) => p.trim())
                .filter((p) => p.length > 0);
            keywords.push(...parts);
        }
    }
    return keywords;
}
