import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResultsDisplayProps {
  onBack: () => void;
}

/**
 * Placeholder component for displaying algorithm results.
 * Will contain TimetableGrid, ChangeSteps, SolutionCard (Phase 4).
 */
export function ResultsDisplay({ onBack }: ResultsDisplayProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Solutions Found</CardTitle>
          <CardDescription>
            Results will be displayed here after running the algorithm
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solution 1</CardTitle>
          <CardDescription>Recommended - No capacity warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            [TimetableGrid + ChangeSteps - Phase 4.1-4.2]
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solution 2</CardTitle>
          <CardDescription>Alternative configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            [Alternative configuration - Phase 4.3]
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
