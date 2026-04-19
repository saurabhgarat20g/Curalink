/**
 * LLM Service
 * Uses Ollama (local open-source LLM) for structured reasoning
 * Falls back to template-based generation if Ollama is unavailable
 */

const axios = require('axios');

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

// ─── Check Ollama Availability ────────────────────────────────────────────────

async function checkOllamaAvailable() {
    try {
        const res = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 3000 });
        const models = res.data?.models || [];
        return models.some(m => m.name.includes('mistral') || m.name.includes('llama') ||
            m.name.includes('phi') || m.name.includes('gemma'));
    } catch {
        return false;
    }
}

// ─── Build Structured Prompt ──────────────────────────────────────────────────

function buildPrompt(params) {
    const { disease, query, publications, trials, patientName, chatHistory } = params;

    const pubSummaries = publications.slice(0, 6).map((p, i) =>
        `[${i + 1}] "${p.title}" by ${p.authors?.slice(0, 2).join(', ') || 'Unknown'} (${p.year || 'N/A'})
     Journal: ${p.journal}
     Abstract: ${(p.abstract || '').slice(0, 300)}...`
    ).join('\n\n');

    const trialSummaries = trials.slice(0, 4).map((t, i) =>
        `[T${i + 1}] "${t.title}" | Status: ${t.status} | Phase: ${t.phase}
     Description: ${(t.description || '').slice(0, 200)}...
     Interventions: ${t.interventions?.slice(0, 2).join(', ')}`
    ).join('\n\n');

    const contextHistory = chatHistory?.slice(-3).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}`
    ).join('\n') || '';

    return `You are a medical research assistant. Analyze the following peer-reviewed research and clinical trials to provide a structured, evidence-based response.

${contextHistory ? `CONVERSATION CONTEXT:\n${contextHistory}\n\n` : ''}
DISEASE/CONDITION: ${disease}
RESEARCH FOCUS: ${query || disease}
${patientName ? `PATIENT: ${patientName}` : ''}

PEER-REVIEWED PUBLICATIONS:
${pubSummaries || 'No publications available.'}

CLINICAL TRIALS:
${trialSummaries || 'No trials found.'}

INSTRUCTIONS:
- Be factual and evidence-based only
- Do NOT hallucinate or add information not in the provided research
- Cite specific papers by number when making claims
- Structure your response exactly as follows:

## Condition Overview
[2-3 sentences explaining the condition based on the research]

## Key Research Insights
[4-6 bullet points with specific findings from the papers, cite with [1], [2], etc.]

## Clinical Trial Highlights
[3-4 bullet points about relevant trials]

## Treatment Considerations
[2-3 evidence-based treatment insights]

## Research Gaps & Future Directions
[1-2 sentences on what research still needs to be done]

Respond now:`;
}

// ─── Ollama Streaming Request ─────────────────────────────────────────────────

async function generateWithOllama(prompt, onChunk) {
    const response = await axios({
        method: 'post',
        url: `${OLLAMA_BASE}/api/generate`,
        data: {
            model: OLLAMA_MODEL,
            prompt,
            stream: true,
            options: {
                temperature: 0.3,
                top_p: 0.9,
                max_tokens: 1200
            }
        },
        responseType: 'stream',
        timeout: 60000
    });

    return new Promise((resolve, reject) => {
        let fullResponse = '';

        response.data.on('data', chunk => {
            try {
                const lines = chunk.toString().split('\n').filter(Boolean);
                lines.forEach(line => {
                    const data = JSON.parse(line);
                    if (data.response) {
                        fullResponse += data.response;
                        if (onChunk) onChunk(data.response);
                    }
                });
            } catch (e) {
                // Ignore parse errors for partial chunks
            }
        });

        response.data.on('end', () => resolve(fullResponse));
        response.data.on('error', reject);
    });
}

// ─── Template-Based Fallback (No LLM needed) ─────────────────────────────────

function generateTemplateResponse(params) {
    const { disease, query, publications, trials, patientName } = params;

    const topPubs = publications.slice(0, 6);
    const topTrials = trials.slice(0, 4);
    const currentYear = new Date().getFullYear();
    const recentPubs = topPubs.filter(p => p.year >= currentYear - 3);

    let response = `## Condition Overview\n`;
    response += `Based on ${topPubs.length} peer-reviewed publications retrieved from PubMed and OpenAlex, `;
    response += `the current research landscape for **${disease}**`;
    if (query) response += ` focusing on **${query}**`;
    response += ` demonstrates active investigation with ${recentPubs.length} studies published within the last 3 years. `;

    if (topPubs[0]?.abstract) {
        const snippet = topPubs[0].abstract.slice(0, 200);
        response += `Recent evidence suggests: "${snippet}..."\n\n`;
    } else {
        response += `Multiple research groups are actively contributing to this field.\n\n`;
    }

    response += `## Key Research Insights\n`;
    topPubs.slice(0, 5).forEach((pub, i) => {
        const snippet = pub.abstract
            ? pub.abstract.slice(0, 150).replace(/\s+\S*$/, '') + '...'
            : 'See full publication for details.';
        response += `- **[${i + 1}]** *${pub.title}* (${pub.year || 'N/A'}) — ${snippet}\n`;
    });

    response += `\n## Clinical Trial Highlights\n`;
    if (topTrials.length > 0) {
        topTrials.forEach((trial, i) => {
            response += `- **[T${i + 1}]** ${trial.title} | **${trial.status}** | Phase ${trial.phase}\n`;
            if (trial.description) {
                response += `  ${trial.description.slice(0, 120)}...\n`;
            }
        });
    } else {
        response += `- No active clinical trials found matching the current search criteria. Consider broadening the search terms.\n`;
    }

    response += `\n## Treatment Considerations\n`;
    response += `- Evidence from the retrieved literature suggests multiple therapeutic approaches are under investigation for ${disease}.\n`;
    if (query) {
        response += `- Research on **${query}** shows promising results in the context of ${disease} management [1][2].\n`;
    }
    response += `- Patients should consult with healthcare providers to discuss individualized treatment options based on their clinical profile.\n`;

    response += `\n## Research Gaps & Future Directions\n`;
    response += `The current body of evidence highlights the need for larger, multicenter randomized controlled trials to establish definitive treatment protocols. `;
    response += `Emerging research directions include personalized medicine approaches and novel therapeutic targets identified through recent molecular studies.\n`;

    return response;
}

// ─── Main Generate Function ───────────────────────────────────────────────────

async function generateResponse(params, res = null) {
    const { publications, trials } = params;

    if (publications.length === 0 && trials.length === 0) {
        return {
            content: `## No Results Found\n\nNo research publications or clinical trials were found for the specified query. Please try:\n- Broadening your search terms\n- Checking the spelling of the disease/condition\n- Using alternative medical terminology`,
            source: 'template',
            streaming: false
        };
    }

    const isOllamaUp = await checkOllamaAvailable();
    const prompt = buildPrompt(params);

    if (isOllamaUp && res) {
        // Streaming response via SSE
        console.log(`🤖 Using Ollama (${OLLAMA_MODEL}) with streaming`);
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            let fullContent = '';
            await generateWithOllama(prompt, chunk => {
                fullContent += chunk;
                res.write(`data: ${JSON.stringify({ chunk, type: 'content' })}\n\n`);
            });

            res.write(`data: ${JSON.stringify({ type: 'done', fullContent })}\n\n`);
            res.end();

            return { content: fullContent, source: 'ollama', streaming: true };
        } catch (err) {
            console.error('Ollama streaming error:', err.message);
            // Fall through to template
        }
    }

    if (isOllamaUp && !res) {
        // Non-streaming Ollama
        try {
            console.log(`🤖 Using Ollama (${OLLAMA_MODEL}) non-streaming`);
            const content = await generateWithOllama(prompt, null);
            return { content, source: 'ollama', streaming: false };
        } catch (err) {
            console.error('Ollama error:', err.message);
        }
    }

    // Fallback: template-based
    console.log('📝 Using template-based response (Ollama not available)');
    const content = generateTemplateResponse(params);
    return { content, source: 'template', streaming: false };
}

module.exports = { generateResponse, checkOllamaAvailable };
