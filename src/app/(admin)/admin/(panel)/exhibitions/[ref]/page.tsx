import type { Metadata } from "next";
import { ApplicationDetailPage } from "../../_applications";

export const metadata: Metadata = { title: "طلب معرض" };
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: Promise<{ ref: string }> }) {
  return <ApplicationDetailPage kind="exhibition" params={params} />;
}
