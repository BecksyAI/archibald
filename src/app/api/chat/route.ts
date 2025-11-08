/**
 * Chat API route - handles Claude API calls server-side
 */

import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Claude Haiku 4.5 model name as specified by user
// Note: If this doesn't work, try: claude-3-5-haiku-20241022 (official Anthropic format)
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

// Timeout for database operations (5 seconds)
const DB_TIMEOUT = 5000;
// Timeout for API calls (30 seconds)
const API_TIMEOUT = 30000;

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    createTimeout(timeout).then(() => {
      throw new Error(`API request timed out after ${timeout}ms`);
    }),
  ]) as Promise<Response>;
}

export async function POST(request: NextRequest) {
  try {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }


    // Fetch events, whiskies, and reviews for system prompt (with timeout)
    let enhancedSystemPrompt = systemPrompt || '';
    
    try {
      // Import here to avoid circular dependencies
      const connectDB = (await import('@/lib/db')).default;
      const Event = (await import('@/lib/models/Event')).default;
      const WhiskyEntry = (await import('@/lib/models/WhiskyEntry')).default;
      const Review = (await import('@/lib/models/Review')).default;
      const ArchibaldPersona = (await import('@/lib/models/ArchibaldPersona')).default;
      const ArchibaldMemory = (await import('@/lib/models/ArchibaldMemory')).default;

      // Connect to database with timeout
      await Promise.race([
        connectDB(),
        createTimeout(DB_TIMEOUT),
      ]);

      const [events, whiskies, reviews, archibaldPersona, archibaldMemories] = await Promise.all([
        Event.find().sort({ date: -1 }).limit(20).lean(),
        WhiskyEntry.find().sort({ createdAt: -1 }).limit(20).lean(),
        Review.find().sort({ createdAt: -1 }).limit(20).lean(),
        ArchibaldPersona.findOne().lean(),
        ArchibaldMemory.find().sort({ id: 1 }).lean(),
      ]);

      // Build Archibald's persona from database
      let archibaldPersonaText = '';
      if (archibaldPersona) {
        const personaData = archibaldPersona as unknown as {
          name: string;
          age: string;
          appearanceProjection: string;
          originStory: string;
          personalityMatrix: Array<{ trait: string; description: string }>;
          catchphrases: string[];
          coreDirectives: string[];
        };
        archibaldPersonaText = `
PERSONALITY:
Name: ${personaData.name}
Age: ${personaData.age}

Appearance: ${personaData.appearanceProjection}

Origin Story: ${personaData.originStory}

Personality Traits:
${personaData.personalityMatrix.map((p) => `- ${p.trait}: ${p.description}`).join('\n')}

Catchphrases: ${personaData.catchphrases.join(', ')}

Core Directives:
${personaData.coreDirectives.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}
`;
      }
      
      // Build Archibald's core memories from database
      let archibaldMemoriesText = '';
      if (archibaldMemories && archibaldMemories.length > 0) {
        archibaldMemoriesText = `\n\nCORE MEMORY (${archibaldMemories.length} experiences from my archives):\n${archibaldMemories.map((m) => {
          let mem = `- ${m.whiskyDetails.name} (${m.whiskyDetails.distillery}, ${m.whiskyDetails.region})`;
          if (m.whiskyDetails.age) mem += `, ${m.whiskyDetails.age}`;
          mem += `\n  Location: ${m.experienceLocation}`;
          mem += `\n  Date: ${m.experienceDate}`;
          mem += `\n  Narrative: ${m.narrative}`;
          mem += `\n  Verdict: ${m.finalVerdict}`;
          return mem;
        }).join('\n\n')}`;
      }

      const eventsData = events.length > 0
        ? `\n\nRECENT EVENTS (${events.length} total):\n${events.map((e) => `- Event hosted by ${e.host} on ${new Date(e.date).toLocaleDateString()} (${e.documented === true ? 'Documented' : e.documented === 'TBD' ? 'TBD' : 'Not documented'})`).join('\n')}`
        : '';

      const whiskiesData = whiskies.length > 0
        ? `\n\nRECENT WHISKIES (${whiskies.length} total):\n${whiskies.map((w) => {
          let desc = `- ${w.name} from ${w.countryOfOrigin}`;
          if (w.age) desc += `, aged ${w.age} years`;
          if (w.description) desc += `: ${w.description}`;
          if (w.aromaNotes) desc += `\n  Aroma: ${w.aromaNotes}`;
          if (w.tasteNotes) desc += `\n  Taste: ${w.tasteNotes}`;
          if (w.finishNotes) desc += `\n  Finish: ${w.finishNotes}`;
          return desc;
        }).join('\n')}`
        : '';

      const reviewsData = reviews.length > 0
        ? `\n\nRECENT REVIEWS (${reviews.length} total):\n${reviews.map((r) => {
          let review = `- ${r.participantName}`;
          if (r.whiskyEntryId?.name) review += ` reviewed ${r.whiskyEntryId.name}`;
          if (r.verdict) review += `: ${r.verdict}`;
          if (r.notes) review += ` (${r.notes})`;
          return review;
        }).join('\n')}`
        : '';

      enhancedSystemPrompt = `${archibaldPersonaText}${archibaldMemoriesText}${eventsData}${whiskiesData}${reviewsData}

You have access to all this information about past events, whiskies tasted, participant reviews, and your own core memories. Use this knowledge to provide detailed, informed responses about the collection, events, and individual whiskies.`;
    } catch {
      // Continue with original system prompt if database fails
    }

    const formattedMessages = messages
      .filter((msg) => !msg.isThinking)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));


    const requestBody = {
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: enhancedSystemPrompt,
      messages: formattedMessages,
    };

    const response = await fetchWithTimeout(
      CLAUDE_API_URL,
      {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      API_TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText || `API error: ${response.status}` } };
      }
      return NextResponse.json(
        { error: errorData.error?.message || `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Parse Claude API response - content is an array of blocks with type and text
    let responseText = 'No response from Claude';
    
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      // Find the first text block (most common case)
      const textBlock = data.content.find((block: { type: string; text?: string }) => block.type === 'text');
      if (textBlock && textBlock.text) {
        responseText = textBlock.text;
      } else {
        // Fallback: try to extract text from first block
        const firstBlock = data.content[0];
        if (firstBlock && firstBlock.text) {
          responseText = firstBlock.text;
        } else if (typeof firstBlock === 'string') {
          responseText = firstBlock;
        } else {
          responseText = `Error: Unexpected response format. Raw response: ${JSON.stringify(data.content)}`;
        }
      }
    }
    return NextResponse.json({ content: responseText });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


