import { describe, it, expect, vi, beforeEach } from "vitest";

const { isOfficerMock } = vi.hoisted(() => ({ isOfficerMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isOfficer: isOfficerMock }));

const { revalidatePathMock } = vi.hoisted(() => ({ revalidatePathMock: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

type QueryResult = { data: unknown; error: { message: string } | null };

function makeQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of ["update", "delete", "insert", "eq", "select"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  // The real supabase-js query builder is thenable, so a bare `await` on it
  // (no .single()) resolves directly to { data, error }.
  builder.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

const { createClientMock, fromMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  fromMock: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

beforeEach(() => {
  vi.clearAllMocks();
  isOfficerMock.mockResolvedValue(true);
  createClientMock.mockResolvedValue({ from: fromMock });
});

describe("updateSpecies", () => {
  it("returns Species not found when zero rows are affected (e.g. already deleted)", async () => {
    fromMock.mockReturnValue(makeQueryBuilder({ data: [], error: null }));
    const { updateSpecies } = await import("./actions");

    const result = await updateSpecies("missing-id", { scientific_name: "Ficus elastica" });

    expect(result).toEqual({ ok: false, error: "Species not found." });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("succeeds when exactly one row is affected", async () => {
    fromMock.mockReturnValue(
      makeQueryBuilder({ data: [{ species_id: "s1" }], error: null }),
    );
    const { updateSpecies } = await import("./actions");

    const result = await updateSpecies("s1", { scientific_name: "Ficus elastica" });

    expect(result).toEqual({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/species");
    expect(revalidatePathMock).toHaveBeenCalledWith("/species/s1");
  });

  it("passes through a database error without claiming not-found", async () => {
    fromMock.mockReturnValue(
      makeQueryBuilder({ data: null, error: { message: "connection reset" } }),
    );
    const { updateSpecies } = await import("./actions");

    const result = await updateSpecies("s1", { scientific_name: "Ficus elastica" });

    expect(result).toEqual({ ok: false, error: "connection reset" });
  });

  it("rejects non-officers before touching the database", async () => {
    isOfficerMock.mockResolvedValue(false);
    const { updateSpecies } = await import("./actions");

    const result = await updateSpecies("s1", { scientific_name: "Ficus elastica" });

    expect(result).toEqual({ ok: false, error: "Conservation officer access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("deleteSpecies", () => {
  it("returns Species not found when zero rows are affected (concurrent delete)", async () => {
    fromMock.mockReturnValue(makeQueryBuilder({ data: [], error: null }));
    const { deleteSpecies } = await import("./actions");

    const result = await deleteSpecies("already-gone");

    expect(result).toEqual({ ok: false, error: "Species not found." });
  });

  it("succeeds when exactly one row is deleted", async () => {
    fromMock.mockReturnValue(
      makeQueryBuilder({ data: [{ species_id: "s1" }], error: null }),
    );
    const { deleteSpecies } = await import("./actions");

    const result = await deleteSpecies("s1");

    expect(result).toEqual({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/species");
  });

  it("rejects non-officers before touching the database", async () => {
    isOfficerMock.mockResolvedValue(false);
    const { deleteSpecies } = await import("./actions");

    const result = await deleteSpecies("s1");

    expect(result).toEqual({ ok: false, error: "Conservation officer access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
