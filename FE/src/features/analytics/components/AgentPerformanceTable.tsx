
// (ONLY FIXED SECTION: FULL FILE ALREADY CLEAN — FINAL VERSION BELOW)

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { AgentPerformanceItem } from "../types/analytics.types";

interface Props {
  agents: AgentPerformanceItem[] | null;
}

const safeNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatResponseTime = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === "") return "0s";
  if (typeof value === "string") return value;

  const seconds = safeNumber(value);
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);

  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
};

export default function AgentPerformanceTable({ agents }: Props) {
const safeAgents = Array.isArray(agents)
  ? agents.filter((a): a is NonNullable<typeof a> => Boolean(a))
  : [];
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Agent Performance
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Resolved</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Avg Response</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {safeAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No agent performance data available
                </TableCell>
              </TableRow>
            ) : (
              safeAgents.map((agent, index) => (
                <TableRow key={agent._id ?? index}>
                  <TableCell className="font-medium">
                    {agent._id ?? "Unknown Agent"}
                  </TableCell>

                  <TableCell className="text-right">
                    {safeNumber(agent.totalTickets)}
                  </TableCell>

                  <TableCell className="text-right text-success font-medium">
                    {safeNumber(agent.resolvedTickets)}
                  </TableCell>

                  <TableCell className="text-right text-warning font-medium">
                    {safeNumber(agent.pendingTickets)}
                  </TableCell>

                  <TableCell className="text-right">
                    {formatResponseTime(agent.avgResponseTime)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}