"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Note {
  id: string;
  merchant_id: string;
  author_email: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface AdminNotesProps {
  merchantId: string;
}

export function AdminNotes({ merchantId }: AdminNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Add note state
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit note state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/crm/merchants/${merchantId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async () => {
    const content = newContent.trim();
    if (!content) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/crm/merchants/${merchantId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewContent("");
        setAdding(false);
        toast.success("Note added");
      } else {
        toast.error("Failed to add note");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    const content = editContent.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/admin/crm/merchants/${merchantId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, content }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? data.note : n))
        );
        setEditingId(null);
        toast.success("Note updated");
      } else {
        toast.error("Failed to update note");
      }
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      const res = await fetch(`/api/admin/crm/merchants/${merchantId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success("Note deleted");
      } else {
        toast.error("Failed to delete note");
      }
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-[#D0EDE8] p-4 animate-pulse"
          >
            <div className="h-4 w-3/4 bg-[#F0F9F8] rounded mb-2" />
            <div className="h-3 w-1/3 bg-[#F0F9F8] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Add note button / form */}
      {adding ? (
        <div className="mb-4 bg-white rounded-lg border border-[#D0EDE8] p-4">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a note..."
            rows={3}
            maxLength={5000}
            className="w-full text-sm border border-[#D0EDE8] rounded-lg p-3 text-[#1B2A4A] placeholder:text-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20 focus:border-[#00A99D] resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={!newContent.trim() || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#00A99D] rounded-lg hover:bg-[#00A99D]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-3 h-3" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewContent("");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8AADA6] hover:text-[#1B2A4A] transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 mb-4 px-3 py-1.5 text-xs font-medium text-[#00A99D] border border-[#00A99D]/30 rounded-lg hover:bg-[#00A99D]/5 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Note
        </button>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-[#8AADA6] text-center py-6">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg border border-[#D0EDE8] p-4"
            >
              {editingId === note.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    maxLength={5000}
                    className="w-full text-sm border border-[#D0EDE8] rounded-lg p-3 text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20 focus:border-[#00A99D] resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(note.id)}
                      disabled={!editContent.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#00A99D] rounded-lg hover:bg-[#00A99D]/90 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8AADA6] hover:text-[#1B2A4A] transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#1B2A4A] whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-[#8AADA6]">
                      {note.author_email} &middot;{" "}
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                      {note.updated_at !== note.created_at && " (edited)"}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                        className="p-1 text-[#8AADA6] hover:text-[#00A99D] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 text-[#8AADA6] hover:text-[#E74C3C] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
