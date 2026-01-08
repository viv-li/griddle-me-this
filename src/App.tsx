import { useState } from "react";
import type { AppView, ChangeRequest, Solution } from "@/types";
import { TimetableUpload } from "@/components/TimetableUpload";
import { NewRequest } from "@/components/NewRequest";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { RequestHistory } from "@/components/RequestHistory";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { History, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadTimetable, addRequest } from "@/lib/storage";
import { findSolutions, rankSolutions } from "@/lib/timetableAlgorithm";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("upload");
  const [currentRequest, setCurrentRequest] = useState<ChangeRequest | null>(
    null
  );
  const [currentSolutions, setCurrentSolutions] = useState<Solution[]>([]);

  const handleNewRequestSubmit = (data: {
    label: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubject: string;
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
      createdAt: new Date().toISOString(),
      timetableVersion: timetable.uploadedAt,
      status: "pending",
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

    // Store in state for results display
    setCurrentRequest(request);
    setCurrentSolutions(rankedSolutions);

    // Navigate to results
    setCurrentView("results");
  };

  const renderView = () => {
    switch (currentView) {
      case "upload":
        return (
          <TimetableUpload onComplete={() => setCurrentView("newRequest")} />
        );
      case "newRequest":
        return <NewRequest onSubmit={handleNewRequestSubmit} />;
      case "results":
        return (
          <ResultsDisplay
            request={currentRequest}
            solutions={currentSolutions}
            onBack={() => setCurrentView("history")}
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
            onBack={() => setCurrentView("newRequest")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1
            className="cursor-pointer text-xl font-bold"
            onClick={() => setCurrentView("upload")}
          >
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
                  Change Request
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
      <main className="container mx-auto py-8">{renderView()}</main>
    </div>
  );
}

export default App;
