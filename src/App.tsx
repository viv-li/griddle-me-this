import { useState, useEffect } from "react";
import type { AppView, ChangeRequest, Solution, RequestType } from "@/types";
import { TimetableUpload } from "@/components/TimetableUpload";
import { NewRequest } from "@/components/NewRequest";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { RequestHistory } from "@/components/RequestHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadTimetable,
  addRequest,
  updateRequest,
  deleteRequest,
} from "@/lib/storage";
import { findSolutions, rankSolutions } from "@/lib/timetableAlgorithm";

// Data to pre-populate a new request (for cloning)
interface CloneData {
  label?: string;
  studentSubjectCodes: string[];
  dropSubject: string;
  pickupSubject: string;
  requestType?: RequestType;
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>("upload");
  const [currentRequest, setCurrentRequest] = useState<ChangeRequest | null>(
    null
  );
  const [currentSolutions, setCurrentSolutions] = useState<Solution[]>([]);
  const [cloneData, setCloneData] = useState<CloneData | null>(null);
  const [hasTimetable, setHasTimetable] = useState(false);
  const [showNewRequestPrompt, setShowNewRequestPrompt] = useState(false);

  // Check if timetable exists on mount
  useEffect(() => {
    const timetable = loadTimetable();
    setHasTimetable(timetable !== null);
  }, []);

  // Handle timetable upload completion
  const handleTimetableUploaded = (isNewUpload: boolean) => {
    setHasTimetable(true);
    if (isNewUpload) {
      setShowNewRequestPrompt(true);
    }
  };

  // Navigate to home (history if timetable exists, upload otherwise)
  const navigateHome = () => {
    setCurrentView(hasTimetable ? "history" : "upload");
  };

  const handleNewRequestSubmit = (data: {
    label: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubject: string;
    requestType: RequestType;
  }) => {
    const timetable = loadTimetable();
    if (!timetable) return;

    // Create the change request
    const request: ChangeRequest = {
      id: crypto.randomUUID(),
      label: data.label || undefined,
      studentSubjects: data.studentSubjectCodes,
      dropSubject: data.dropSubject,
      pickupSubject: data.pickupSubject,
      requestType: data.requestType,
      createdAt: new Date().toISOString(),
      timetableVersion: timetable.uploadedAt,
    };

    // Get the student's current schedule as Subject objects
    const studentSchedule = timetable.subjects.filter((s) =>
      data.studentSubjectCodes.includes(s.code)
    );

    // Run the algorithm
    const solutions = findSolutions(
      timetable.subjects,
      studentSchedule,
      data.dropSubject,
      data.pickupSubject
    );

    // Rank the solutions
    const rankedSolutions = rankSolutions(solutions);

    // Save the request
    addRequest(request);

    // Clear clone data after submission
    setCloneData(null);

    // Store in state for results display
    setCurrentRequest(request);
    setCurrentSolutions(rankedSolutions);

    // Navigate to results
    setCurrentView("results");
  };

  const handleCloneRequest = (request: ChangeRequest) => {
    setCloneData({
      label: request.label ? `${request.label} (copy)` : undefined,
      studentSubjectCodes: request.studentSubjects,
      dropSubject: request.dropSubject,
      pickupSubject: request.pickupSubject,
      requestType: request.requestType,
    });
    setCurrentView("newRequest");
  };

  const handleDeleteRequest = (requestId: string) => {
    deleteRequest(requestId);
    // If we're viewing this request, go back to history
    if (currentRequest?.id === requestId) {
      setCurrentRequest(null);
      setCurrentSolutions([]);
      setCurrentView("history");
    }
  };

  const handleRerunRequest = () => {
    if (!currentRequest) return;

    const timetable = loadTimetable();
    if (!timetable) return;

    // Get the student's schedule from the saved subject codes
    const studentSchedule = timetable.subjects.filter((s) =>
      currentRequest.studentSubjects.includes(s.code)
    );

    // Rerun the algorithm with current timetable data
    const solutions = findSolutions(
      timetable.subjects,
      studentSchedule,
      currentRequest.dropSubject,
      currentRequest.pickupSubject
    );

    const rankedSolutions = rankSolutions(solutions);

    // Update the request's timetable version
    const updatedRequest = {
      ...currentRequest,
      timetableVersion: timetable.uploadedAt,
    };
    updateRequest(currentRequest.id, {
      timetableVersion: timetable.uploadedAt,
    });

    setCurrentRequest(updatedRequest);
    setCurrentSolutions(rankedSolutions);
  };

  const isCurrentRequestStale = () => {
    if (!currentRequest) return false;
    const timetable = loadTimetable();
    return (
      timetable !== null &&
      currentRequest.timetableVersion !== timetable.uploadedAt
    );
  };

  const renderView = () => {
    switch (currentView) {
      case "upload":
        return <TimetableUpload onTimetableChange={handleTimetableUploaded} />;
      case "newRequest":
        return (
          <NewRequest
            onSubmit={handleNewRequestSubmit}
            initialData={cloneData || undefined}
            hasTimetable={hasTimetable}
            onGoToUpload={() => setCurrentView("upload")}
          />
        );
      case "results":
        return (
          <ResultsDisplay
            request={currentRequest}
            solutions={currentSolutions}
            isStale={isCurrentRequestStale()}
            onBack={() => setCurrentView("history")}
            onLabelChange={(newLabel) => {
              if (currentRequest) {
                updateRequest(currentRequest.id, {
                  label: newLabel || undefined,
                });
                setCurrentRequest({
                  ...currentRequest,
                  label: newLabel || undefined,
                });
              }
            }}
            onRerun={handleRerunRequest}
            onClone={
              currentRequest
                ? () => handleCloneRequest(currentRequest)
                : undefined
            }
            onDelete={
              currentRequest
                ? () => handleDeleteRequest(currentRequest.id)
                : undefined
            }
          />
        );
      case "history":
        return (
          <RequestHistory
            onSelectRequest={(request, solutions) => {
              setCurrentRequest(request);
              setCurrentSolutions(solutions);
              setCurrentView("results");
            }}
            onCloneRequest={handleCloneRequest}
            onNewRequest={() => setCurrentView("newRequest")}
            hasTimetable={hasTimetable}
            onGoToUpload={() => setCurrentView("upload")}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1
              className="cursor-pointer text-xl font-bold flex items-center gap-2"
              onClick={navigateHome}
            >
              <svg viewBox="0 0 32 32" className="h-7 w-7">
                <rect width="32" height="32" rx="6" fill="#18181b" />
                <rect x="5" y="5" width="9" height="9" rx="2" fill="#3b82f6" />
                <rect x="18" y="5" width="9" height="9" rx="2" fill="#22c55e" />
                <rect x="5" y="18" width="9" height="9" rx="2" fill="#8b5cf6" />
                <rect
                  x="18"
                  y="18"
                  width="9"
                  height="9"
                  rx="2"
                  fill="#f59e0b"
                />
              </svg>
              Griddle Me This
            </h1>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "cursor-pointer",
                      currentView === "upload" &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setCurrentView("upload")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Timetable
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "cursor-pointer",
                      currentView === "newRequest" &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setCurrentView("newRequest")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "cursor-pointer",
                      currentView === "history" &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setCurrentView("history")}
                  >
                    <History className="mr-2 h-4 w-4" />
                    All Requests
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">{renderView()}</main>

        {/* New Request Prompt Modal */}
        <Dialog
          open={showNewRequestPrompt}
          onOpenChange={setShowNewRequestPrompt}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timetable Uploaded!</DialogTitle>
              <DialogDescription>
                Your timetable has been loaded successfully. Would you like to
                create a subject change request now?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowNewRequestPrompt(false)}
              >
                Not Now
              </Button>
              <Button
                onClick={() => {
                  setShowNewRequestPrompt(false);
                  setCurrentView("newRequest");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default App;
