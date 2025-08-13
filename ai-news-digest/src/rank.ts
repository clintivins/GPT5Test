import type { Article } from './types.js';

export function rankByHeuristics(articles: Article[]): Article[] {
  // Simple heuristic: prefer titles mentioning GPT, LLM, model releases, research, funding
  const keywords = [
    'gpt',
    'llm',
    'model',
    'release',
    'openai',
    'deepmind',
    'anthropic',
    'mistral',
    'research',
    'paper',
    'dataset',
    'benchmark',
    'funding',
    'safety',
    'regulation',
  ];
  const kw = new Set(keywords);
  const score = (t: string) => {
    const low = t.toLowerCase();
    let s = 0;
    for (const k of kw) if (low.includes(k)) s += 1;
    if (low.includes('weekly') || low.includes('roundup')) s -= 1;
    return s;
  };
  return [...articles]
    .map((a) => ({ a, s: score(a.title) }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);
}
