import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ChangeSteps } from "@/components/ChangeSteps";
import type { Solution, Subject } from "@/types";

interface SolutionCardProps {
  /** Solution to display */
  solution: Solution;
  /** Solution index (1-based for display) */
  index: number;
  /** Whether this is the recommended solution */
  isRecommended?: boolean;
  /** Student's original timetable (before changes) */
  originalTimetable: Subject[];
  /** Subject being dropped */
  dropSubject: string;
  /** Subject being picked up */
  pickupSubject: string;
  /** Whether the card starts expanded */
  defaultExpanded?: boolean;
}

/**
 * Expandable card showing a single solution with timetable grid and change steps.
 */
export function SolutionCard({
  solution,
  index,
  isRecommended = false,
  originalTimetable,
  dropSubject,
  pickupSubject,
  defaultExpanded = false,
}: SolutionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Solution {index}
                    {isRecommended && (
                      <Badge className="bg-green-600">Recommended</Badge>
                    )}
                    {solution.hasCapacityWarning && (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Over Capacity
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {solution.changes.length} change
                    {solution.changes.length !== 1 ? "s" : ""} required
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Timetable Comparison */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TimetableGrid
                  originalTimetable={originalTimetable}
                  newTimetable={solution.newTimetable}
                  dropSubject={dropSubject}
                  pickupSubject={pickupSubject}
                  title="Current Timetable"
                  mode="old"
                  showLegend={false}
                />
                <TimetableGrid
                  originalTimetable={originalTimetable}
                  newTimetable={solution.newTimetable}
                  dropSubject={dropSubject}
                  pickupSubject={pickupSubject}
                  title="New Timetable"
                  mode="new"
                  showLegend={false}
                />
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                  <span>Dropping</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                  <span>Adding</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
                  <span>Moving</span>
                </div>
              </div>
            </div>

            {/* Change Steps */}
            <div>
              <h4 className="text-sm font-medium mb-3">Required Changes</h4>
              <ChangeSteps changes={solution.changes} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
