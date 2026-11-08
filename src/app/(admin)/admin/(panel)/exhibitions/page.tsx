import type { Metadata } from "next";
import { ApplicationsListPage } from "../_applications";

export const metadata: Metadata = { title: "طلبات المعارض" };
export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  return <ApplicationsListPage kind="exhibition" searchParams={searchParams} />;
}
