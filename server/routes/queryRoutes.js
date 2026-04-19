const express = require('express');
const router = express.Router();
const { expandQuery } = require('../services/queryService');
const { retrieveAll } = require('../services/retrievalService');
const { rankPublications, rankTrials, extractTopAuthors } = require('../services/rankingService');
const { generateResponse, checkOllamaAvailable } = require('../services/llmService');
const Session = require('../models/Session');

/**
 * POST /api/query
 * Main research query pipeline
 */
router.post('/query', async (req, res) => {
    const startTime = Date.now();

    try {
        const {
            sessionId,
            patientName,
            disease,
            query,
            location,
            freeText,
            deepResearch = false
        } = req.body;

        if (!disease && !freeText) {
            return res.status(400).json({ error: 'Disease or free text query is required.' });
        }

        const effectiveDisease = disease || freeText;

        // ── Step 1: Query Expansion ──────────────────────────────────────────────
        const expandedQuery = expandQuery({ disease: effectiveDisease, query, location, freeText, patientName, deepResearch });
        console.log(`📋 Expanded query: ${expandedQuery.display}`);

        // ── Step 2: Retrieve from all sources ────────────────────────────────────
        const { publications: rawPubs, trials: rawTrials } = await retrieveAll(expandedQuery, deepResearch);

        // ── Step 3: Rank ─────────────────────────────────────────────────────────
        const searchTerms = `${effectiveDisease} ${query || ''}`.trim();
        const pubLimit = deepResearch ? 10 : 8;
        const trialLimit = deepResearch ? 8 : 6;

        const rankedPubs = rankPublications(rawPubs, searchTerms, pubLimit);
        const rankedTrials = rankTrials(rawTrials, searchTerms, trialLimit);
        const topAuthors = extractTopAuthors(rawPubs);

        // ── Step 4: Load history ─────────────────────────────────────────────────
        let chatHistory = [];
        let session = null;

        if (sessionId) {
            try {
                session = await Session.findOne({ sessionId });
                if (session) {
                    chatHistory = session.messages.slice(-6); // Last 6 messages for context
                }
            } catch (dbErr) {
                console.warn('DB read error (non-fatal):', dbErr.message);
            }
        }

        // ── Step 5: Check if client wants streaming ───────────────────────────────
        const wantsStreaming = req.headers['accept'] === 'text/event-stream';

        const llmParams = {
            disease: effectiveDisease,
            query,
            publications: rankedPubs,
            trials: rankedTrials,
            patientName,
            chatHistory
        };

        // For streaming, we handle SSE inside generateResponse
        if (wantsStreaming) {
            const llmResult = await generateResponse(llmParams, res);
            // Response already sent via SSE, save to DB
            await saveToSession(sessionId, patientName, effectiveDisease, query, llmResult.content, rankedPubs.length, rankedTrials.length, session);
            return;
        }

        // ── Step 6: Generate response ─────────────────────────────────────────────
        const llmResult = await generateResponse(llmParams, null);
        const elapsed = Date.now() - startTime;

        // ── Step 7: Save to MongoDB ───────────────────────────────────────────────
        await saveToSession(sessionId, patientName, effectiveDisease, query, llmResult.content, rankedPubs.length, rankedTrials.length, session);

        // ── Step 8: Build response ───────────────────────────────────────────────
        const response = {
            sessionId: sessionId || null,
            query: expandedQuery.display,
            expandedQueries: {
                pubmed: expandedQuery.pubmed,
                openAlex: expandedQuery.openAlex
            },
            analysis: llmResult.content,
            llmSource: llmResult.source,
            publications: rankedPubs.map(formatPublication),
            trials: rankedTrials.map(formatTrial),
            topAuthors,
            stats: {
                totalRetrieved: rawPubs.length + rawTrials.length,
                publicationsShown: rankedPubs.length,
                trialsShown: rankedTrials.length,
                processingTimeMs: elapsed
            }
        };

        res.json(response);
    } catch (err) {
        console.error('Query pipeline error:', err);
        res.status(500).json({ error: 'Research pipeline failed: ' + err.message });
    }
});

/**
 * GET /api/query/status
 * Check system status (Ollama, DB)
 */
router.get('/query/status', async (req, res) => {
    const ollamaUp = await checkOllamaAvailable();
    res.json({
        ollama: ollamaUp,
        ollamaModel: process.env.OLLAMA_MODEL || 'mistral',
        database: true // If we got here, express is up
    });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPublication(pub) {
    return {
        id: pub.id,
        title: pub.title,
        authors: pub.authors || [],
        year: pub.year,
        journal: pub.journal,
        source: pub.source,
        url: pub.url,
        abstract: pub.abstract,
        snippet: pub.abstract ? pub.abstract.slice(0, 200) + '...' : '',
        isOpenAccess: pub.isOpenAccess || false,
        citedBy: pub.citedBy || 0,
        concepts: pub.concepts || [],
        relevanceScore: pub.scores ? Math.round(pub.scores.final * 100) : 0
    };
}

function formatTrial(trial) {
    return {
        id: trial.id,
        nctId: trial.nctId,
        title: trial.title,
        description: trial.description,
        status: trial.status,
        phase: trial.phase,
        enrollment: trial.enrollment,
        conditions: trial.conditions,
        interventions: trial.interventions,
        locations: trial.locations,
        sponsor: trial.sponsor,
        principalInvestigators: trial.principalInvestigators,
        startDate: trial.startDate,
        completionDate: trial.completionDate,
        url: trial.url,
        source: trial.source,
        relevanceScore: trial.scores ? Math.round(trial.scores.final * 100) : 0
    };
}

async function saveToSession(sessionId, patientName, disease, query, content, pubCount, trialCount, existingSession) {
    if (!sessionId) return;

    try {
        const userMessage = {
            role: 'user',
            content: `Disease: ${disease}${query ? ', Query: ' + query : ''}`,
            metadata: { disease, query }
        };
        const assistantMessage = {
            role: 'assistant',
            content,
            metadata: { disease, query, publicationsCount: pubCount, trialsCount: trialCount }
        };

        if (existingSession) {
            existingSession.messages.push(userMessage, assistantMessage);
            existingSession.updatedAt = new Date();
            await existingSession.save();
        } else {
            await Session.create({
                sessionId,
                patientName: patientName || '',
                messages: [userMessage, assistantMessage]
            });
        }
    } catch (dbErr) {
        console.warn('DB save error (non-fatal):', dbErr.message);
    }
}

module.exports = router;
