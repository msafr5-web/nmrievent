import { requireRole } from "@/server/auth";
import { mutate, newId } from "@/server/db";
import { ok, parse, unauthorized } from "@/server/http";
import { projectSchema } from "@/server/schemas";
import type { Project } from "@/server/types";

export async function POST(req: Request) {
  if (!(await requireRole("admin"))) return unauthorized();
  const p = await parse(req, projectSchema);
  if ("res" in p) return p.res;
  const { lat, lng, radiusM, clientEmail, reference, ...rest } = p.data;

  const project: Project = {
    id: newId("prj"),
    ...rest,
    status: "دراسة وتحديد المتطلبات",
    geo: { lat, lng, radiusM },
    reference: reference || undefined,
    clientEmail: clientEmail || undefined,
    milestones: [
      { key: "planning", status: "current" },
      { key: "design", status: "upcoming" },
      { key: "execution", status: "upcoming" },
      { key: "delivery", status: "upcoming", date: rest.date },
    ],
    approvals: [{ id: newId("apr"), title: "عقد تنفيذ الفعالية", kind: "عقد", status: "pending" }],
    reports: [],
    assignments: [],
    zones: [{ name: "المدخل الرئيسي", capacity: 2000, current: 0 }],
    parking: { capacity: 1000, occupied: 0 },
    createdAt: new Date().toISOString(),
  };
  await mutate((db) => void db.projects.unshift(project));
  return ok({ project }, 201);
}
