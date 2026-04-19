/**
 * Query Expansion Service
 * Converts user input into optimized multi-source queries
 */

const MEDICAL_SYNONYMS = {
    'parkinson': ["Parkinson's disease", 'PD', 'parkinsonism', 'dopaminergic disorder'],
    'alzheimer': ["Alzheimer's disease", 'AD', 'dementia', 'amyloid pathology'],
    'cancer': ['neoplasm', 'carcinoma', 'oncology', 'tumor', 'malignancy'],
    'diabetes': ['diabetes mellitus', 'T2DM', 'T1DM', 'hyperglycemia', 'insulin resistance'],
    'stroke': ['cerebrovascular accident', 'CVA', 'ischemic stroke', 'hemorrhagic stroke'],
    'depression': ['major depressive disorder', 'MDD', 'clinical depression', 'depressive episode'],
    'anxiety': ['anxiety disorder', 'GAD', 'panic disorder', 'generalized anxiety'],
    'hypertension': ['high blood pressure', 'HTN', 'arterial hypertension'],
    'asthma': ['bronchial asthma', 'reactive airway disease', 'obstructive airway'],
    'epilepsy': ['seizure disorder', 'convulsive disorder', 'epileptic seizures'],
    'ms': ['multiple sclerosis', 'demyelinating disease', 'MS'],
    'copd': ['chronic obstructive pulmonary disease', 'emphysema', 'chronic bronchitis'],
    'hiv': ['HIV/AIDS', 'human immunodeficiency virus', 'antiretroviral therapy'],
    'lupus': ['systemic lupus erythematosus', 'SLE', 'autoimmune disease'],
    'arthritis': ['rheumatoid arthritis', 'RA', 'inflammatory arthritis', 'joint disease']
};

const TREATMENT_TERMS = {
    'dbs': 'Deep Brain Stimulation',
    'cbt': 'Cognitive Behavioral Therapy',
    'rct': 'Randomized Controlled Trial',
    'immunotherapy': 'immunotherapy cancer treatment',
    'gene therapy': 'gene therapy genetic treatment',
    'stem cell': 'stem cell therapy regenerative medicine'
};

/**
 * Expand a raw query into multiple optimized search queries
 */
function expandQuery(params) {
    const { disease, query, location, freeText, patientName, deepResearch } = params;

    const components = [];
    const diseaseNorm = (disease || '').toLowerCase().trim();
    const queryTerm = (query || '').trim();
    const freeTextTerm = (freeText || '').trim();

    // Get synonyms for disease
    let diseaseAlt = [];
    for (const [key, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
        if (diseaseNorm.includes(key)) {
            diseaseAlt = synonyms;
            break;
        }
    }

    const primaryDisease = disease || freeTextTerm || 'medical research';
    const diseaseStr = diseaseAlt.length > 0
        ? `(${primaryDisease} OR ${diseaseAlt.slice(0, 2).join(' OR ')})`
        : primaryDisease;

    // Resolve treatment abbreviations
    let expandedQuery = queryTerm;
    for (const [abbr, full] of Object.entries(TREATMENT_TERMS)) {
        if (queryTerm.toLowerCase().includes(abbr)) {
            expandedQuery = queryTerm.replace(new RegExp(abbr, 'gi'), full);
        }
    }

    // Build compound boolean query
    const parts = [];
    if (diseaseStr) parts.push(diseaseStr);
    if (expandedQuery) parts.push(expandedQuery);

    const baseQuery = parts.join(' AND ');

    // Different variants for different APIs
    const pubmedQuery = buildPubMedQuery(primaryDisease, expandedQuery, diseaseAlt, location);
    const openAlexQuery = buildOpenAlexQuery(primaryDisease, expandedQuery, deepResearch);
    const trialsQuery = buildTrialsQuery(primaryDisease, expandedQuery, location);

    return {
        base: baseQuery,
        pubmed: pubmedQuery,
        openAlex: openAlexQuery,
        trials: trialsQuery,
        display: `${primaryDisease}${expandedQuery ? ' + ' + expandedQuery : ''}`,
        terms: {
            disease: primaryDisease,
            treatment: expandedQuery,
            location: location || null
        }
    };
}

function buildPubMedQuery(disease, treatment, synonyms, location) {
    let query = disease;
    if (treatment) query += ` AND ${treatment}`;

    // Add MeSH-style terms
    const meshTerms = ['clinical trial', 'systematic review', 'meta-analysis', 'randomized controlled trial'];
    if (treatment) {
        query += ` AND (${meshTerms.slice(0, 2).join(' OR ')})`;
    }

    if (synonyms.length > 0) {
        query += ` OR (${synonyms[0]} AND ${treatment || 'treatment'})`;
    }

    return query;
}

function buildOpenAlexQuery(disease, treatment, deepResearch) {
    let query = disease;
    if (treatment) query += ` ${treatment}`;
    if (deepResearch) {
        query += ' clinical trial efficacy outcomes';
    }
    return query;
}

function buildTrialsQuery(disease, treatment, location) {
    return {
        condition: disease,
        intervention: treatment || '',
        location: location || '',
        status: ['RECRUITING', 'COMPLETED', 'ACTIVE_NOT_RECRUITING']
    };
}

/**
 * Extract key medical entities from free text
 */
function extractEntities(text) {
    const entities = {
        diseases: [],
        treatments: [],
        drugs: []
    };

    const diseasePattern = Object.keys(MEDICAL_SYNONYMS);
    const lowerText = text.toLowerCase();

    diseasePattern.forEach(key => {
        if (lowerText.includes(key)) {
            entities.diseases.push(MEDICAL_SYNONYMS[key][0]);
        }
    });

    return entities;
}

module.exports = { expandQuery, extractEntities };
