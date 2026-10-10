import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { PagesEditor } from "@/components/admin/pages-editor";
import { aboutSchema, getPageContent, homeSchema, privacySchema, termsSchema } from "@/lib/page-content";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requireAdmin("settings.manage");
  const [home, about, terms, privacy, faqs] = await Promise.all([
    getPageContent("home"),
    getPageContent("about"),
    getPageContent("terms"),
    getPageContent("privacy"),
    db.faq.findMany({ where: { scope: "GLOBAL" }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Pages"
        subtitle="Edit the words on the homepage, About us, Terms & Conditions, Privacy Policy and FAQs. Saving updates the live website straight away."
      />
      <PagesEditor
        pages={{ home, about, terms, privacy }}
        defaults={{ home: homeSchema.parse({}), about: aboutSchema.parse({}), terms: termsSchema.parse({}), privacy: privacySchema.parse({}) }}
        faqs={faqs}
      />
    </>
  );
}
