// very rough char->token heuristic (~4 chars per token)
export function estimateTokensFromText(text: string): number {
  const chars = text?.length ?? 0
  return Math.ceil(chars / 4)
}
export function estimatePromptBudget(flow: {prompt: string, maxOutTokens?: number}[]) {
  const inTokens = flow.reduce((acc, n) => acc + estimateTokensFromText(n.prompt), 0)
  const outTokens = flow.reduce((acc, n) => acc + (n.maxOutTokens ?? 0), 0)
  return { inTokens, outTokens, total: inTokens + outTokens }
}
