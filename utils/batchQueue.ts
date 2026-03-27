/**
 * Batch Queue System for Managing Multiple Regeneration Jobs
 *
 * Provides a robust queue system for handling batch page regeneration operations
 * with concurrency control, progress tracking, and pause/resume capabilities.
 *
 * Features:
 * - Concurrency control (default max 2 concurrent jobs to avoid Gemini rate limits)
 * - Pause/resume queue processing
 * - Cancel individual jobs or entire queue
 * - Progress tracking per job and overall
 * - Retry failed jobs option
 * - Event callbacks for UI updates
 * - React hook wrapper for easy integration
 *
 * @module utils/batchQueue
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Status of an individual batch job
 */
export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Represents a single regeneration job in the batch queue
 */
export interface BatchJob {
  /** Unique identifier for the job */
  id: string;
  /** Page index this job is regenerating */
  pageIndex: number;
  /** Current status of the job */
  status: BatchJobStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Image URL on successful completion */
  result?: string;
  /** Error message if job failed */
  error?: string;
  /** Timestamp when job started executing */
  startedAt?: number;
  /** Timestamp when job completed (success or failure) */
  completedAt?: number;
}

/**
 * Internal representation with the regeneration function
 */
interface InternalBatchJob extends BatchJob {
  /** Function that performs the actual regeneration */
  regenerateFn: () => Promise<string>;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Configuration options for the BatchQueue
 */
export interface BatchQueueOptions {
  /** Maximum number of concurrent jobs (default: 2) */
  maxConcurrent: number;
  /** Maximum retry attempts for failed jobs (default: 0, no automatic retry) */
  maxRetries?: number;
  /** Called when a job starts processing */
  onJobStart?: (job: BatchJob) => void;
  /** Called when a job completes successfully */
  onJobComplete?: (job: BatchJob) => void;
  /** Called when a job fails */
  onJobError?: (job: BatchJob, error: Error) => void;
  /** Called when the entire queue finishes processing */
  onQueueComplete?: (jobs: BatchJob[]) => void;
  /** Called when overall progress changes */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Progress information for the queue
 */
export interface BatchQueueProgress {
  /** Number of completed jobs */
  completed: number;
  /** Total number of jobs in queue */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique job ID
 *
 * @param pageIndex - The page index for the job
 * @returns Unique string ID
 */
function generateJobId(pageIndex: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `batch-${pageIndex}-${timestamp}-${random}`;
}

// ============================================================================
// BATCH QUEUE CLASS
// ============================================================================

/**
 * BatchQueue manages multiple regeneration jobs with concurrency control.
 *
 * @example
 * ```typescript
 * const queue = new BatchQueue({
 *   maxConcurrent: 2,
 *   onJobComplete: (job) => console.log(`Page ${job.pageIndex} completed`),
 *   onQueueComplete: (jobs) => console.log('All jobs finished'),
 * });
 *
 * // Add jobs
 * queue.addJobs([
 *   { pageIndex: 1, regenerateFn: () => regeneratePage(1) },
 *   { pageIndex: 2, regenerateFn: () => regeneratePage(2) },
 *   { pageIndex: 3, regenerateFn: () => regeneratePage(3) },
 * ]);
 *
 * // Start processing
 * queue.start();
 *
 * // Check progress
 * const progress = queue.getProgress();
 * console.log(`${progress.percentage}% complete`);
 *
 * // Pause/resume
 * queue.pause();
 * queue.resume();
 *
 * // Cancel if needed
 * queue.cancel();
 * ```
 */
export class BatchQueue {
  // Configuration
  private maxConcurrent: number;
  private maxRetries: number;
  private options: BatchQueueOptions;

  // Queue state
  private jobs: Map<string, InternalBatchJob> = new Map();
  private _isRunning: boolean = false;
  private _isPaused: boolean = false;
  private isProcessing: boolean = false;

  // Job ordering (maintains insertion order)
  private jobOrder: string[] = [];

  /**
   * Creates a new BatchQueue instance
   *
   * @param options - Configuration options
   */
  constructor(options: BatchQueueOptions) {
    this.maxConcurrent = options.maxConcurrent ?? 2;
    this.maxRetries = options.maxRetries ?? 0;
    this.options = options;
  }

  // ==========================================================================
  // PUBLIC METHODS - Job Management
  // ==========================================================================

  /**
   * Adds a single job to the queue
   *
   * @param pageIndex - Page index to regenerate
   * @param regenerateFn - Async function that performs the regeneration
   * @returns The generated job ID
   */
  addJob(pageIndex: number, regenerateFn: () => Promise<string>): string {
    const id = generateJobId(pageIndex);

    const job: InternalBatchJob = {
      id,
      pageIndex,
      status: 'pending',
      progress: 0,
      regenerateFn,
      retryCount: 0,
    };

    this.jobs.set(id, job);
    this.jobOrder.push(id);

    return id;
  }

  /**
   * Adds multiple jobs to the queue
   *
   * @param jobs - Array of job configurations
   * @returns Array of generated job IDs
   */
  addJobs(
    jobs: Array<{ pageIndex: number; regenerateFn: () => Promise<string> }>
  ): string[] {
    return jobs.map(({ pageIndex, regenerateFn }) =>
      this.addJob(pageIndex, regenerateFn)
    );
  }

  /**
   * Retries a failed job
   *
   * @param jobId - The ID of the job to retry
   * @returns true if job was found and reset for retry, false otherwise
   */
  retryJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);

    if (!job || job.status !== 'failed') {
      return false;
    }

    // Reset job state
    job.status = 'pending';
    job.progress = 0;
    job.error = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.retryCount++;

    // Trigger processing if queue is running
    if (this._isRunning && !this._isPaused) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Retries all failed jobs
   *
   * @returns Number of jobs reset for retry
   */
  retryAllFailed(): number {
    let count = 0;

    for (const [jobId, job] of this.jobs) {
      if (job.status === 'failed') {
        if (this.retryJob(jobId)) {
          count++;
        }
      }
    }

    return count;
  }

  // ==========================================================================
  // PUBLIC METHODS - Queue Control
  // ==========================================================================

  /**
   * Starts processing the queue
   */
  start(): void {
    if (this._isRunning) {
      return;
    }

    this._isRunning = true;
    this._isPaused = false;
    this.processQueue();
  }

  /**
   * Pauses queue processing
   * Currently running jobs will complete, but no new jobs will start
   */
  pause(): void {
    if (!this._isRunning) {
      return;
    }

    this._isPaused = true;
  }

  /**
   * Resumes queue processing after a pause
   */
  resume(): void {
    if (!this._isRunning || !this._isPaused) {
      return;
    }

    this._isPaused = false;
    this.processQueue();
  }

  /**
   * Cancels the entire queue
   * Running jobs will complete, but pending jobs are marked as cancelled
   */
  cancel(): void {
    this._isRunning = false;
    this._isPaused = false;

    // Mark all pending jobs as failed with cancellation message
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        job.status = 'failed';
        job.error = 'Cancelled by user';
        job.completedAt = Date.now();
      }
    }
  }

  /**
   * Cancels a specific job
   *
   * @param jobId - The ID of the job to cancel
   * @returns true if job was found and cancelled, false otherwise
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);

    if (!job) {
      return false;
    }

    // Can only cancel pending jobs (running jobs will complete)
    if (job.status !== 'pending') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = Date.now();

    return true;
  }

  /**
   * Clears all jobs from the queue
   * Only works when queue is not running
   */
  clear(): void {
    if (this._isRunning) {
      return;
    }

    this.jobs.clear();
    this.jobOrder = [];
  }

  // ==========================================================================
  // PUBLIC METHODS - Status and Progress
  // ==========================================================================

  /**
   * Gets all jobs in the queue
   *
   * @returns Array of jobs in insertion order (without internal properties)
   */
  getJobs(): BatchJob[] {
    return this.jobOrder.map((id) => {
      const job = this.jobs.get(id)!;
      // Return public properties only
      return {
        id: job.id,
        pageIndex: job.pageIndex,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };
    });
  }

  /**
   * Gets a specific job by ID
   *
   * @param jobId - The job ID to look up
   * @returns The job if found, undefined otherwise
   */
  getJob(jobId: string): BatchJob | undefined {
    const job = this.jobs.get(jobId);

    if (!job) {
      return undefined;
    }

    // Return public properties only
    return {
      id: job.id,
      pageIndex: job.pageIndex,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Gets overall queue progress
   *
   * @returns Progress information
   */
  getProgress(): BatchQueueProgress {
    const total = this.jobs.size;

    if (total === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    let completed = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'completed' || job.status === 'failed') {
        completed++;
      }
    }

    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }

  /**
   * Checks if the queue is currently running
   *
   * @returns true if running, false otherwise
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Checks if the queue is paused
   *
   * @returns true if paused, false otherwise
   */
  isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Checks if all jobs are complete (success or failure)
   *
   * @returns true if all jobs are complete, false otherwise
   */
  isComplete(): boolean {
    if (this.jobs.size === 0) {
      return true;
    }

    for (const job of this.jobs.values()) {
      if (job.status === 'pending' || job.status === 'running') {
        return false;
      }
    }

    return true;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Main processing loop - starts eligible jobs
   */
  private processQueue(): void {
    // Prevent concurrent processing loops
    if (this.isProcessing || this._isPaused || !this._isRunning) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get current running count
      const runningCount = this.getRunningCount();

      // Check how many new jobs we can start
      const availableSlots = this.maxConcurrent - runningCount;

      if (availableSlots <= 0) {
        return;
      }

      // Get pending jobs in order
      const pendingJobs = this.getPendingJobs();

      // Start jobs up to the limit
      const toStart = Math.min(availableSlots, pendingJobs.length);

      for (let i = 0; i < toStart; i++) {
        this.executeJob(pendingJobs[i]);
      }

      // Check if queue is complete
      if (this.isComplete()) {
        this._isRunning = false;

        // Invoke completion callback
        if (this.options.onQueueComplete) {
          try {
            this.options.onQueueComplete(this.getJobs());
          } catch (e) {
            console.error('[BatchQueue] onQueueComplete callback error:', e);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executes a single job
   */
  private async executeJob(job: InternalBatchJob): Promise<void> {
    // Update status
    job.status = 'running';
    job.progress = 0;
    job.startedAt = Date.now();

    // Invoke start callback
    if (this.options.onJobStart) {
      try {
        this.options.onJobStart(this.getJob(job.id)!);
      } catch (e) {
        console.error('[BatchQueue] onJobStart callback error:', e);
      }
    }

    try {
      // Execute the regeneration function
      const result = await job.regenerateFn();

      // Mark completed
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completedAt = Date.now();

      // Invoke completion callback
      if (this.options.onJobComplete) {
        try {
          this.options.onJobComplete(this.getJob(job.id)!);
        } catch (e) {
          console.error('[BatchQueue] onJobComplete callback error:', e);
        }
      }
    } catch (error) {
      // Check if we should retry
      if (this.maxRetries > 0 && job.retryCount < this.maxRetries) {
        // Reset for retry
        job.status = 'pending';
        job.progress = 0;
        job.startedAt = undefined;
        job.retryCount++;
      } else {
        // Mark failed
        job.status = 'failed';
        job.progress = 0;
        job.error =
          error instanceof Error ? error.message : 'Unknown error occurred';
        job.completedAt = Date.now();

        // Invoke error callback
        if (this.options.onJobError) {
          try {
            const err =
              error instanceof Error ? error : new Error(String(error));
            this.options.onJobError(this.getJob(job.id)!, err);
          } catch (e) {
            console.error('[BatchQueue] onJobError callback error:', e);
          }
        }
      }
    } finally {
      // Update progress
      if (this.options.onProgress) {
        const progress = this.getProgress();
        try {
          this.options.onProgress(progress.completed, progress.total);
        } catch (e) {
          console.error('[BatchQueue] onProgress callback error:', e);
        }
      }

      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Gets the count of currently running jobs
   */
  private getRunningCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'running') {
        count++;
      }
    }
    return count;
  }

  /**
   * Gets pending jobs in insertion order
   */
  private getPendingJobs(): InternalBatchJob[] {
    const pending: InternalBatchJob[] = [];

    for (const id of this.jobOrder) {
      const job = this.jobs.get(id);
      if (job && job.status === 'pending') {
        pending.push(job);
      }
    }

    return pending;
  }
}

// ============================================================================
// REACT HOOK WRAPPER
// ============================================================================

/**
 * React hook for using BatchQueue with automatic state updates
 *
 * @param options - Optional configuration options (partial)
 * @returns Queue instance and reactive state
 *
 * @example
 * ```typescript
 * function BatchRegenerationPanel() {
 *   const {
 *     jobs,
 *     progress,
 *     isRunning,
 *     isPaused,
 *     addJobs,
 *     start,
 *     pause,
 *     resume,
 *     cancel,
 *   } = useBatchQueue({
 *     maxConcurrent: 2,
 *     onQueueComplete: (jobs) => toast.success('Batch complete!'),
 *   });
 *
 *   const handleStartBatch = () => {
 *     addJobs(selectedPages.map(pageIndex => ({
 *       pageIndex,
 *       regenerateFn: () => regeneratePage(pageIndex),
 *     })));
 *     start();
 *   };
 *
 *   return (
 *     <div>
 *       <ProgressBar value={progress.percentage} />
 *       <p>{progress.completed} / {progress.total} completed</p>
 *
 *       {jobs.map(job => (
 *         <JobStatus key={job.id} job={job} />
 *       ))}
 *
 *       <button onClick={handleStartBatch}>Start Batch</button>
 *       {isRunning && !isPaused && <button onClick={pause}>Pause</button>}
 *       {isPaused && <button onClick={resume}>Resume</button>}
 *       {isRunning && <button onClick={cancel}>Cancel</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBatchQueue(options?: Partial<BatchQueueOptions>): {
  /** The underlying BatchQueue instance */
  queue: BatchQueue;
  /** Current jobs in the queue (reactive) */
  jobs: BatchJob[];
  /** Overall progress (reactive) */
  progress: BatchQueueProgress;
  /** Whether the queue is running (reactive) */
  isRunning: boolean;
  /** Whether the queue is paused (reactive) */
  isPaused: boolean;
  /** Add jobs to the queue */
  addJobs: (
    jobs: Array<{ pageIndex: number; regenerateFn: () => Promise<string> }>
  ) => string[];
  /** Add a single job to the queue */
  addJob: (pageIndex: number, regenerateFn: () => Promise<string>) => string;
  /** Start processing the queue */
  start: () => void;
  /** Pause the queue */
  pause: () => void;
  /** Resume the queue */
  resume: () => void;
  /** Cancel the entire queue */
  cancel: () => void;
  /** Cancel a specific job */
  cancelJob: (jobId: string) => boolean;
  /** Retry a failed job */
  retryJob: (jobId: string) => boolean;
  /** Retry all failed jobs */
  retryAllFailed: () => number;
  /** Clear all jobs */
  clear: () => void;
} {
  // State for reactive updates
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [progress, setProgress] = useState<BatchQueueProgress>({
    completed: 0,
    total: 0,
    percentage: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Create queue instance with merged options
  const queueRef = useRef<BatchQueue | null>(null);

  // Initialize queue on mount
  if (!queueRef.current) {
    const fullOptions: BatchQueueOptions = {
      maxConcurrent: options?.maxConcurrent ?? 2,
      maxRetries: options?.maxRetries,
      onJobStart: (job) => {
        setJobs((current) =>
          current.map((j) => (j.id === job.id ? job : j))
        );
        setIsRunning(true);
        options?.onJobStart?.(job);
      },
      onJobComplete: (job) => {
        setJobs((current) =>
          current.map((j) => (j.id === job.id ? job : j))
        );
        options?.onJobComplete?.(job);
      },
      onJobError: (job, error) => {
        setJobs((current) =>
          current.map((j) => (j.id === job.id ? job : j))
        );
        options?.onJobError?.(job, error);
      },
      onQueueComplete: (completedJobs) => {
        setIsRunning(false);
        setIsPaused(false);
        options?.onQueueComplete?.(completedJobs);
      },
      onProgress: (completed, total) => {
        setProgress({
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
        options?.onProgress?.(completed, total);
      },
    };

    queueRef.current = new BatchQueue(fullOptions);
  }

  const queue = queueRef.current;

  // Wrapped methods that update state
  const addJobs = useCallback(
    (
      newJobs: Array<{
        pageIndex: number;
        regenerateFn: () => Promise<string>;
      }>
    ): string[] => {
      const ids = queue.addJobs(newJobs);
      setJobs(queue.getJobs());
      setProgress(queue.getProgress());
      return ids;
    },
    [queue]
  );

  const addJob = useCallback(
    (pageIndex: number, regenerateFn: () => Promise<string>): string => {
      const id = queue.addJob(pageIndex, regenerateFn);
      setJobs(queue.getJobs());
      setProgress(queue.getProgress());
      return id;
    },
    [queue]
  );

  const start = useCallback(() => {
    queue.start();
    setIsRunning(queue.isRunning());
    setIsPaused(queue.isPaused());
  }, [queue]);

  const pause = useCallback(() => {
    queue.pause();
    setIsPaused(true);
  }, [queue]);

  const resume = useCallback(() => {
    queue.resume();
    setIsPaused(false);
  }, [queue]);

  const cancel = useCallback(() => {
    queue.cancel();
    setJobs(queue.getJobs());
    setProgress(queue.getProgress());
    setIsRunning(false);
    setIsPaused(false);
  }, [queue]);

  const cancelJob = useCallback(
    (jobId: string): boolean => {
      const result = queue.cancelJob(jobId);
      if (result) {
        setJobs(queue.getJobs());
        setProgress(queue.getProgress());
      }
      return result;
    },
    [queue]
  );

  const retryJob = useCallback(
    (jobId: string): boolean => {
      const result = queue.retryJob(jobId);
      if (result) {
        setJobs(queue.getJobs());
        setProgress(queue.getProgress());
      }
      return result;
    },
    [queue]
  );

  const retryAllFailed = useCallback((): number => {
    const count = queue.retryAllFailed();
    if (count > 0) {
      setJobs(queue.getJobs());
      setProgress(queue.getProgress());
    }
    return count;
  }, [queue]);

  const clear = useCallback(() => {
    queue.clear();
    setJobs([]);
    setProgress({ completed: 0, total: 0, percentage: 0 });
  }, [queue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueRef.current) {
        queueRef.current.cancel();
      }
    };
  }, []);

  return {
    queue,
    jobs,
    progress,
    isRunning,
    isPaused,
    addJobs,
    addJob,
    start,
    pause,
    resume,
    cancel,
    cancelJob,
    retryJob,
    retryAllFailed,
    clear,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BatchQueue;
