const dbUrl = process.env.DATABASE_URL || ''
const isRemoteDB = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')

const inMemoryStore: Record<string, any[]> = {
  job: [],
  user: [],
  profile: [],
  company: [],
  savedJob: [],
  application: [],
  jobAlert: [],
  notification: [],
  jobReport: [],
  companyReview: [],
  searchHistory: [],
  aiGeneration: [],
}

function createInMemoryModel(modelName: string) {
  if (!inMemoryStore[modelName]) inMemoryStore[modelName] = []

  const modelImpl: Record<string, any> = {
    async count() {
      return inMemoryStore[modelName].length
    },
    async findMany(args?: any) {
      let list = inMemoryStore[modelName]
      if (args?.take && typeof args.take === 'number') {
        list = list.slice(args?.skip || 0, (args?.skip || 0) + args.take)
      }
      return list
    },
    async findUnique(args?: any) {
      const id = args?.where?.id || args?.where?.email || args?.where?.userId
      if (!id) return inMemoryStore[modelName][0] || null
      return inMemoryStore[modelName].find((item: any) => item.id === id || item.email === id || item.userId === id) || null
    },
    async findFirst(args?: any) {
      if (args?.where) {
        const key = Object.keys(args.where)[0]
        const val = args.where[key]
        return inMemoryStore[modelName].find((item: any) => item[key] === val) || null
      }
      return inMemoryStore[modelName][0] || null
    },
    async create(args: any) {
      const item = { id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...args?.data }
      inMemoryStore[modelName].push(item)
      return item
    },
    async upsert(args: any) {
      const item = { id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...(args?.create || args?.update || {}) }
      inMemoryStore[modelName].push(item)
      return item
    },
    async update(args: any) {
      return { ...args?.data, id: args?.where?.id || '1' }
    },
    async delete(args: any) {
      return { id: args?.where?.id || '1' }
    },
    async deleteMany() {
      inMemoryStore[modelName] = []
      return { count: 0 }
    },
    async groupBy() {
      return []
    },
    async aggregate() {
      return { _count: { _all: 0 } }
    },
  }

  return new Proxy(modelImpl, {
    get(target, methodProp) {
      if (typeof methodProp === 'string') {
        if (methodProp in target) return target[methodProp]
        return async () => []
      }
      return undefined
    },
  })
}

let activeDb: any = null

if (isRemoteDB) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    activeDb = new PrismaClient({ log: ['error'] })
  } catch {
    activeDb = null
  }
}

export const db: any = new Proxy(activeDb || {}, {
  get(target, prop) {
    if (typeof prop === 'string') {
      if (prop === '$transaction') {
        return async (fn: any) => (typeof fn === 'function' ? fn(db) : (Array.isArray(fn) ? Promise.all(fn) : fn))
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') return async () => []
      if (prop === '$connect' || prop === '$disconnect') return async () => {}

      if (isRemoteDB && target && prop in target) {
        const model = target[prop]
        if (typeof model === 'object' && model !== null) {
          return new Proxy(model, {
            get(mTarget, mProp) {
              const method = mTarget[mProp]
              if (typeof method === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await method.apply(mTarget, args)
                  } catch {
                    const memModel = createInMemoryModel(prop) as any
                    if (typeof memModel[mProp] === 'function') {
                      return await memModel[mProp](...args)
                    }
                    return null
                  }
                }
              }
              return method
            },
          })
        }
        return model
      }
      return createInMemoryModel(prop)
    }
    return undefined
  },
})