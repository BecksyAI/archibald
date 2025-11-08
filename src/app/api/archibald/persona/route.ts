/**
 * Archibald Persona API route
 * Returns Archibald's persona from database
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ArchibaldPersona from '@/lib/models/ArchibaldPersona';

export async function GET() {
  try {
    await connectDB();

    const persona = await ArchibaldPersona.findOne().lean();

    if (!persona) {
      return NextResponse.json(
        { error: 'Archibald persona not found. Please run migration.' },
        { status: 404 }
      );
    }

    const personaData = persona as unknown as {
      name: string;
      age: string;
      appearanceProjection: string;
      originStory: string;
      personalityMatrix: Array<{ trait: string; description: string }>;
      catchphrases: string[];
      coreDirectives: string[];
    };

    return NextResponse.json({
      persona: {
        name: personaData.name,
        age: personaData.age,
        appearanceProjection: personaData.appearanceProjection,
        originStory: personaData.originStory,
        personalityMatrix: personaData.personalityMatrix,
        catchphrases: personaData.catchphrases,
        coreDirectives: personaData.coreDirectives,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

