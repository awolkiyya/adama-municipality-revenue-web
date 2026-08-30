"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Field,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Loader2 } from "lucide-react";

import { ClusterDropdown } from "@/components/input/ClusterDropdown";
import { Cluster, Sector } from "@/types/admin-unit";
import { SectorFormData, sectorSchema } from "@/lib/zod-forms/sector.schema";





// /* =========================
//    TYPES
// ========================= */

// interface Sector {
//   id: string;
//   name: string;
//   code: string;
//   description?: string | null;
//   cluster_id: string;
// }


interface SectorDialogProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  sector?: Sector | null;

  onSubmit: (data: SectorFormData) => void;

  isLoading?: boolean;
}



/* =========================
   COMPONENT
========================= */

export function SectorDialog({
  open,
  onOpenChange,
  sector,
  onSubmit,
  isLoading = false,
}: SectorDialogProps) {


  const form = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),

    defaultValues: {
      name: "",
      code: "",
      description: "",
      cluster_id: "",
    },
  });



  useEffect(() => {

    if (sector) {

      form.reset({
        name: sector.name,
        code: sector.code,
        description: sector.description ?? "",
        cluster_id: sector.cluster.id,
      });

    } else {

      form.reset({
        name: "",
        code: "",
        description: "",
        cluster_id: "",
      });

    }

  }, [sector, open, form]);



  return (

    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent className="sm:max-w-lg">


        <DialogHeader>

          <DialogTitle>
            {sector
              ? "Update Sector"
              : "Create Sector"}
          </DialogTitle>

        </DialogHeader>



        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >


          <FieldGroup>


            {/* Cluster */}

            <Field>

              <FieldLabel>
                Cluster
              </FieldLabel>


              <ClusterDropdown

                value={
                  form.watch("cluster_id")
                }

                onChange={
                  (
                    value: string,
                    _item: Cluster
                  ) => {

                    form.setValue(
                      "cluster_id",
                      value,
                      {
                        shouldValidate: true,
                      }
                    );

                  }
                }

              />


              <FieldError>
                {
                  form.formState.errors.cluster_id?.message
                }
              </FieldError>


            </Field>




            {/* Name */}

            <Field>

              <FieldLabel>
                Sector Name
              </FieldLabel>


              <Input

                placeholder="Enter sector name"

                {...form.register("name")}

              />


              <FieldError>
                {
                  form.formState.errors.name?.message
                }
              </FieldError>


            </Field>




            {/* Code */}

            <Field>

              <FieldLabel>
                Sector Code
              </FieldLabel>


              <Input

                placeholder="Example: SEC-001"

                {...form.register("code")}

              />


              <FieldError>
                {
                  form.formState.errors.code?.message
                }
              </FieldError>


            </Field>




            {/* Description */}

            <Field>

              <FieldLabel>
                Description
              </FieldLabel>


              <Textarea

                placeholder="Describe the sector"

                rows={4}

                {...form.register("description")}

              />


              <FieldError>
                {
                  form.formState.errors.description?.message
                }
              </FieldError>


            </Field>


          </FieldGroup>




          <DialogFooter>


            <Button

              type="button"

              variant="outline"

              onClick={() =>
                onOpenChange(false)
              }

            >
              Cancel

            </Button>



            <Button

              disabled={isLoading}

              type="submit"

            >

              {
                isLoading && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )
              }


              {
                sector
                  ? "Update Sector"
                  : "Create Sector"
              }


            </Button>


          </DialogFooter>


        </form>


      </DialogContent>


    </Dialog>

  );
}