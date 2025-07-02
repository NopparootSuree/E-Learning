// Progress update debouncer to reduce API calls
export class ProgressDebouncer {
  private pendingUpdates = new Map<string, {
    data: any
    timestamp: number
    resolve: (value: any) => void
    reject: (error: any) => void
  }>()
  
  private timers = new Map<string, NodeJS.Timeout>()
  private readonly debounceTime: number
  private readonly maxWaitTime: number

  constructor(debounceTime = 2000, maxWaitTime = 10000) {
    this.debounceTime = debounceTime
    this.maxWaitTime = maxWaitTime
  }

  async updateProgress(
    key: string, 
    data: any, 
    updateFunction: (data: any) => Promise<any>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      
      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!)
      }

      // Check if we need to flush immediately (max wait time exceeded)
      const existing = this.pendingUpdates.get(key)
      const shouldFlushImmediately = existing && (now - existing.timestamp) >= this.maxWaitTime

      if (shouldFlushImmediately) {
        // Execute immediately
        this.executePendingUpdate(key, updateFunction)
      }

      // Store the new update
      this.pendingUpdates.set(key, {
        data: { ...existing?.data, ...data },
        timestamp: existing?.timestamp || now,
        resolve,
        reject
      })

      // Set new timer
      const timer = setTimeout(() => {
        this.executePendingUpdate(key, updateFunction)
      }, this.debounceTime)

      this.timers.set(key, timer)
    })
  }

  private async executePendingUpdate(key: string, updateFunction: (data: any) => Promise<any>) {
    const pending = this.pendingUpdates.get(key)
    if (!pending) return

    // Clean up
    this.pendingUpdates.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
      this.timers.delete(key)
    }

    try {
      const result = await updateFunction(pending.data)
      pending.resolve(result)
    } catch (error) {
      pending.reject(error)
    }
  }

  // Force flush all pending updates
  async flushAll(updateFunction: (key: string, data: any) => Promise<any>) {
    const promises: Promise<any>[] = []
    
    for (const [key, pending] of this.pendingUpdates.entries()) {
      promises.push(
        updateFunction(key, pending.data)
          .then(pending.resolve)
          .catch(pending.reject)
      )
    }

    // Clear all timers and pending updates
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.pendingUpdates.clear()

    return Promise.allSettled(promises)
  }

  // Get pending update count for monitoring
  getPendingCount(): number {
    return this.pendingUpdates.size
  }
}

// Global instance for progress updates
export const progressDebouncer = new ProgressDebouncer()