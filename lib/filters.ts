// Filter utilities and query builders

export interface FilterParams {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  department?: string
  company?: string
  section?: string
  courseId?: string
  employeeId?: string
  groupId?: string
  minScore?: number
  maxScore?: number
  minProgress?: number
  maxProgress?: number
  contentType?: string
  testType?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Build Prisma where clause from filter parameters
export function buildWhereClause(filters: FilterParams): any {
  const where: any = {
    deletedAt: null
  }

  // Text search
  if (filters.search) {
    const searchTerms = filters.search.trim().split(/\s+/)
    where.OR = searchTerms.map(term => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
        { idEmp: { contains: term, mode: 'insensitive' } }
      ].filter(condition => Object.keys(condition)[0] !== undefined)
    }))
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      where.createdAt.lte = toDate
    }
  }

  // Department/Company filters
  if (filters.department) {
    where.department = filters.department
  }
  if (filters.company) {
    where.company = filters.company
  }
  if (filters.section) {
    where.section = filters.section
  }

  // Relation filters
  if (filters.courseId) {
    where.courseId = filters.courseId
  }
  if (filters.employeeId) {
    where.employeeId = filters.employeeId
  }
  if (filters.groupId) {
    where.groupId = filters.groupId
  }

  // Numeric range filters
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    where.finalScore = {}
    if (filters.minScore !== undefined) {
      where.finalScore.gte = filters.minScore
    }
    if (filters.maxScore !== undefined) {
      where.finalScore.lte = filters.maxScore
    }
  }

  if (filters.minProgress !== undefined || filters.maxProgress !== undefined) {
    where.contentProgress = {}
    if (filters.minProgress !== undefined) {
      where.contentProgress.gte = filters.minProgress
    }
    if (filters.maxProgress !== undefined) {
      where.contentProgress.lte = filters.maxProgress
    }
  }

  // Content type filter
  if (filters.contentType && filters.contentType !== 'all') {
    where.contentType = filters.contentType
  }

  // Test type filter
  if (filters.testType && filters.testType !== 'all') {
    where.type = filters.testType
  }

  return where
}

// Build order by clause
export function buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any {
  const orderBy: any = {}
  
  switch (sortBy) {
    case 'name':
      orderBy.name = sortOrder
      break
    case 'title':
      orderBy.title = sortOrder
      break
    case 'createdAt':
      orderBy.createdAt = sortOrder
      break
    case 'updatedAt':
      orderBy.updatedAt = sortOrder
      break
    case 'progress':
      orderBy.contentProgress = sortOrder
      break
    case 'score':
      orderBy.finalScore = sortOrder
      break
    case 'department':
      orderBy.department = sortOrder
      break
    case 'company':
      orderBy.company = sortOrder
      break
    default:
      orderBy.createdAt = 'desc'
  }

  return orderBy
}

// Extract pagination parameters
export function getPaginationParams(filters: FilterParams) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.max(1, Math.min(100, filters.limit || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

// Build URL query string from filters
export function buildQueryString(filters: FilterParams): string {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}

// Parse URL query string to filters
export function parseQueryString(queryString: string): FilterParams {
  const params = new URLSearchParams(queryString)
  const filters: FilterParams = {}

  // String parameters
  ;['search', 'status', 'dateFrom', 'dateTo', 'department', 'company', 'section', 'courseId', 'employeeId', 'groupId', 'contentType', 'testType', 'sortBy', 'sortOrder'].forEach(key => {
    const value = params.get(key)
    if (value) {
      (filters as any)[key] = value
    }
  })

  // Number parameters
  ;['minScore', 'maxScore', 'minProgress', 'maxProgress', 'page', 'limit'].forEach(key => {
    const value = params.get(key)
    if (value) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        (filters as any)[key] = num
      }
    }
  })

  return filters
}

// Generate filter badges for display
export function generateFilterBadges(
  filters: FilterParams,
  options: {
    departments?: Array<{ value: string; label: string }>
    companies?: Array<{ value: string; label: string }>
    courses?: Array<{ value: string; label: string }>
    employees?: Array<{ value: string; label: string }>
  } = {}
) {
  const badges: Array<{ key: string; label: string; value: string; onRemove: () => void }> = []

  // Helper to find label
  const findLabel = (value: string, list?: Array<{ value: string; label: string }>) => {
    return list?.find(item => item.value === value)?.label || value
  }

  if (filters.search) {
    badges.push({
      key: 'search',
      label: 'ค้นหา',
      value: filters.search,
      onRemove: () => ({ ...filters, search: undefined })
    })
  }

  if (filters.status && filters.status !== 'all') {
    badges.push({
      key: 'status',
      label: 'สถานะ',
      value: filters.status,
      onRemove: () => ({ ...filters, status: undefined })
    })
  }

  if (filters.dateFrom && filters.dateTo) {
    badges.push({
      key: 'dateRange',
      label: 'ช่วงวันที่',
      value: `${filters.dateFrom} - ${filters.dateTo}`,
      onRemove: () => ({ ...filters, dateFrom: undefined, dateTo: undefined })
    })
  }

  if (filters.department) {
    badges.push({
      key: 'department',
      label: 'แผนก',
      value: findLabel(filters.department, options.departments),
      onRemove: () => ({ ...filters, department: undefined })
    })
  }

  if (filters.company) {
    badges.push({
      key: 'company',
      label: 'บริษัท',
      value: findLabel(filters.company, options.companies),
      onRemove: () => ({ ...filters, company: undefined })
    })
  }

  if (filters.courseId) {
    badges.push({
      key: 'course',
      label: 'หลักสูตร',
      value: findLabel(filters.courseId, options.courses),
      onRemove: () => ({ ...filters, courseId: undefined })
    })
  }

  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    const scoreRange = `${filters.minScore || 0} - ${filters.maxScore || 100}`
    badges.push({
      key: 'scoreRange',
      label: 'คะแนน',
      value: scoreRange,
      onRemove: () => ({ ...filters, minScore: undefined, maxScore: undefined })
    })
  }

  if (filters.minProgress !== undefined || filters.maxProgress !== undefined) {
    const progressRange = `${filters.minProgress || 0}% - ${filters.maxProgress || 100}%`
    badges.push({
      key: 'progressRange',
      label: 'ความคืบหน้า',
      value: progressRange,
      onRemove: () => ({ ...filters, minProgress: undefined, maxProgress: undefined })
    })
  }

  return badges
}