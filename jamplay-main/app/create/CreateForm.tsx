"use client";
import { useFormState } from "react-dom";
import { createGameAction } from "./actions";

const initial = { ok: true, error: "" } as { ok: boolean; error?: string };

export default function CreateForm() {
  const [state, formAction] = useFormState(createGameAction as any, initial);
  return (
    <form action={formAction} className="space-y-3 max-w-md">
      <input name="title" className="w-full border px-2 py-1" placeholder="Title" required />
      <textarea name="summary" className="w-full border px-2 py-1" placeholder="Summary" required />
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button type="submit" className="border px-3 py-1 rounded">Create Game</button>
    </form>
  );
}
