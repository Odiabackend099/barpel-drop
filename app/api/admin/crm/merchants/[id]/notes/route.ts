import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Notes CRUD for a specific merchant.
 * GET  — list notes
 * POST — create note { content }
 * PATCH — update note { noteId, content }
 * DELETE — delete note { noteId }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const adminSupabase = createAdminClient();

  const { data: notes, error } = await adminSupabase
    .from("admin_notes")
    .select("*")
    .eq("merchant_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: notes ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await requireAdmin(request);
  if (response) return response;

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content || content.length > 5000) {
    return NextResponse.json(
      { error: "Content must be 1-5000 characters" },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();

  const { data: note, error } = await adminSupabase
    .from("admin_notes")
    .insert({
      merchant_id: params.id,
      author_email: user!.email!,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const body = await request.json();
  const noteId = body.noteId;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }
  if (!content || content.length > 5000) {
    return NextResponse.json(
      { error: "Content must be 1-5000 characters" },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();

  const { data: note, error } = await adminSupabase
    .from("admin_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("merchant_id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ note });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const body = await request.json();
  const noteId = body.noteId;

  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("admin_notes")
    .delete()
    .eq("id", noteId)
    .eq("merchant_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
