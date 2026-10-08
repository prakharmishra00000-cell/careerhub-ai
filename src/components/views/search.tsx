'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { FilterSidebar } from '@/components/filter-sidebar'
import { JobCard } from '@/components/job-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SearchBar } from '@/components/search-bar'
import { SORT_OPTIONS } from '@/lib/jobs'
import type { View } from '@/lib/types'
import { SlidersHorizontal, SearchX, Loader2, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const presetFilters: Record<string, Partial<any>> = {
  internships: { isInternship: true, employmentType: ['internship'] },
  'remote-jobs': { remoteType: ['remote', 'work_from_home'] },
  freshers: { fresherFriendly: true },
  'government-jobs': { companyType: ['government', 'psu'] },
  search: {},
}

const presetTitles: Record<string, { title: string; subtitle: string }> = {
  internships: { title: 'Internships', subtitle: 'Paid & unpaid internships across industries' },
  'remote-jobs': { title: 'Remote jobs', subtitle: 'Work from home and remote-anywhere roles' },
  freshers: { title: 'Fresher jobs', subtitle: 'Roles explicitly open to freshers' },
  'government-jobs': { title: 'Government jobs', subtitle: 'PSU & government recruitment' },
  search: { title: 'All jobs', subtitle: 'Search across every source' },
}

export function SearchView({ preset }: { preset: View }) {
  const { filter, setFilter, runSearch, searchResults, searchLoading, setView } = useApp()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const skipDebounceRef = useRef(true)
  const lastPresetRef = useRef<string | null>(null)

  // apply preset filter on mount or preset change
  useEffect(() => {
    if (lastPresetRef.current === preset) return
    lastPresetRef.current = preset
    const pf = presetFilters[preset] || {}
    skipDebounceRef.current = true
    setFilter({ ...pf, page: 1 }, { replace: true })
    // run after a tick so the filter is set
    setTimeout(() => runSearch(), 0)
  }, [preset, setFilter, runSearch])

  // run search whenever filter changes (debounced) — skip the run triggered by preset apply
  useEffect(() => {
    if (skipDebounceRef.current) { skipDebounceRef.current = false; return }
    const t = setTimeout(() => runSearch(), 250)
    return () => clearTimeout(t)
  }, [filter, runSearch])

  const meta = presetTitles[preset] || presetTitles.search
  const jobs = searchResults?.jobs ?? []
  const total = searchResults?.total ?? 0
  const page = searchResults?.page ?? 1
  const totalPages = searchResults?.totalPages ?? 1
  const facets = searchResults?.facets

  const sortLabel: Record<string, string> = {
    relevance: 'Relevance', newest: 'Newest', salary_high: 'Salary: high to low',
    salary_low: 'Salary: low to high', best_match: 'Best match', closing_soon: 'Closing soon', recently_updated: 'Recently updated',
  }

  return (
    <div className="flex-1 w-full">
      {/* compact header */}
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight truncate">{meta.title}</h1>
              <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
            </div>
            <div className="hidden md:block flex-1 max-w-md">
              <SearchBar size="md" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={filter.sort ?? 'newest'} onValueChange={(v) => setFilter({ sort: v as any, page: 1 })}>
                <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{sortLabel[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden h-9">
                    <SlidersHorizontal className="size-4 mr-1" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-y-auto">
                  <div className="p-3">
                    <FilterSidebar facets={facets} onMobileClose={() => setMobileFiltersOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters sidebar — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto scroll-thin pr-1">
              <FilterSidebar facets={facets} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {searchLoading ? 'Searching…' : <><span className="font-semibold text-foreground">{total.toLocaleString()}</span> opportunities found</>}
              </p>
            </div>

            {searchLoading && jobs.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="size-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <SearchX className="size-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">No jobs found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">Try removing one or more filters, or broadening your search.</p>
                <Button variant="outline" onClick={() => { useApp.getState().resetFilter(); runSearch() }}>Reset all filters</Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>

                {/* pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: page - 1 })}>
                      <ChevronLeft className="size-4" /> Prev
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">Page <span className="font-medium text-foreground">{page}</span> of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilter({ page: page + 1 })}>
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* demo data notice */}
            {jobs.length > 0 && (
              <p className="text-center text-xs text-muted-foreground/60 mt-8">
                <Badge variant="outline" className="text-[10px] mr-1.5">DEMO DATA</Badge>
                Listings shown are illustrative seed data for demonstration purposes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
