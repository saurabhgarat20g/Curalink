/**
 * Retrieval Service
 * Parallel fetching from OpenAlex, PubMed, ClinicalTrials.gov
 */

const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');

// 30-minute cache
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

const OPENALEX_BASE = 'https://api.openalex.org';
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TRIALS_BASE = 'https://clinicaltrials.gov/api/v2';

const axiosInstance = axios.create({
    timeout: 20000,
    headers: { 'User-Agent': 'CauraMedResearch/1.0 (research@caura.io)' }
});

// ─── OpenAlex ────────────────────────────────────────────────────────────────

async function fetchOpenAlex(query, deepResearch = false) {
    const cacheKey = `openalex_${query}_${deepResearch}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const limit = deepResearch ? 200 : 100;
    const perPage = 25;
    const pages = Math.ceil(limit / perPage);
    const results = [];

    try {
        for (let page = 1; page <= pages; page++) {
            const url = `${OPENALEX_BASE}/works`;
            const params = {
                search: query,
                per_page: perPage,
                page,
                sort: 'relevance_score:desc',
                filter: 'type:article,has_abstract:true',
                select: 'id,doi,title,authorships,publication_year,primary_location,abstract_inverted_index,cited_by_count,concepts,open_access'
            };

            const res = await axiosInstance.get(url, { params });
            const works = res.data?.results || [];

            works.forEach(work => {
                const abstract = reconstructAbstract(work.abstract_inverted_index);
                if (!abstract && !work.title) return;

                const authors = (work.authorships || [])
                    .slice(0, 5)
                    .map(a => a.author?.display_name || 'Unknown');

                results.push({
                    id: work.id,
                    title: work.title || 'Untitled',
                    abstract: abstract || '',
                    authors,
                    year: work.publication_year || null,
                    url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id,
                    source: 'OpenAlex',
                    journal: work.primary_location?.source?.display_name || 'Unknown Journal',
                    citedBy: work.cited_by_count || 0,
                    isOpenAccess: work.open_access?.is_oa || false,
                    concepts: (work.concepts || []).slice(0, 5).map(c => c.display_name),
                    type: 'publication'
                });
            });

            if (works.length < perPage) break; // No more pages
        }

        cache.set(cacheKey, results);
        return results;
    } catch (err) {
        console.error('OpenAlex fetch error:', err.message);
        return [];
    }
}

function reconstructAbstract(invertedIndex) {
    if (!invertedIndex) return '';
    try {
        const words = {};
        for (const [word, positions] of Object.entries(invertedIndex)) {
            positions.forEach(pos => { words[pos] = word; });
        }
        return Object.keys(words)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(k => words[k])
            .join(' ');
    } catch {
        return '';
    }
}

// ─── PubMed ──────────────────────────────────────────────────────────────────

async function fetchPubMed(query, deepResearch = false) {
    const cacheKey = `pubmed_${query}_${deepResearch}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const retMax = deepResearch ? 150 : 80;

    try {
        // Step 1: esearch
        const searchUrl = `${PUBMED_BASE}/esearch.fcgi`;
        const searchParams = {
            db: 'pubmed',
            term: query,
            retmax: retMax,
            retmode: 'json',
            sort: 'relevance',
            usehistory: 'y',
            ...(process.env.PUBMED_API_KEY ? { api_key: process.env.PUBMED_API_KEY } : {})
        };

        const searchRes = await axiosInstance.get(searchUrl, { params: searchParams });
        const ids = searchRes.data?.esearchresult?.idlist || [];

        if (ids.length === 0) return [];

        // Step 2: efetch in batches
        const batchSize = 20;
        const results = [];

        for (let i = 0; i < ids.length; i += batchSize) {
            const batchIds = ids.slice(i, i + batchSize);
            const fetchUrl = `${PUBMED_BASE}/efetch.fcgi`;
            const fetchParams = {
                db: 'pubmed',
                id: batchIds.join(','),
                retmode: 'xml',
                rettype: 'abstract',
                ...(process.env.PUBMED_API_KEY ? { api_key: process.env.PUBMED_API_KEY } : {})
            };

            const fetchRes = await axiosInstance.get(fetchUrl, { params: fetchParams });
            const parsed = await parsePubMedXML(fetchRes.data);
            results.push(...parsed);

            // Small delay to be kind to NCBI
            if (i + batchSize < ids.length) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        cache.set(cacheKey, results);
        return results;
    } catch (err) {
        console.error('PubMed fetch error:', err.message);
        return [];
    }
}

async function parsePubMedXML(xmlData) {
    try {
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const result = await parser.parseStringPromise(xmlData);
        const articles = result?.PubmedArticleSet?.PubmedArticle || [];
        const articleArr = Array.isArray(articles) ? articles : [articles];

        return articleArr.map(article => {
            const medline = article?.MedlineCitation;
            const artData = medline?.Article;
            if (!artData) return null;

            // Authors
            const authorList = artData?.AuthorList?.Author;
            const authorsArr = authorList
                ? (Array.isArray(authorList) ? authorList : [authorList])
                : [];
            const authors = authorsArr.slice(0, 5).map(a => {
                const last = a.LastName || '';
                const fore = a.ForeName || a.Initials || '';
                return `${last}${fore ? ' ' + fore : ''}`.trim() || 'Unknown';
            });

            // Abstract
            const abstractObj = artData?.Abstract?.AbstractText;
            let abstract = '';
            if (typeof abstractObj === 'string') {
                abstract = abstractObj;
            } else if (Array.isArray(abstractObj)) {
                abstract = abstractObj.map(a => (typeof a === 'string' ? a : a._ || '')).join(' ');
            } else if (abstractObj?._) {
                abstract = abstractObj._;
            }

            // Year
            const pubDate = artData?.Journal?.JournalIssue?.PubDate;
            const year = pubDate?.Year || pubDate?.MedlineDate?.slice(0, 4) || null;

            // PMID
            const pmid = medline?.PMID?._ || medline?.PMID || '';

            return {
                id: `pmid_${pmid}`,
                title: artData?.ArticleTitle?._ || artData?.ArticleTitle || 'Untitled',
                abstract: abstract.trim(),
                authors,
                year: year ? parseInt(year) : null,
                url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
                source: 'PubMed',
                journal: artData?.Journal?.Title || 'Unknown Journal',
                pmid,
                type: 'publication'
            };
        }).filter(Boolean);
    } catch (err) {
        console.error('PubMed XML parse error:', err.message);
        return [];
    }
}

// ─── ClinicalTrials.gov ──────────────────────────────────────────────────────

async function fetchClinicalTrials(trialParams) {
    const { condition, intervention, location, status } = trialParams;
    const cacheKey = `trials_${condition}_${intervention}_${location}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const params = {
            format: 'json',
            pageSize: 100,
            'query.cond': condition,
            'filter.overallStatus': status.join(',')
        };

        if (intervention) params['query.intr'] = intervention;
        if (location) params['query.locn'] = location;

        const res = await axiosInstance.get(`${TRIALS_BASE}/studies`, { params });
        const studies = res.data?.studies || [];

        const trials = studies.map(study => {
            const proto = study.protocolSection;
            const id = proto?.identificationModule?.nctId;
            const brief = proto?.descriptionModule?.briefSummary || '';
            const detailed = proto?.descriptionModule?.detailedDescription || '';

            const conditions = proto?.conditionsModule?.conditions || [];
            const interventions = (proto?.armsInterventionsModule?.interventions || [])
                .map(i => `${i.type}: ${i.name}`);

            const eligibility = proto?.eligibilityModule?.eligibilityCriteria || '';
            const locations = (proto?.contactsLocationsModule?.locations || [])
                .slice(0, 3)
                .map(l => `${l.city || ''}, ${l.country || ''}`.trim().replace(/^,\s*/, ''));

            const phase = proto?.designModule?.phases?.[0] || 'Not Specified';
            const enrollment = proto?.designModule?.enrollmentInfo?.count || 0;
            const status = proto?.statusModule?.overallStatus || 'Unknown';
            const startDate = proto?.statusModule?.startDateStruct?.date || '';
            const completionDate = proto?.statusModule?.primaryCompletionDateStruct?.date || '';

            const sponsor = proto?.sponsorCollaboratorsModule?.leadSponsor?.name || '';
            const pis = (proto?.contactsLocationsModule?.overallOfficials || [])
                .slice(0, 3).map(o => o.name);

            return {
                id: id || `trial_${Math.random()}`,
                nctId: id,
                title: proto?.identificationModule?.briefTitle || 'Untitled Trial',
                description: brief || detailed,
                conditions,
                interventions,
                phase,
                status,
                enrollment,
                locations,
                eligibility: eligibility.slice(0, 500),
                startDate,
                completionDate,
                sponsor,
                principalInvestigators: pis,
                url: id ? `https://clinicaltrials.gov/study/${id}` : '',
                source: 'ClinicalTrials.gov',
                type: 'trial'
            };
        });

        cache.set(cacheKey, trials);
        return trials;
    } catch (err) {
        console.error('ClinicalTrials fetch error:', err.message);
        return [];
    }
}

// ─── Deduplication & Normalization ───────────────────────────────────────────

function deduplicatePublications(pubs) {
    const seen = new Set();
    const deduped = [];

    for (const pub of pubs) {
        // Normalize title for comparison
        const normTitle = (pub.title || '').toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!seen.has(normTitle) && normTitle.length > 10) {
            seen.add(normTitle);
            deduped.push(pub);
        }
    }

    return deduped;
}

function cleanAbstract(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .replace(/\[.*?\]/g, '')
        .replace(/©.*$/g, '')
        .trim();
}

// ─── Main Retrieval ───────────────────────────────────────────────────────────

async function retrieveAll(expandedQuery, deepResearch = false) {
    console.log('🔍 Starting parallel retrieval...');

    // Fire all 3 in parallel
    const [openAlexResults, pubmedResults, trialsResults] = await Promise.allSettled([
        fetchOpenAlex(expandedQuery.openAlex, deepResearch),
        fetchPubMed(expandedQuery.pubmed, deepResearch),
        fetchClinicalTrials(expandedQuery.trials)
    ]);

    const publications = [
        ...(openAlexResults.status === 'fulfilled' ? openAlexResults.value : []),
        ...(pubmedResults.status === 'fulfilled' ? pubmedResults.value : [])
    ].map(pub => ({ ...pub, abstract: cleanAbstract(pub.abstract) }));

    const trials = trialsResults.status === 'fulfilled' ? trialsResults.value : [];

    const dedupedPubs = deduplicatePublications(publications);

    console.log(`✅ Retrieved: ${dedupedPubs.length} publications, ${trials.length} trials`);

    return {
        publications: dedupedPubs,
        trials
    };
}

module.exports = { retrieveAll, fetchOpenAlex, fetchPubMed, fetchClinicalTrials };
