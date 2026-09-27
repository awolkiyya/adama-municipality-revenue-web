import {
    Check,
    ClipboardCheck,
    FileEdit,
    FileText,
    User,
  } from "lucide-react";
  
  import type { StepKey } from "./assessment-form.types";
  
  export const STEPS = [
    {
      key: "taxpayer-services",
      title: "Taxpayer & Services",
      shortTitle: "Taxpayer & Services",
      icon: User,
    },
    {
      key: "details",
      title: "Service Details",
      shortTitle: "Details",
      icon: FileEdit,
    },
    {
      key: "notes",
      title: "Notes",
      shortTitle: "Notes",
      icon: FileText,
    },
    {
      key: "review",
      title: "Review & Submit",
      shortTitle: "Review",
      icon: ClipboardCheck,
    },
  ] as const;
  
  export const STEP_HELP: Record<
    StepKey,
    {
      heading: string;
      body: string;
      tips: string[];
    }
  > = {
    "taxpayer-services": {
      heading: "Who is this assessment for?",
      body: "Start by picking the taxpayer this assessment belongs to, then choose every revenue service that applies to them. You can select more than one service.",
      tips: [
        "Search by name or national ID to find a taxpayer faster.",
        "Only select services that genuinely apply — you'll fill in details for each one next.",
        "You can add or remove services later without losing taxpayer info.",
      ],
    },
  
    details: {
      heading: "Fill in the required information",
      body: "Each selected service has its own set of fields. Required fields are marked and tracked in the progress bar below — the form won't let you submit until they're complete.",
      tips: [
        "Uploaded files stay attached even if you jump between services.",
        "Number fields are checked against any configured min/max limits.",
        "In edit mode, previously uploaded files are kept unless you replace them.",
      ],
    },
  
    notes: {
      heading: "Add supporting context",
      body: "Notes are optional but helpful — use them for site visit observations, measurements, or anything an approver should know.",
      tips: [
        "This field is free text and isn't used in any calculation.",
        "You can leave this blank and add notes later.",
      ],
    },
  
    review: {
      heading: "Double-check before you send it",
      body: "This is a summary of everything entered so far. Nothing here is calculated — tariff and amount resolution happens on the backend after submission.",
      tips: [
        'Use the "Edit" links to jump straight back to any section.',
        "Saving as a draft keeps your progress without submitting for approval.",
      ],
    },
  };