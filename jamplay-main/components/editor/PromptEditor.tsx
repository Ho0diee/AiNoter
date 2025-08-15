"use client"
import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { PromptScriptSchema } from "@/lib/zod"
import { estimatePromptBudget } from "@/lib/token-estimator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function PromptEditor({ initial }: { initial: any }) {
  const [text, setText] = useState<string>(JSON.stringify(initial, null, 2))
  const [valid, setValid] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [budget, setBudget] = useState<{inTokens:number,outTokens:number,total:number}>({inTokens:0,outTokens:0,total:0})

  useEffect(() => {
    try {
      const j = JSON.parse(text)
      const parsed = PromptScriptSchema.parse(j)
      const flow = (parsed.flow ?? []).map((n:any) => ({ prompt: n.prompt, maxOutTokens: n.maxOutTokens }))
      setBudget(estimatePromptBudget(flow))
      setValid(true); setError("")
    } catch (e:any) {
      setValid(false); setError(e.message)
    }
  }, [text])

  return (
    <div className="space-y-2">
      <Textarea value={text} onChange={e => setText(e.target.value)} className="min-h-[320px] font-mono"/>
      <div className="text-sm">
        {valid ? (
          <div className="text-green-600">Valid PromptScript • Budget: in {budget.inTokens}, out {budget.outTokens}, total {budget.total} / 2000</div>
        ) : (
          <div className="text-red-600">Invalid: {error}</div>
        )}
      </div>
    </div>
  )
}
