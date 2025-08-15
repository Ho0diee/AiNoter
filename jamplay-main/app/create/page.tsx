import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CreateForm from "./CreateForm";

const starter = {
  meta: { title: "New Game", ageRating: "E", tags: ["starter"] },
  inputs: [],
  flow: [ { id: "start", type: "scene", prompt: "Welcome to JamPlay!", maxOutTokens: 24 } ],
  model: { name: "stub-model", temperature: 0.7 },
  budget: { maxCallsTotal: 4, maxTokensTotal: 800 }
}

export default async function CreatePage() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) redirect("/auth");
  return <CreateForm />;
}
