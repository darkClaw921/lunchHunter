import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { deleteSearchHistoryEntry } from "@/lib/db/search-history";

/**
 * DELETE /api/profile/search-history/[id] — удаляет одну запись истории
 * поиска, если она принадлежит текущему пользователю.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  await deleteSearchHistoryEntry(session.user.id, numericId);
  return NextResponse.json({ ok: true });
}
