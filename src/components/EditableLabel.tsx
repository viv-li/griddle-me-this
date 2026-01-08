import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface EditableLabelProps {
  /** Current label value */
  value: string;
  /** Placeholder when empty */
  placeholder?: string;
  /** Callback when label is saved */
  onSave: (newValue: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Inline editable label that turns into an input on click.
 * Saves on blur or Enter, cancels on Escape.
 */
export function EditableLabel({
  value,
  placeholder = "Untitled",
  onSave,
  className,
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update edit value when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    onSave(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className={cn("h-8 text-base font-medium", className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group inline-flex items-center gap-1.5 text-left font-medium hover:text-primary transition-colors",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      <span className="truncate">{value || placeholder}</span>
      <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
    </button>
  );
}
