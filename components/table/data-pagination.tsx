'use client'

import { Field, FieldLabel } from '@/components/ui/field'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type DataTablePaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
  disabled?: boolean
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  disabled
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const canPrevious = page > 1
  const canNext = page < totalPages

  const isDisabled = disabled || total === 0

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* LEFT: RESULT INFO */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Showing{' '}
        <span className="font-semibold text-foreground">{from}</span>
        {' '}–{' '}
        <span className="font-semibold text-foreground">{to}</span>
        {' '}of{' '}
        <span className="font-semibold text-foreground">{total}</span>
      </p>

      {/* RIGHT: CONTROLS */}
      <div className="flex flex-wrap items-center gap-3">

        {/* ROWS PER PAGE */}
        <Field orientation="horizontal" className="w-fit gap-2">
          <FieldLabel
            htmlFor="rows-per-page"
            className="text-sm font-medium text-foreground"
          >
            Rows
          </FieldLabel>

          <Select
            value={String(pageSize)}
            onValueChange={v => onPageSizeChange(Number(v))}
          >
            <SelectTrigger
              id="rows-per-page"
              className="h-9 w-[80px] text-sm"
            >
              <SelectValue className="text-sm" />
            </SelectTrigger>

            <SelectContent align="end">
              <SelectGroup>
                {pageSizeOptions.map(size => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-sm"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* PAGINATION */}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>

            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!canPrevious || isDisabled}
                className={cn(
                  'h-9 text-sm font-medium',
                  (!canPrevious || isDisabled) &&
                    'pointer-events-none opacity-50'
                )}
                onClick={e => {
                  e.preventDefault()
                  if (canPrevious && !isDisabled) {
                    onPageChange(page - 1)
                  }
                }}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!canNext || isDisabled}
                className={cn(
                  'h-9 text-sm font-medium',
                  (!canNext || isDisabled) &&
                    'pointer-events-none opacity-50'
                )}
                onClick={e => {
                  e.preventDefault()
                  if (canNext && !isDisabled) {
                    onPageChange(page + 1)
                  }
                }}
              />
            </PaginationItem>

          </PaginationContent>
        </Pagination>

      </div>
    </div>
  )
}