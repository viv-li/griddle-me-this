import { useState } from "react";
import type { AppView } from "@/types";
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

function App() {
  const [currentView, setCurrentView] = useState<AppView>("upload");

  const renderView = () => {
    switch (currentView) {
      case "upload":
        return (
          <TimetableUpload onComplete={() => setCurrentView("newRequest")} />
        );
      case "newRequest":
        return <NewRequest onSubmit={() => setCurrentView("results")} />;
      case "results":
        return <ResultsDisplay onBack={() => setCurrentView("history")} />;
      case "history":
        return (
          <RequestHistory
            onSelectRequest={() => setCurrentView("results")}
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
                  History
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
