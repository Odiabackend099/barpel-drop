import { redirect } from "next/navigation";

// AF-003: /affiliates was a dead route — now redirects to Tapfiliate signup.
export default function AffiliatesPage() {
  redirect("https://barpelai.tapfiliate.com/programs/barpel-ai/signup/");
}
