/**
 * Common metrics calculation
 */
function calculateMetrics(steps) {
  const faults = steps.filter((step) => step.fault).length;
  const hits = steps.length - faults;
  const faultRate = steps.length ? faults / steps.length : 0;
  const hitRate = steps.length ? hits / steps.length : 0;
  return { steps, faults, hits, faultRate, hitRate };
}

/**
 * First-In, First-Out (FIFO) Page Replacement Algorithm
 */
export function runFIFO(referenceString, frameCount) {
  const frames = []; // Array of page numbers
  const steps = [];
  const queue = []; // Queue to track arrival order

  for (const page of referenceString) {
    let fault = false;
    let replaced = null;

    if (!frames.includes(page)) {
      fault = true;
      if (frames.length < frameCount) {
        frames.push(page);
        queue.push(page);
      } else {
        // Replace oldest
        replaced = queue.shift();
        const index = frames.indexOf(replaced);
        frames[index] = page;
        queue.push(page);
      }
    }

    // copy of frames, fill rest with null
    const stepFrames = [...frames];
    while (stepFrames.length < frameCount) {
      stepFrames.push(null);
    }

    steps.push({
      page,
      frames: stepFrames,
      fault,
      replaced,
    });
  }

  return calculateMetrics(steps);
}

/**
 * Least Recently Used (LRU) Page Replacement Algorithm
 */
export function runLRU(referenceString, frameCount) {
  const frames = [];
  const steps = [];
  const recent = []; // Track most recently used (push to back, remove from front)

  for (const page of referenceString) {
    let fault = false;
    let replaced = null;

    if (!frames.includes(page)) {
      fault = true;
      if (frames.length < frameCount) {
        frames.push(page);
        recent.push(page);
      } else {
        // Replace least recently used
        replaced = recent.shift();
        const index = frames.indexOf(replaced);
        frames[index] = page;
        recent.push(page);
      }
    } else {
      // It's a hit, update recent
      const indexObj = recent.indexOf(page);
      if (indexObj !== -1) recent.splice(indexObj, 1);
      recent.push(page);
    }

    const stepFrames = [...frames];
    while (stepFrames.length < frameCount) {
      stepFrames.push(null);
    }

    steps.push({
      page,
      frames: stepFrames,
      fault,
      replaced,
    });
  }

  return calculateMetrics(steps);
}

/**
 * Optimal Page Replacement Algorithm
 */
export function runOptimal(referenceString, frameCount) {
  const frames = [];
  const steps = [];

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    let fault = false;
    let replaced = null;

    if (!frames.includes(page)) {
      fault = true;
      if (frames.length < frameCount) {
        frames.push(page);
      } else {
        // Find page to replace: one that will not be used for longest time
        let farthest = -1;
        let replaceIndex = -1;

        for (let j = 0; j < frames.length; j++) {
          const nextUse = referenceString.indexOf(frames[j], i + 1);
          if (nextUse === -1) {
            // Page is never used again, so it's the perfect candidate
            replaceIndex = j;
            break;
          } else if (nextUse > farthest) {
            farthest = nextUse;
            replaceIndex = j;
          }
        }

        replaced = frames[replaceIndex];
        frames[replaceIndex] = page;
      }
    }

    const stepFrames = [...frames];
    while (stepFrames.length < frameCount) {
      stepFrames.push(null);
    }

    steps.push({
      page,
      frames: stepFrames,
      fault,
      replaced,
    });
  }

  return calculateMetrics(steps);
}
