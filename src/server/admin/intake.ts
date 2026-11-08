import { POLICY_VERSION, labelOf, staffRoles } from "@/lib/applications-shared";
import type { ExhibitionApplicationInput, StaffApplicationInput } from "@/lib/applications";
import { referenceNumber } from "@/lib/rfq-shared";
import type { Db } from "../db";
import { createApplication } from "./applications";
import { deleteCvFile, saveCvFile } from "./media";

/**
 * استلام طلب توظيف: يحفظ السيرة الذاتية (اختيارية) في مسار خاص ثم السجل. إن فشل حفظ السجل يُحذف الملف.
 * لا يُحفظ حقل الموافقة ولا حقل الفخ داخل payload؛ الموافقة تُسجَّل بتاريخها وإصدار السياسة.
 */
export async function submitStaffApplication(db: Db, uploadRoot: string, input: StaffApplicationInput, cv?: Buffer | null): Promise<string> {
  const { fullName, phone, email, consent: _c, company_site: _t, ...rest } = input;
  void _c;
  void _t;
  const reference = referenceNumber(new Date(), "STF");
  const attachment = cv && cv.length > 0 ? (await saveCvFile(uploadRoot, cv)).rel : null;
  try {
    await createApplication(db, {
      reference,
      kind: "staff",
      name: fullName,
      phone,
      email,
      summary: rest.roles.map((r) => labelOf(staffRoles, r)).join("، "),
      payload: rest,
      attachment,
      policyVersion: POLICY_VERSION,
    });
  } catch (err) {
    await deleteCvFile(uploadRoot, attachment);
    throw err;
  }
  return reference;
}

export async function submitExhibitionApplication(db: Db, input: ExhibitionApplicationInput): Promise<string> {
  const { organization, contactName, phone, email, consent: _c, company_site: _t, ...rest } = input;
  void _c;
  void _t;
  const reference = referenceNumber(new Date(), "EXH");
  await createApplication(db, {
    reference,
    kind: "exhibition",
    name: contactName,
    phone,
    email,
    org: organization,
    summary: rest.exhibitionName,
    payload: rest,
    policyVersion: POLICY_VERSION,
  });
  return reference;
}
