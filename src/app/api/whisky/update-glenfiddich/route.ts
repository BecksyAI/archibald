/**
 * Quick script to add image to Glenfiddich 12 entry
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import WhiskyEntry from '@/lib/models/WhiskyEntry';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Find Glenfiddich 12 entry
    const whisky = await WhiskyEntry.findOne({ 
      name: { $regex: /Glenfiddich.*12/i } 
    });

    if (!whisky) {
      return NextResponse.json({ error: 'Glenfiddich 12 entry not found' }, { status: 404 });
    }

    // Add the image if it's not already there
    if (!whisky.images || !whisky.images.includes('/glen12.png')) {
      whisky.images = [...(whisky.images || []), '/glen12.png'];
      await whisky.save();
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Image added to Glenfiddich 12 entry',
      whisky: {
        id: whisky._id.toString(),
        name: whisky.name,
        images: whisky.images
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update whisky' },
      { status: 500 }
    );
  }
}

