import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import type { LeverWithPlaybook, DealChatContext } from '@/lib/types';

export const maxDuration = 30;

function fmt(n: number | null | undefined): string {
  if (!n) return 'unknown';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function buildLeverContext(levers: LeverWithPlaybook[]): string {
  if (!levers || levers.length === 0) return '';

  return levers.map((lw) => {
    const p = lw.playbook;
    const lines: string[] = [`## ${lw.lever_name} (${lw.lever_type} lever)`];
    if (p?.what_it_is) lines.push(`**What it is:** ${p.what_it_is}`);
    if (p?.what_drives_it) lines.push(`**What drives it:** ${p.what_drives_it}`);
    if (p?.diligence_questions?.length) {
      lines.push('**Diligence questions:**');
      p.diligence_questions.forEach((q) => lines.push(`- ${q}`));
    }
    if (p?.red_flags?.length) {
      lines.push('**Red flags:**');
      p.red_flags.forEach((f) => lines.push(`- ${f}`));
    }
    if (p?.team_notes) lines.push(`**Team notes:** ${p.team_notes}`);
    return lines.join('\n');
  }).join('\n\n');
}

function buildDealContext(ctx: DealChatContext): string {
  const isOverview = ctx.lever_type === 'overview';
  const combined = (ctx.acquirer_revenue ?? 0) + (ctx.target_revenue ?? 0);

  const lines: string[] = [
    `# Active Deal Context: ${ctx.deal_name}`,
    `**Acquirer:** ${ctx.acquirer_name} (${fmt(ctx.acquirer_revenue)} revenue)`,
    `**Target:** ${ctx.target_name} (${fmt(ctx.target_revenue)} revenue)`,
    `**Combined revenue:** ${fmt(combined)}`,
  ];

  if (isOverview) {
    lines.push(
      '',
      `## Total Cost Synergy Opportunity`,
      `**Benchmark range:** ${ctx.pct_low}–${ctx.pct_high}% of combined revenue`,
      `**Implied $ range:** ${fmt(ctx.value_low)} – ${fmt(ctx.value_high)}`,
      `**Based on:** ${ctx.benchmark_n} comparable transactions`,
    );
    if (ctx.subtypes?.length) {
      lines.push('', '**Lever-by-lever breakdown:**');
      ctx.subtypes.forEach(st =>
        lines.push(`- **${st.name}:** ${st.description} (benchmark median ${st.typical_pct.toFixed(1)}% of combined revenue)`)
      );
    }
  } else {
    lines.push(
      '',
      `## Focused Lever: ${ctx.lever_name} (${ctx.lever_type})`,
      `**Benchmark range:** ${ctx.pct_low}–${ctx.pct_high}% of combined revenue`,
      `**Implied $ opportunity:** ${fmt(ctx.value_low)} – ${fmt(ctx.value_high)}`,
      `**Based on:** ${ctx.benchmark_n} comparable transactions`,
    );
    if (ctx.subtypes?.length) {
      lines.push('', '**Typical sub-type breakdown:**');
      ctx.subtypes.forEach(st => lines.push(`- ${st.name}: ~${st.typical_pct}% of ${ctx.lever_name} savings — ${st.description}`));
    }
    const answered = Object.entries(ctx.environment_data ?? {}).filter(([, v]) => v?.trim());
    if (answered.length) {
      lines.push('', '**Deal environment — analyst findings so far:**');
      answered.forEach(([q, a]) => lines.push(`- ${q}: ${a}`));
    } else {
      lines.push('', '**Deal environment:** No specific data collected yet — analysis is benchmark-only.');
    }
  }

  return lines.join('\n');
}

export async function POST(req: Request) {
  const { messages, leverContext, dealContext } = await req.json() as {
    messages: UIMessage[];
    leverContext?: LeverWithPlaybook[];
    dealContext?: DealChatContext;
  };

  const knowledgeBase = leverContext ? buildLeverContext(leverContext) : '';
  const dealSection = dealContext ? buildDealContext(dealContext) : '';

  const systemPrompt = `You are a knowledgeable M&A integration advisor helping analysts understand merger synergy methodology and scope specific deals. You have deep expertise in how synergies are identified, measured, and captured in post-merger integration.

Your role is to answer questions about the lever playbook methodology — the 6 cost levers (IT, Finance, HR, Operations, Procurement, Real Estate) and 1 revenue lever. When a deal context is provided, anchor your answers to that specific deal.

Guidelines:
- Be concise and precise — analysts are professionals, not students
- When a deal context is loaded, use the companies' actual names, revenues, and known environment data
- Suggest specific next diligence steps when analysts ask about scoping
- Cite specific lever content when answering (diligence questions, red flags)
- Format responses clearly — use short paragraphs or bullet points as appropriate
${dealSection ? `\n---\n${dealSection}` : ''}
${knowledgeBase ? `\n---\n# Lever Knowledge Base\n\n${knowledgeBase}` : ''}`;

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });

  return result.toUIMessageStreamResponse();
}
