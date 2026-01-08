import { useState, useEffect, useMemo } from "react";
import { FileEdit, AlertCircle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StudentSubjectInput } from "@/components/StudentSubjectInput";
import { ChangeRequestForm } from "@/components/ChangeRequestForm";
import { loadTimetable } from "@/lib/storage";
import { validateStudentSchedule } from "@/lib/validation";
import type { Subject } from "@/types";

interface NewRequestProps {
  onSubmit: (data: {
    label: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubject: string;
  }) => void;
}

/**
 * Component for creating a new change request.
 * Combines StudentSubjectInput and ChangeRequestForm.
 */
export function NewRequest({ onSubmit }: NewRequestProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [label, setLabel] = useState("");
  const [dropSubject, setDropSubject] = useState("");
  const [pickupSubject, setPickupSubject] = useState("");

  // Load timetable subjects on mount
  useEffect(() => {
    const timetable = loadTimetable();
    if (timetable) {
      setSubjects(timetable.subjects);
    }
  }, []);

  // Get selected Subject objects and validate
  const selectedSubjects = useMemo(() => {
    return subjects.filter((s) => selectedCodes.includes(s.code));
  }, [subjects, selectedCodes]);

  const validation = useMemo(() => {
    return validateStudentSchedule(selectedSubjects);
  }, [selectedSubjects]);

  const hasNoTimetable = subjects.length === 0;

  const handleSubmit = () => {
    onSubmit({
      label,
      studentSubjectCodes: selectedCodes,
      dropSubject,
      pickupSubject,
    });
  };

  // Reset drop/pickup when student subjects change
  useEffect(() => {
    setDropSubject("");
    setPickupSubject("");
  }, [selectedCodes]);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileEdit className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>New Change Request</CardTitle>
        <CardDescription>
          Enter the student's current subjects, then specify what they want to
          change
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasNoTimetable ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">No timetable loaded</p>
              <p className="text-xs mt-1">
                Please upload a timetable first before creating a change
                request.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Optional label input */}
            <div className="space-y-2">
              <label htmlFor="request-label" className="text-sm font-medium">
                Label{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                id="request-label"
                placeholder="e.g. JD, Period 3 request, Art swap..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Do not include student identifying information. This label is
                  only for your reference.
                </span>
              </p>
            </div>

            {/* Student Subject Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Student's Current Subjects
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Enter all subjects the student is currently enrolled in
              </p>
              <StudentSubjectInput
                subjects={subjects}
                selectedCodes={selectedCodes}
                onChange={setSelectedCodes}
              />
            </div>

            {/* Change Request Form */}
            {validation.valid && (
              <div className="border-t pt-6">
                <ChangeRequestForm
                  allSubjects={subjects}
                  studentSubjects={selectedSubjects}
                  dropSubject={dropSubject}
                  onDropChange={setDropSubject}
                  pickupSubject={pickupSubject}
                  onPickupChange={setPickupSubject}
                  onSubmit={handleSubmit}
                />
              </div>
            )}

            {/* Show prompt to complete schedule */}
            {!validation.valid && selectedCodes.length > 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                Complete the student's schedule to continue with the change
                request
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
