/**
 * A rate-limited task queue that limits concurrent async operations.
 * Ensures at most `concurrency` tasks run at the same time,
 * while preserving the original order of results.
 *
 * @param {number} concurrency - Maximum number of concurrent tasks
 * @returns {Function} process tasks with progress and completion callbacks
 */
export function createRateLimitedQueue(concurrency = 4) {
  /**
   * @param {Array} tasks - Array of { id, fn, data, index }
   * @param {Function} onProgress - Called per-file: (id, done, total)
   * @param {Function} onComplete - Called when all tasks finish: (results, errors)
   * @returns {Promise<{results: Array, errors: Array}>} resolves with ordered results
   */
  return function processTasks(tasks, onProgress, onComplete) {
    return new Promise((resolve) => {
      if (tasks.length === 0) {
        onComplete?.([], []);
        resolve({ results: [], errors: [] });
        return;
      }

      const results = new Array(tasks.length);
      const errors = new Array(tasks.length);
      let running = 0;
      let completed = 0;
      let nextIndex = 0;

      const runNext = () => {
        // Launch tasks up to the concurrency limit
        while (running < concurrency && nextIndex < tasks.length) {
          const { id, fn, data, index } = tasks[nextIndex];
          nextIndex++;
          running++;

          Promise.resolve()
            .then(() => fn(data))
            .then((result) => {
              results[index] = result;
            })
            .catch((err) => {
              errors[index] = err;
            })
            .finally(() => {
              running--;
              completed++;

              // Notify progress for this specific file
              onProgress?.(id, completed, tasks.length);

              if (completed === tasks.length) {
                onComplete?.(results, errors);
                resolve({ results, errors });
              } else {
                // Keep the queue saturated as tasks finish
                runNext();
              }
            });
        }
      };

      runNext();
    });
  };
}

/**
 * Process files in batches to limit memory usage.
 * Processes items in chunks and allows per-item completion callbacks.
 *
 * @param {Array} items - Array of items to process
 * @param {number} batchSize - Number of items per batch
 * @param {Function} processor - Async function (item, index) => result
 * @param {Function} onEachComplete - Called after each item: (index, result)
 */
export async function processInBatches(
  items,
  batchSize = 8,
  processor,
  onEachComplete,
) {
  const results = new Array(items.length);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item, batchIdx) => {
      const index = i + batchIdx;
      const result = await processor(item, index);
      results[index] = result;
      onEachComplete?.(index, result);
      return result;
    });

    await Promise.all(batchPromises);
  }

  return results;
}
