/**
 * Archibald Memories API route
 * Returns Archibald's core memories from database
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ArchibaldMemory from '@/lib/models/ArchibaldMemory';

export async function GET() {
  try {
    await connectDB();

    const memories = await ArchibaldMemory.find().sort({ id: 1 }).lean();

    const formattedMemories = memories.map((memory) => ({
      id: memory.id,
      whiskyDetails: memory.whiskyDetails,
      experienceDate: memory.experienceDate,
      experienceLocation: memory.experienceLocation,
      narrative: memory.narrative,
      finalVerdict: memory.finalVerdict,
    }));

    return NextResponse.json({
      memories: formattedMemories,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

