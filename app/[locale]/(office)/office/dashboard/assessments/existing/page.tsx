"use client"

import { useParams } from "next/navigation"

import ExistingLizzForm from "@/components/assessment/ExistingLizzForm"

export default function EditExistingLizzPage() {
  const params = useParams()

  const assessmentId =
    typeof params.id === "string"
      ? params.id
      : undefined

  return (
    <ExistingLizzForm
      assessmentId={assessmentId}
      backUrl="/office/dashboard/revenue/existing-lizz"
    />
  )
}