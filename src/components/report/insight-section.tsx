"use client";

import { motion } from "framer-motion";

interface Insight {
  type: string;
  title: string;
  description: string;
  evidenceRef: unknown;
}

export function InsightSection({
  title,
  insights,
  type,
  icon: Icon,
  colorClass,
}: {
  title: string;
  insights: Insight[];
  type: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  const filtered = insights.filter((i) => i.type === type);
  if (filtered.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        {title}
      </h3>
      <div className="space-y-2">
        {filtered.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-foreground font-medium mb-1">{insight.title}</p>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
