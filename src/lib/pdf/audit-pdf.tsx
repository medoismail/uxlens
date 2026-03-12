import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { UXAuditResult, CompetitorAnalysis, VisualAnalysis } from "@/lib/types";

/* ── Register fonts — self-hosted for reliability (no CDN fetch) ── */
Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/noto-sans-400.ttf", fontWeight: 400 },
    { src: "/fonts/noto-sans-700.ttf", fontWeight: 700 },
  ],
});
Font.register({
  family: "NotoSansArabic",
  fonts: [
    { src: "/fonts/noto-sans-arabic-400.ttf", fontWeight: 400 },
    { src: "/fonts/noto-sans-arabic-700.ttf", fontWeight: 700 },
  ],
});

/* Disable hyphenation — avoids crashes on exotic word boundaries */
Font.registerHyphenationCallback((word) => [word]);

/** Detect Arabic / Hebrew / Urdu script in text */
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;

function hasRTL(text: string | undefined | null): boolean {
  return !!text && RTL_REGEX.test(text);
}

/** Check if audit data contains RTL content anywhere */
function auditHasRTL(data: UXAuditResult): boolean {
  if (hasRTL(data.executiveSummary)) return true;
  if (data.conversionKillers.some(k => hasRTL(typeof k === "string" ? k : k.title))) return true;
  if (data.quickWins.some(w => hasRTL(typeof w === "string" ? w : w.text))) return true;
  if (data.strategicFixes.some(f => hasRTL(typeof f === "string" ? f : f.text))) return true;
  if (data.sections.some(s => hasRTL(s.subtitle) || s.findings.some(f => hasRTL(f.title) || hasRTL(f.desc)))) return true;
  if (hasRTL(data.rewrite.beforeHeadline) || hasRTL(data.rewrite.afterHeadline)) return true;
  return false;
}

const BRAND = "#4C2CFF";
const BRAND_LIGHT = "#EDEAFF";

/** Build styles with the correct font family and direction for the detected script */
function buildStyles(font: string, rtl: boolean = false) {
  const align = rtl ? ("right" as const) : ("left" as const);
  const flexDir = rtl ? ("row-reverse" as const) : ("row" as const);
  const borderSide = rtl ? "borderRight" : "borderLeft";

  return StyleSheet.create({
    page: { padding: 40, paddingBottom: 60, fontSize: 10, fontFamily: font, color: "#1a1a2e" },
    header: { flexDirection: flexDir, justifyContent: "space-between", alignItems: "center", marginBottom: 30, borderBottom: "2px solid " + BRAND, paddingBottom: 15 },
    logo: { fontSize: 20, fontFamily: font, fontWeight: 700, color: BRAND },
    subtitle: { fontSize: 9, color: "#888", textAlign: align },
    scoreBox: { alignItems: "center", padding: 20, backgroundColor: BRAND_LIGHT, borderRadius: 8, marginBottom: 20 },
    bigScore: { fontSize: 48, fontFamily: font, fontWeight: 700, color: BRAND },
    grade: { fontSize: 14, fontFamily: font, fontWeight: 700, color: BRAND, marginTop: 4 },
    sectionTitle: { fontSize: 14, fontFamily: font, fontWeight: 700, color: BRAND, marginTop: 20, marginBottom: 8, textAlign: align },
    sectionSubtitle: { fontSize: 11, fontFamily: font, fontWeight: 700, color: "#1a1a2e", marginTop: 14, marginBottom: 6, textAlign: align },
    text: { fontSize: 10, lineHeight: 1.5, color: "#333", marginBottom: 4, textAlign: align },
    bulletItem: { flexDirection: flexDir, marginBottom: 4, ...(rtl ? { paddingRight: 8 } : { paddingLeft: 8 }) },
    bullet: { width: 12, fontSize: 10, color: BRAND, textAlign: align },
    bulletText: { flex: 1, fontSize: 10, lineHeight: 1.5, color: "#333", textAlign: align },
    categoryRow: { flexDirection: flexDir, justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottom: "1px solid #eee" },
    categoryLabel: { fontSize: 10, color: "#555", textAlign: align },
    categoryScore: { fontSize: 10, fontFamily: font, fontWeight: 700 },
    findingBox: { marginBottom: 6, padding: 8, backgroundColor: "#f9f9fb", borderRadius: 4, [borderSide]: "3px solid " + BRAND },
    findingTitle: { fontSize: 10, fontFamily: font, fontWeight: 700, color: "#1a1a2e", textAlign: align },
    findingDesc: { fontSize: 9, color: "#555", marginTop: 2, lineHeight: 1.4, textAlign: align },
    rewriteBox: { padding: 10, backgroundColor: BRAND_LIGHT, borderRadius: 6, marginTop: 6 },
    rewriteLabel: { fontSize: 8, fontFamily: font, fontWeight: 700, color: BRAND, marginBottom: 3, textAlign: align },
    rewriteText: { fontSize: 10, color: "#333", lineHeight: 1.4, textAlign: align },
    footer: { position: "absolute", bottom: 25, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#aaa" },
    divider: { borderBottom: "1px solid #eee", marginVertical: 12 },
  });
}

/** Default styles — overridden in AuditPDF based on content language */
const styles = buildStyles("NotoSans");

function scoreColorStr(s: number): string {
  if (s >= 75) return "#22c55e";
  if (s >= 50) return "#eab308";
  return "#ef4444";
}

function heuristicColorStr(s: number): string {
  if (s >= 7) return "#22c55e";
  if (s >= 4) return "#eab308";
  return "#ef4444";
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ef4444",
  medium: "#eab308",
  low: "#3b82f6",
};

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Generated by UXLens — www.uxlens.pro</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

interface AuditPDFProps {
  data: UXAuditResult;
  url: string;
  competitorAnalysis?: CompetitorAnalysis;
  heatmapImage?: string;
  visualAnalysis?: VisualAnalysis;
}

export function AuditPDF({ data, url, competitorAnalysis, heatmapImage, visualAnalysis }: AuditPDFProps) {
  // Always use LTR English layout — Arabic content is auto-translated before PDF export
  const isRTL = false;
  const font = "NotoSans";
  const styles = buildStyles(font, isRTL);

  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}

  const categoryEntries = [
    { label: "Message Clarity", score: data.categories.messageClarity.score },
    { label: "Cognitive Load", score: data.categories.cognitiveLoad.score },
    { label: "Conversion Architecture", score: data.categories.conversionArch.score },
    { label: "Trust Signals", score: data.categories.trustSignals.score },
    { label: "Contradictions", score: data.categories.contradictions.score },
    { label: "First Screen", score: data.categories.firstScreen.score },
  ];

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>UXLens</Text>
            <Text style={styles.subtitle}>Diagnostic Engine v0.6 — Full UX Report</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 10, fontFamily: font, fontWeight: 700 }}>{domain}</Text>
            <Text style={{ fontSize: 8, color: "#888", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.bigScore}>{data.overallScore}</Text>
          <Text style={styles.grade}>Grade: {data.grade}</Text>
        </View>

        {/* Executive Summary Metric Cards */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {(() => {
            const conversionRisk = Math.round(100 - (data.categories.conversionArch.score + data.categories.firstScreen.score) / 2);
            const readability = Math.round(100 - data.confusionMap.densityScore);
            const trustScore = data.categories.trustSignals.score;
            const complexityAvg = (data.confusionMap.jargonScore + data.confusionMap.frictionWords + data.confusionMap.decisionParalysis) / 3;
            const complexityLabel = complexityAvg >= 70 ? "Critical" : complexityAvg >= 50 ? "High" : complexityAvg >= 30 ? "Medium" : "Low";
            const complexityColor = complexityAvg >= 50 ? "#ef4444" : complexityAvg >= 30 ? "#eab308" : "#22c55e";

            const metrics = [
              { label: "Conversion Risk", value: `${conversionRisk}%`, color: scoreColorStr(100 - conversionRisk) },
              { label: "Readability", value: `${readability}%`, color: scoreColorStr(readability) },
              { label: "Trust", value: `${trustScore}/100`, color: scoreColorStr(trustScore) },
              { label: "Complexity", value: complexityLabel, color: complexityColor },
            ];
            return metrics.map((m) => (
              <View key={m.label} style={{ flex: 1, padding: 8, backgroundColor: "#f9f9fb", borderRadius: 6, alignItems: "center", borderTop: `3px solid ${m.color}` }}>
                <Text style={{ fontSize: 8, color: "#888", marginBottom: 3 }}>{m.label}</Text>
                <Text style={{ fontSize: 14, fontFamily: font, fontWeight: 700, color: m.color }}>{m.value}</Text>
              </View>
            ));
          })()}
        </View>

        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.text}>{data.executiveSummary}</Text>

        {/* Category Scores — Horizontal Bar Chart */}
        <Text style={styles.sectionTitle}>Category Scores</Text>
        {categoryEntries.map((cat) => (
          <View key={cat.label} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={[styles.categoryScore, { color: scoreColorStr(cat.score) }]}>
                {cat.score}/100
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3 }}>
              <View style={{ height: 6, backgroundColor: scoreColorStr(cat.score), borderRadius: 3, width: `${cat.score}%` }} />
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Conversion Killers */}
        <Text style={styles.sectionTitle}>Conversion Killers</Text>
        {data.conversionKillers.map((k, i) => (
          <View key={i} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{typeof k === "string" ? k : k.title}</Text>
          </View>
        ))}

        {/* Quick Wins */}
        <Text style={styles.sectionTitle}>Quick Wins</Text>
        {data.quickWins.map((w, i) => (
          <View key={i} style={styles.bulletItem}>
            <Text style={[styles.bullet, { color: "#22c55e" }]}>✓</Text>
            <Text style={styles.bulletText}>{typeof w === "string" ? w : w.text}</Text>
          </View>
        ))}

        {/* Strategic Fixes */}
        <Text style={styles.sectionTitle}>Strategic Fixes</Text>
        {data.strategicFixes.map((f, i) => (
          <View key={i} style={styles.bulletItem}>
            <Text style={styles.bullet}>→</Text>
            <Text style={styles.bulletText}>{typeof f === "string" ? f : f.text}</Text>
          </View>
        ))}

        {/* UX Strengths */}
        {data.uxStrengths && data.uxStrengths.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UX Strengths</Text>
            {data.uxStrengths.map((s, i) => (
              <View key={i} style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: "#22c55e" }]}>✓</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </>
        )}

        <PageFooter />
      </Page>

      {/* Attention Heatmap + Visual Analysis Page */}
      {(heatmapImage || visualAnalysis) && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <Text style={styles.logo}>UXLens</Text>
            <Text style={{ fontSize: 9, color: "#888" }}>{domain} — Visual Analysis</Text>
          </View>

          {/* Heatmap Image */}
          {heatmapImage && (
            <View>
              <Text style={styles.sectionTitle}>AI Attention Heatmap</Text>
              <Text style={[styles.text, { marginBottom: 8 }]}>
                AI-generated attention map showing where users are most likely to look. Red = high attention, amber = medium, blue = low.
              </Text>
              <Image
                src={heatmapImage}
                style={{ width: "100%", borderRadius: 4, border: "1px solid #eee" }}
              />
            </View>
          )}

          {/* Visual Analysis Scores */}
          {visualAnalysis && (
            <View>
              <Text style={styles.sectionTitle}>Visual Design Analysis</Text>
              <Text style={[styles.text, { marginBottom: 8 }]}>
                {visualAnalysis.summary}
              </Text>

              {/* Score rows */}
              {[
                { label: "Layout", score: visualAnalysis.layoutScore },
                { label: "Visual Hierarchy", score: visualAnalysis.visualHierarchyScore },
                { label: "Whitespace", score: visualAnalysis.whitespaceScore },
                { label: "Color & Contrast", score: visualAnalysis.colorContrastScore },
                { label: "Mobile Readiness", score: visualAnalysis.mobileReadinessScore },
                { label: "Overall Visual", score: visualAnalysis.overallVisualScore },
              ].map((item) => (
                <View key={item.label} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{item.label}</Text>
                  <Text style={[styles.categoryScore, { color: scoreColorStr(item.score) }]}>
                    {item.score}/100
                  </Text>
                </View>
              ))}

              {/* Visual findings */}
              {visualAnalysis.findings && visualAnalysis.findings.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionSubtitle}>Visual Findings</Text>
                  {visualAnalysis.findings.slice(0, 5).map((finding, fi) => (
                    <View key={fi} style={styles.findingBox}>
                      <Text style={styles.findingTitle}>
                        {finding.type === "issue" ? "⚠" : finding.type === "positive" ? "✓" : "!"} {finding.title}
                      </Text>
                      <Text style={styles.findingDesc}>{finding.desc}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <PageFooter />
        </Page>
      )}

      {/* First Screen Analysis + Confusion Map Page */}
      {(data.firstScreenAnalysis?.immediateUnderstanding || data.confusionMap) && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <Text style={styles.logo}>UXLens</Text>
            <Text style={{ fontSize: 9, color: "#888" }}>{domain} — Behavioral Insights</Text>
          </View>

          {/* First Screen Analysis */}
          {data.firstScreenAnalysis?.immediateUnderstanding && (
            <View>
              <Text style={styles.sectionTitle}>First Screen Analysis</Text>
              <Text style={[styles.text, { marginBottom: 8 }]}>
                What visitors perceive within the first 5 seconds of landing on the page.
              </Text>

              {[
                { label: "First Impression", value: data.firstScreenAnalysis.immediateUnderstanding },
                { label: "Unanswered Question", value: data.firstScreenAnalysis.unansweredQuestion },
                { label: "Dominant Emotion", value: data.firstScreenAnalysis.dominantEmotion },
                { label: "#1 Exit Reason", value: data.firstScreenAnalysis.exitReason },
                ...(data.firstScreenAnalysis.visitorMentalModel ? [{ label: "Visitor Mental Model", value: data.firstScreenAnalysis.visitorMentalModel }] : []),
                ...(data.firstScreenAnalysis.decisionBarrier ? [{ label: "Decision Barrier", value: data.firstScreenAnalysis.decisionBarrier }] : []),
              ].map((item) => (
                <View key={item.label} style={{ marginBottom: 6, padding: 8, backgroundColor: "#f9f9fb", borderRadius: 4, borderLeft: `3px solid ${BRAND}` }}>
                  <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: BRAND, marginBottom: 2 }}>{item.label}</Text>
                  <Text style={{ fontSize: 9, color: "#333", lineHeight: 1.4 }}>{item.value}</Text>
                </View>
              ))}

              {/* Attention Sequence */}
              {data.firstScreenAnalysis.attentionSequence && data.firstScreenAnalysis.attentionSequence.length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 6, padding: 8, backgroundColor: "#f9f9fb", borderRadius: 4, borderLeft: `3px solid ${BRAND}` }}>
                  <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: BRAND, marginBottom: 2 }}>Attention Sequence</Text>
                  {data.firstScreenAnalysis.attentionSequence.map((step, i) => (
                    <Text key={i} style={{ fontSize: 9, color: "#333", lineHeight: 1.4 }}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}

              {/* Clarity Confidence */}
              <View style={{ marginTop: 4, marginBottom: 8, padding: 8, backgroundColor: BRAND_LIGHT, borderRadius: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 9, fontFamily: font, fontWeight: 700, color: "#1a1a2e" }}>Clarity Confidence</Text>
                  <Text style={{ fontSize: 14, fontFamily: font, fontWeight: 700, color: scoreColorStr(data.firstScreenAnalysis.clarityConfidence) }}>
                    {data.firstScreenAnalysis.clarityConfidence}%
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, marginTop: 4 }}>
                  <View style={{ height: 4, backgroundColor: scoreColorStr(data.firstScreenAnalysis.clarityConfidence), borderRadius: 2, width: `${data.firstScreenAnalysis.clarityConfidence}%` }} />
                </View>
                <Text style={{ fontSize: 8, color: "#666", marginTop: 3 }}>
                  {data.firstScreenAnalysis.clarityConfidence >= 70 ? "Visitors likely understand the offer" : data.firstScreenAnalysis.clarityConfidence >= 40 ? "Some visitors may struggle to understand" : "Most visitors will leave confused"}
                </Text>
              </View>
            </View>
          )}

          {/* Confusion Map */}
          {data.confusionMap && (
            <View>
              <Text style={styles.sectionTitle}>Confusion Map</Text>
              <Text style={[styles.text, { marginBottom: 8 }]}>
                Cognitive friction analysis measuring how language and structure affect user comprehension.
              </Text>

              {[
                { label: "Jargon Level", score: data.confusionMap.jargonScore, impact: data.confusionMap.jargonImpact },
                { label: "Info Density", score: data.confusionMap.densityScore, impact: data.confusionMap.densityImpact },
                { label: "Friction Language", score: data.confusionMap.frictionWords, impact: data.confusionMap.frictionImpact },
                { label: "Decision Paralysis", score: data.confusionMap.decisionParalysis, impact: data.confusionMap.paralysisImpact },
              ].map((item) => (
                <View key={item.label} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 10, color: "#555" }}>{item.label}</Text>
                    <Text style={{ fontSize: 10, fontFamily: font, fontWeight: 700, color: item.score >= 70 ? "#ef4444" : item.score >= 40 ? "#eab308" : "#22c55e" }}>
                      {item.score}/100
                    </Text>
                  </View>
                  <View style={{ height: 5, backgroundColor: "#e5e7eb", borderRadius: 3 }}>
                    <View style={{ height: 5, backgroundColor: item.score >= 70 ? "#ef4444" : item.score >= 40 ? "#eab308" : "#22c55e", borderRadius: 3, width: `${item.score}%` }} />
                  </View>
                  {item.impact && (
                    <Text style={{ fontSize: 8, color: "#666", marginTop: 2, lineHeight: 1.4 }}>{item.impact}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <PageFooter />
        </Page>
      )}

      {/* Detail Pages — wraps across pages automatically */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.logo}>UXLens</Text>
          <Text style={{ fontSize: 9, color: "#888" }}>{domain} — Detailed Findings</Text>
        </View>

        {/* Sections — wrap enabled so long sections flow to next page */}
        {data.sections.map((section) => (
          <View key={section.id} wrap={false} minPresenceAhead={80}>
            <Text style={styles.sectionSubtitle}>
              {section.name} — {section.score}/100
            </Text>
            <Text style={[styles.text, { color: "#666", marginBottom: 6 }]}>
              {section.subtitle}
            </Text>
            {section.findings.slice(0, 3).map((finding, fi) => (
              <View key={fi} style={styles.findingBox}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Text style={styles.findingTitle}>
                    {finding.type === "issue" ? "⚠" : finding.type === "positive" ? "✓" : "!"} {finding.title}
                  </Text>
                  {finding.severity && (
                    <Text style={{ fontSize: 7, fontFamily: font, fontWeight: 700, color: SEVERITY_COLORS[finding.severity] || "#888", textTransform: "uppercase" }}>
                      {finding.severity}
                    </Text>
                  )}
                </View>
                <Text style={styles.findingDesc}>{finding.desc}</Text>
                {finding.recommendedFix && (
                  <Text style={{ fontSize: 8, color: "#22c55e", marginTop: 3, lineHeight: 1.4, textAlign: isRTL ? "right" : "left" }}>
                    Fix: {finding.recommendedFix}
                  </Text>
                )}
              </View>
            ))}
            {section.recommendations.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                {section.recommendations.slice(0, 2).map((rec, ri) => (
                  <View key={ri} style={styles.bulletItem}>
                    <Text style={styles.bullet}>→</Text>
                    <Text style={styles.bulletText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Per-section rewrite */}
            {section.rewrite && section.rewrite.type === "text" && section.rewrite.items?.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                <Text style={[styles.rewriteLabel, { fontSize: 9, marginBottom: 4 }]}>AI REWRITE</Text>
                {section.rewrite.items.slice(0, 3).map((item, ii) => (
                  <View key={ii} style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: "#888", marginBottom: 2, textAlign: isRTL ? "right" : "left" }}>{item.label} — BEFORE</Text>
                      <Text style={[styles.text, { fontSize: 9, color: "#999" }]}>{item.before}</Text>
                    </View>
                    <View style={[{ flex: 1 }, styles.rewriteBox]}>
                      <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: BRAND, marginBottom: 2, textAlign: isRTL ? "right" : "left" }}>{item.label} — AFTER</Text>
                      <Text style={[styles.rewriteText, { fontSize: 9 }]}>{item.after}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {section.rewrite && section.rewrite.type === "structure" && (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                <Text style={[styles.rewriteLabel, { fontSize: 9, marginBottom: 4 }]}>STRUCTURE REWRITE</Text>
                {section.rewrite.suggestedOrder?.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: "#555", marginBottom: 2, textAlign: isRTL ? "right" : "left" }}>Suggested Order</Text>
                    {section.rewrite.suggestedOrder.map((s, si) => (
                      <View key={si} style={styles.bulletItem}>
                        <Text style={[styles.bullet, { color: BRAND }]}>{si + 1}.</Text>
                        <Text style={styles.bulletText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {section.rewrite.additions?.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: "#22c55e", marginBottom: 2, textAlign: isRTL ? "right" : "left" }}>Add</Text>
                    {section.rewrite.additions.map((a, ai) => (
                      <View key={ai} style={styles.bulletItem}>
                        <Text style={[styles.bullet, { color: "#22c55e" }]}>+</Text>
                        <Text style={styles.bulletText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {section.rewrite.removals?.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: font, fontWeight: 700, color: "#ef4444", marginBottom: 2, textAlign: isRTL ? "right" : "left" }}>Remove / Reword</Text>
                    {section.rewrite.removals.map((r, ri) => (
                      <View key={ri} style={styles.bulletItem}>
                        <Text style={[styles.bullet, { color: "#ef4444" }]}>−</Text>
                        <Text style={styles.bulletText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Before/After Rewrite */}
        <Text style={styles.sectionTitle}>Hero Rewrite</Text>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewriteLabel}>BEFORE</Text>
            <Text style={styles.text}>{data.rewrite.beforeHeadline}</Text>
            <Text style={[styles.text, { fontSize: 9, color: "#666" }]}>{data.rewrite.beforeSubheadline}</Text>
          </View>
          <View style={[{ flex: 1 }, styles.rewriteBox]}>
            <Text style={styles.rewriteLabel}>AFTER</Text>
            <Text style={styles.rewriteText}>{data.rewrite.afterHeadline}</Text>
            <Text style={[styles.rewriteText, { fontSize: 9, marginTop: 3 }]}>{data.rewrite.afterSubheadline}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>

      {/* Heuristic Evaluation Page */}
      {data.heuristicEvaluation && (data.heuristicEvaluation.heuristics?.length ?? 0) > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <Text style={styles.logo}>UXLens</Text>
            <Text style={{ fontSize: 9, color: "#888" }}>{domain} — Heuristic Evaluation</Text>
          </View>

          <Text style={styles.sectionTitle}>
            Nielsen&apos;s Heuristic Evaluation — {(data.heuristicEvaluation.overallHeuristicScore ?? 0).toFixed(1)}/10
          </Text>
          <Text style={[styles.text, { marginBottom: 12 }]}>
            Each of Nielsen&apos;s 10 usability heuristics scored 0-10, with detected issues and positive observations.
          </Text>

          {data.heuristicEvaluation.heuristics.map((h, hi) => (
            <View key={hi} wrap={false} minPresenceAhead={40} style={{ marginBottom: 10, padding: 8, backgroundColor: "#f9f9fb", borderRadius: 4, [isRTL ? "borderRight" : "borderLeft"]: `3px solid ${heuristicColorStr(h.score)}` }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontFamily: font, fontWeight: 700, color: "#1a1a2e", flex: 1, textAlign: isRTL ? "right" : "left" }}>{h.name}</Text>
                <Text style={{ fontSize: 11, fontFamily: font, fontWeight: 700, color: heuristicColorStr(h.score) }}>{h.score}/10</Text>
              </View>
              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: "#e5e7eb", borderRadius: 2, marginBottom: 4 }}>
                <View style={{ height: 3, backgroundColor: heuristicColorStr(h.score), borderRadius: 2, width: `${(h.score / 10) * 100}%` }} />
              </View>
              {h.issues.length > 0 && h.issues.slice(0, 2).map((issue, ii) => (
                <Text key={ii} style={{ fontSize: 8, color: "#ef4444", lineHeight: 1.4, textAlign: isRTL ? "right" : "left", ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) }}>✕ {issue}</Text>
              ))}
              {h.passes.length > 0 && h.passes.slice(0, 1).map((pass, pi) => (
                <Text key={pi} style={{ fontSize: 8, color: "#22c55e", lineHeight: 1.4, textAlign: isRTL ? "right" : "left", ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) }}>✓ {pass}</Text>
              ))}
            </View>
          ))}

          <PageFooter />
        </Page>
      )}

      {/* Competitor Analysis Page (Pro+) */}
      {competitorAnalysis && competitorAnalysis.competitors?.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <Text style={styles.logo}>UXLens</Text>
            <Text style={{ fontSize: 9, color: "#888" }}>{domain} — Competitor Analysis</Text>
          </View>

          <Text style={styles.sectionTitle}>Competitive Position</Text>
          <Text style={styles.text}>{competitorAnalysis.competitivePosition}</Text>

          {/* Score Comparison Table */}
          <Text style={styles.sectionTitle}>Score Comparison</Text>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Your site</Text>
            <Text style={[styles.categoryScore, { color: scoreColorStr(competitorAnalysis.userOverallScore) }]}>
              {competitorAnalysis.userOverallScore}/100
            </Text>
          </View>
          {competitorAnalysis.competitors.map((comp) => (
            <View key={comp.url} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{comp.name}</Text>
              <Text style={[styles.categoryScore, { color: scoreColorStr(comp.estimatedScore) }]}>
                {comp.estimatedScore}/100 ({comp.estimatedGrade})
              </Text>
            </View>
          ))}
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryLabel, { fontFamily: font, fontWeight: 700 }]}>Score Gap</Text>
            <Text style={[styles.categoryScore, { color: competitorAnalysis.scoreGap >= 0 ? "#22c55e" : "#ef4444" }]}>
              {competitorAnalysis.scoreGap >= 0 ? "+" : ""}{competitorAnalysis.scoreGap} points
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Category-by-Category */}
          <Text style={styles.sectionTitle}>Category Comparison</Text>
          {competitorAnalysis.categoryComparisons.map((cat, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={styles.sectionSubtitle}>{cat.category}</Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12, marginBottom: 2 }}>
                <Text style={[styles.text, { flex: 1 }]}>You: {cat.userScore}</Text>
                <Text style={[styles.text, { flex: 1 }]}>{competitorAnalysis.competitors[0]?.name || "Comp 1"}: {cat.competitor1Score}</Text>
                {competitorAnalysis.competitors.length > 1 && (
                  <Text style={[styles.text, { flex: 1 }]}>{competitorAnalysis.competitors[1]?.name || "Comp 2"}: {cat.competitor2Score}</Text>
                )}
              </View>
              <Text style={[styles.text, { fontSize: 9, color: "#666" }]}>{cat.insight}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Competitor Profiles */}
          {competitorAnalysis.competitors.map((comp, ci) => (
            <View key={ci} wrap={false} minPresenceAhead={60}>
              <Text style={styles.sectionTitle}>{comp.name}</Text>
              <Text style={[styles.text, { color: "#888", fontSize: 9 }]}>{comp.url}</Text>
              <Text style={styles.sectionSubtitle}>Their Strengths</Text>
              {comp.strengths.map((s, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#ef4444" }]}>▲</Text>
                  <Text style={styles.bulletText}>{s}</Text>
                </View>
              ))}
              <Text style={styles.sectionSubtitle}>Your Advantages</Text>
              {comp.weaknesses.map((w, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#22c55e" }]}>✓</Text>
                  <Text style={styles.bulletText}>{w}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.divider} />

          {/* Competitive Advantages */}
          <Text style={styles.sectionTitle}>Competitive Advantages</Text>
          {competitorAnalysis.competitiveAdvantages.map((adv, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.bulletText}>{adv}</Text>
            </View>
          ))}

          <PageFooter />
        </Page>
      )}
    </Document>
  );
}
