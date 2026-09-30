"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  useDirectCollections,
} from "@/hooks/revenue/use-direct-collection"
import { mapDirectCollection, resolveApiStatus } from "@/utils/helpers"



export function useFieldCollectionTable() {
  const [search, setSearch] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState("ALL")

  const [page, setPage] =
    useState(1)

  const perPage = 20

  const listParams = useMemo(() => {
    const apiStatus =
      resolveApiStatus(
        statusFilter,
      )

    return {
      page,

      per_page:
        perPage,

      ...(search.trim()
        ? {
            search:
              search.trim(),
          }
        : {}),

      ...(apiStatus
        ? {
            status:
              apiStatus,
          }
        : {}),
    }
  }, [
    page,
    search,
    statusFilter,
  ])

  const query =
    useDirectCollections(
      listParams,
    )

  const collections =
    useMemo(
      () =>
        (
          query.data?.data ??
          []
        ).map(
          mapDirectCollection,
        ),
      [query.data],
    )

  const pagination =
    query.data?.meta

  function handleSearch(
    value: string,
  ) {
    setSearch(value)
    setPage(1)
  }

  function handleStatus(
    value: string,
  ) {
    setStatusFilter(value)
    setPage(1)
  }

  function previousPage() {
    setPage(
      current =>
        Math.max(
          1,
          current - 1,
        ),
    )
  }

  function nextPage() {
    setPage(
      current =>
        Math.min(
          pagination?.last_page ??
            current,
          current + 1,
        ),
    )
  }

  function goToPage(
    targetPage: number,
  ) {
    const lastPage =
      pagination?.last_page ?? 1

    setPage(
      Math.min(
        Math.max(
          targetPage,
          1,
        ),
        lastPage,
      ),
    )
  }

  return {
    ...query,

    collections,

    pagination,

    search,
    statusFilter,
    page,
    perPage,

    setSearch:
      handleSearch,

    setStatusFilter:
      handleStatus,

    previousPage,
    nextPage,
    goToPage,
  }
}