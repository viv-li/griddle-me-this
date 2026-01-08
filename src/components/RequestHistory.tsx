import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RequestHistoryProps {
  onSelectRequest: (requestId: string) => void;
  onBack: () => void;
}

/**
 * Placeholder component for viewing past change requests.
 * Will be implemented in Phase 5.2.
 */
export function RequestHistory({ onSelectRequest }: RequestHistoryProps) {
  // Placeholder request data
  const placeholderRequests = [
    { id: "1", label: "Request #1", status: "pending" as const },
    { id: "2", label: "Request #2", status: "applied" as const },
  ];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Request History</CardTitle>
          <CardDescription>
            View and manage past change requests
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {placeholderRequests.map((req) => (
          <Card
            key={req.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelectRequest(req.id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{req.label}</p>
                <p className="text-sm text-muted-foreground">
                  [Full details - Phase 5.2]
                </p>
              </div>
              <Badge
                variant={req.status === "applied" ? "default" : "secondary"}
              >
                {req.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
