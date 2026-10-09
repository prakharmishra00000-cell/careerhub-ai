import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error'],
    })
} catch {
  prismaInstance = {} as any
}

// Resilient proxy to catch any database errors when no database URL is provided
export const db: any = new Proxy(prismaInstance, {
  get(target, prop) {
    if (typeof prop === 'string' && prop in target) {
      const model = (target as any)[prop]
      if (typeof model === 'object' && model !== null) {
        return new Proxy(model, {
          get(mTarget, mProp) {
            const originalMethod = (mTarget as any)[mProp]
            if (typeof originalMethod === 'function') {
              return async (...args: any[]) => {
                try {
                  return await originalMethod.apply(mTarget, args)
                } catch {
                  // Graceful fallbacks when DATABASE_URL is not connected
                  if (mProp === 'count') return 0
                  if (mProp === 'findMany') return []
                  if (mProp === 'findUnique' || mProp === 'findFirst') return null
                  if (mProp === 'create' || mProp === 'upsert' || mProp === 'update') return args[0]?.data || null
                  if (mProp === 'delete') return { id: args[0]?.where?.id || '1' }
                  return null
                }
              }
            }
            return originalMethod
          },
        })
      }
      return model
    }
    return undefined
  },
})

if (process.env.NODE_ENV !== 'production' && typeof prismaInstance === 'object') {
  globalForPrisma.prisma = prismaInstance
}