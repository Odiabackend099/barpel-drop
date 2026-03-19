import { NextResponse } from "next/server";

const notFound = () =>
  NextResponse.json({ error: "API endpoint not found" }, { status: 404 });

export async function GET() { return notFound(); }
export async function POST() { return notFound(); }
export async function PUT() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function DELETE() { return notFound(); }
