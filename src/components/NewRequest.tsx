import { useState, useEffect, useMemo } from "react";
import { FileEdit, Upload, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentSubjectInput } from "@/components/StudentSubjectInput";
import { ChangeRequestForm } from "@/components/ChangeRequestForm";
import { loadTimetable } from "@/lib/storage";
import { validateStudentSchedule } from "@/lib/validation";
import type { Subject, RequestType } from "@/types";

interface NewRequestProps {
  onSubmit: (data: {
    label: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubject: string;
    requestType: RequestType;
  }) => void;
  /** Initial data to pre-populate the form (for cloning) */
  initialData?: {
    label?: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubject: string;
    requestType?: RequestType;
  };
  /** Whether a timetable has been uploaded */
  hasTimetable?: boolean;
  /** Callback to navigate to upload page */
  onGoToUpload?: () => void;
}

/**
 * Component for creating a new change request.
 * Combines StudentSubjectInput and ChangeRequestForm.
 */
export function NewRequest({
  onSubmit,
  initialData,
  hasTimetable = true,
  onGoToUpload,
}: NewRequestProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    initialData?.studentSubjectCodes ?? []
  );
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [dropSubject, setDropSubject] = useState(
    initialData?.dropSubject ?? ""
  );
  const [pickupSubject, setPickupSubject] = useState(
    initialData?.pickupSubject ?? ""
  );
  const [requestType, setRequestType] = useState<RequestType>(
    initialData?.requestType ?? "subject-change"
  );

  // Load timetable subjects on mount
  useEffect(() => {
    const timetable = loadTimetable();
    if (timetable) {
      setSubjects(timetable.subjects);
    }
  }, []);

  // Pre-populate from initialData when it changes (for cloning)
  useEffect(() => {
    if (initialData) {
      setSelectedCodes(initialData.studentSubjectCodes);
      setLabel(initialData.label ?? "");
      setDropSubject(initialData.dropSubject);
      setPickupSubject(initialData.pickupSubject);
      setRequestType(initialData.requestType ?? "subject-change");
    }
  }, [initialData]);

  // Handle student subject changes - reset drop/pickup when user changes subjects
  const handleSelectedCodesChange = (newCodes: string[]) => {
    setSelectedCodes(newCodes);
    // Reset drop/pickup since the student's subjects changed
    setDropSubject("");
    setPickupSubject("");
  };

  // Get selected Subject objects and validate
  const selectedSubjects = useMemo(() => {
    return subjects.filter((s) => selectedCodes.includes(s.code));
  }, [subjects, selectedCodes]);

  const validation = useMemo(() => {
    return validateStudentSchedule(selectedSubjects);
  }, [selectedSubjects]);

  const hasNoTimetable = subjects.length === 0;

  const handleSubmit = () => {
    // For class-change mode, pickupSubject should be the same as dropSubject
    const finalPickupSubject =
      requestType === "class-change" ? dropSubject : pickupSubject;

    onSubmit({
      label,
      studentSubjectCodes: selectedCodes,
      dropSubject,
      pickupSubject: finalPickupSubject,
      requestType,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
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
      </Card>

      {!hasTimetable || hasNoTimetable ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No timetable loaded</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a timetable first to create change requests.
              </p>
            </div>
            {onGoToUpload && (
              <Button onClick={onGoToUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Optional label input */}
            <div className="space-y-2">
              <label htmlFor="request-label" className="text-sm font-medium">
                Request Label{" "}
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
                onChange={handleSelectedCodesChange}
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
                  requestType={requestType}
                  onRequestTypeChange={setRequestType}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
