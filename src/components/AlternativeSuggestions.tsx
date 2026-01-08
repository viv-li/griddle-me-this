import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Subject } from "@/types";

interface AlternativeSuggestionsProps {
  /** All subjects in the timetable */
  allSubjects: Subject[];
  /** Student's current schedule */
  studentSchedule: Subject[];
  /** Subject being dropped (level+subject code) */
  dropSubject: string;
}

/**
 * Shows alternative subject suggestions when no solutions are found.
 * Suggests other subjects in the same allocation block as the dropped subject.
 */
export function AlternativeSuggestions({
  allSubjects,
  studentSchedule,
  dropSubject,
}: AlternativeSuggestionsProps) {
  // Find the dropped subject to get its allocation block
  const droppedSubject = studentSchedule.find(
    (s) => `${s.level}${s.subject}` === dropSubject
  );

  if (!droppedSubject) {
    return null;
  }

  // Find other subjects in the same allocation block
  const alternatives = allSubjects.filter((s) => {
    // Same allocation block
    if (s.allocation !== droppedSubject.allocation) return false;
    // Not the dropped subject
    if (`${s.level}${s.subject}` === dropSubject) return false;
    // Not already in student's schedule
    const inSchedule = studentSchedule.some(
      (ss) => `${ss.level}${ss.subject}` === `${s.level}${s.subject}`
    );
    if (inSchedule) return false;
    // Compatible semester
    if (
      droppedSubject.semester !== "both" &&
      s.semester !== "both" &&
      droppedSubject.semester !== s.semester
    ) {
      return false;
    }
    return true;
  });

  // Group by level+subject and pick best class (most capacity available)
  const groupedAlternatives = new Map<string, Subject>();
  for (const alt of alternatives) {
    const key = `${alt.level}${alt.subject}`;
    const existing = groupedAlternatives.get(key);
    if (!existing || alt.capacity - alt.enrolled > existing.capacity - existing.enrolled) {
      groupedAlternatives.set(key, alt);
    }
  }

  const sortedAlternatives = Array.from(groupedAlternatives.values()).sort(
    (a, b) => b.capacity - b.enrolled - (a.capacity - a.enrolled)
  );

  if (sortedAlternatives.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Alternative Suggestions
        </CardTitle>
        <CardDescription>
          Other subjects available in {droppedSubject.allocation} that might work
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sortedAlternatives.map((alt) => {
            const available = alt.capacity - alt.enrolled;
            const isFull = available <= 0;
            return (
              <Badge
                key={alt.code}
                variant={isFull ? "outline" : "secondary"}
                className={isFull ? "opacity-60" : ""}
              >
                {alt.level}
                {alt.subject}
                <span className="ml-1 text-xs opacity-70">
                  ({available > 0 ? `${available} spots` : "full"})
                </span>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
