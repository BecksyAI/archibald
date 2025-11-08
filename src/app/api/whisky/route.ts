/**
 * Whisky entries API routes
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WhiskyEntry from "@/lib/models/WhiskyEntry";
import { requireAuth, AuthenticatedRequest } from "@/lib/middleware";

// GET all whisky entries
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");
    const country = searchParams.get("country");
    const eventId = searchParams.get("eventId");

    const query: Record<string, unknown> = {};
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (country) {
      query.countryOfOrigin = { $regex: country, $options: "i" };
    }
    if (eventId) {
      query.eventId = eventId;
    }

    const whiskies = await WhiskyEntry.find(query).sort({ createdAt: -1 }).populate("eventId", "date host").lean();

    const formattedWhiskies = whiskies.map((whisky) => {
      // Helper to convert to string safely
      const toString = (value: unknown): string => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object" && value !== null && "_id" in value) {
          const idValue = (value as { _id: { toString: () => string } })._id;
          return idValue.toString();
        }
        if (typeof value === "object" && value !== null && "toString" in value) {
          return (value as { toString: () => string }).toString();
        }
        return String(value);
      };

      // Helper to convert to ISO string safely
      const toISOString = (value: unknown): string => {
        if (!value) return new Date().toISOString();
        if (value instanceof Date) return value.toISOString();
        try {
          return new Date(value as string | number).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      return {
        id: toString(whisky._id),
        name: whisky.name || "",
        eventId: whisky.eventId
          ? typeof whisky.eventId === "object" && "_id" in whisky.eventId
            ? toString(whisky.eventId._id)
            : toString(whisky.eventId)
          : null,
        eventDate: toISOString(whisky.eventDate),
        host: whisky.host || "",
        countryOfOrigin: whisky.countryOfOrigin || "",
        age: whisky.age,
        description: whisky.description,
        aromaNotes: whisky.aromaNotes,
        tasteNotes: whisky.tasteNotes,
        finishNotes: whisky.finishNotes,
        images: whisky.images || [],
        createdBy: toString(whisky.createdBy),
        createdAt: toISOString(whisky.createdAt),
        updatedAt: toISOString(whisky.updatedAt),
      };
    });

    return NextResponse.json({ whiskies: formattedWhiskies });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new whisky entry
async function createHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      eventId,
      eventDate,
      host,
      countryOfOrigin,
      age,
      description,
      aromaNotes,
      tasteNotes,
      finishNotes,
      images,
    } = body;

    if (!name || !host || !countryOfOrigin) {
      return NextResponse.json({ error: "Name, host, and countryOfOrigin are required" }, { status: 400 });
    }

    const whisky = await WhiskyEntry.create({
      name: name.trim(),
      eventId: eventId || undefined,
      eventDate: eventDate ? new Date(eventDate) : new Date(),
      host: host.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      age,
      description: description?.trim(),
      aromaNotes: aromaNotes?.trim(),
      tasteNotes: tasteNotes?.trim(),
      finishNotes: finishNotes?.trim(),
      images: images || [],
      createdBy: request.user.userId,
    });

    const formattedWhisky = {
      id: whisky._id.toString(),
      name: whisky.name,
      eventId: whisky.eventId?.toString(),
      eventDate: whisky.eventDate.toISOString(),
      host: whisky.host,
      countryOfOrigin: whisky.countryOfOrigin,
      age: whisky.age,
      description: whisky.description,
      aromaNotes: whisky.aromaNotes,
      tasteNotes: whisky.tasteNotes,
      finishNotes: whisky.finishNotes,
      images: whisky.images || [],
      createdBy: whisky.createdBy.toString(),
      createdAt: whisky.createdAt.toISOString(),
      updatedAt: whisky.updatedAt.toISOString(),
    };

    return NextResponse.json({ whisky: formattedWhisky }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return requireAuth(request, createHandler);
}
