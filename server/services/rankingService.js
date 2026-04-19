/**
 * Ranking Service
 * Scores and ranks results using:
 * - TF-IDF semantic similarity (local, no external API)
 * - Recency boost
 * - Source credibility
 * - Citation count
 */

// ─── TF-IDF Utilities ────────────────────────────────────────────────────────

function tokenize(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);
}

const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'with', 'this', 'that',
    'was', 'were', 'been', 'has', 'have', 'had', 'did', 'does', 'from',
    'they', 'their', 'its', 'our', 'can', 'may', 'also', 'such', 'than',
    'these', 'those', 'when', 'into', 'each', 'more', 'which', 'who'
]);

function getTermFreq(tokens) {
    const freq = {};
    tokens.forEach(t => {
        if (!STOP_WORDS.has(t)) {
            freq[t] = (freq[t] || 0) + 1;
        }
    });
    return freq;
}

function cosineSimilarity(tf1, tf2) {
    const terms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
    let dot = 0, mag1 = 0, mag2 = 0;

    terms.forEach(term => {
        const v1 = tf1[term] || 0;
        const v2 = tf2[term] || 0;
        dot += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// ─── Source Credibility Weights ───────────────────────────────────────────────

const SOURCE_WEIGHTS = {
    'PubMed': 1.0,
    'OpenAlex': 0.85,
    'ClinicalTrials.gov': 0.9
};

// Top journals get extra boost
const PRESTIGE_JOURNALS = [
    'nature', 'science', 'cell', 'lancet', 'nejm', 'new england journal',
    'jama', 'bmj', 'annals', 'plos', 'brain', 'neurology', 'oncology'
];

function getJournalBoost(journal) {
    const lj = (journal || '').toLowerCase();
    return PRESTIGE_JOURNALS.some(j => lj.includes(j)) ? 1.3 : 1.0;
}

// ─── Recency Boost ────────────────────────────────────────────────────────────

function getRecencyScore(year) {
    if (!year) return 0.5;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age <= 1) return 1.0;
    if (age <= 3) return 0.9;
    if (age <= 5) return 0.75;
    if (age <= 10) return 0.55;
    return 0.3;
}

// ─── Citation Score ───────────────────────────────────────────────────────────

function getCitationScore(citedBy) {
    if (!citedBy) return 0.5;
    if (citedBy >= 500) return 1.0;
    if (citedBy >= 100) return 0.85;
    if (citedBy >= 50) return 0.7;
    if (citedBy >= 10) return 0.6;
    return 0.5;
}

// ─── Publication Ranking ─────────────────────────────────────────────────────

function rankPublications(publications, queryTerms, topN = 8) {
    const queryTokens = tokenize(queryTerms);
    const queryTF = getTermFreq(queryTokens);

    const scored = publications.map(pub => {
        const text = `${pub.title} ${pub.abstract}`.repeat(2); // Title weighted more
        const titleText = pub.title || '';
        const textTokens = tokenize(text);
        const titleTokens = tokenize(titleText);

        const textTF = getTermFreq(textTokens);
        const titleTF = getTermFreq(titleTokens);

        // Title similarity gets 2x weight
        const textSim = cosineSimilarity(queryTF, textTF);
        const titleSim = cosineSimilarity(queryTF, titleTF);
        const semanticScore = (textSim * 0.4 + titleSim * 0.6);

        const recencyScore = getRecencyScore(pub.year);
        const citationScore = getCitationScore(pub.citedBy);
        const sourceWeight = SOURCE_WEIGHTS[pub.source] || 0.7;
        const journalBoost = getJournalBoost(pub.journal);

        const finalScore = (
            semanticScore * 0.45 +
            recencyScore * 0.25 +
            citationScore * 0.15 +
            sourceWeight * 0.15
        ) * journalBoost;

        return { ...pub, scores: { semantic: semanticScore, recency: recencyScore, citation: citationScore, final: finalScore } };
    });

    return scored
        .sort((a, b) => b.scores.final - a.scores.final)
        .slice(0, topN);
}

// ─── Trial Ranking ────────────────────────────────────────────────────────────

function rankTrials(trials, queryTerms, topN = 6) {
    const queryTokens = tokenize(queryTerms);
    const queryTF = getTermFreq(queryTokens);

    // Status boost
    const STATUS_BOOST = {
        'RECRUITING': 1.2,
        'ACTIVE_NOT_RECRUITING': 1.1,
        'COMPLETED': 1.0,
        'ENROLLING_BY_INVITATION': 0.9
    };

    const scored = trials.map(trial => {
        const text = `${trial.title} ${trial.description} ${trial.interventions?.join(' ')}`;
        const textTF = getTermFreq(tokenize(text));
        const semanticScore = cosineSimilarity(queryTF, textTF);

        const statusBoost = STATUS_BOOST[trial.status] || 0.8;
        const phaseScore = trial.phase?.includes('3') ? 1.2 :
            trial.phase?.includes('2') ? 1.0 :
                trial.phase?.includes('4') ? 1.1 : 0.8;

        const enrollmentScore = trial.enrollment >= 500 ? 1.1 :
            trial.enrollment >= 100 ? 1.0 : 0.9;

        const finalScore = semanticScore * 0.5 * statusBoost * phaseScore * enrollmentScore;

        return { ...trial, scores: { semantic: semanticScore, final: finalScore } };
    });

    return scored
        .sort((a, b) => b.scores.final - a.scores.final)
        .slice(0, topN);
}

// ─── Top Authors ──────────────────────────────────────────────────────────────

function extractTopAuthors(publications, topN = 10) {
    const authorCount = {};

    publications.forEach(pub => {
        (pub.authors || []).forEach(author => {
            if (author && author !== 'Unknown') {
                authorCount[author] = (authorCount[author] || 0) + 1;
            }
        });
    });

    return Object.entries(authorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([name, count]) => ({ name, publications: count }));
}

module.exports = { rankPublications, rankTrials, extractTopAuthors };
