import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Shuffle, Settings2, Activity } from 'lucide-react';
import { runFIFO, runLRU, runOptimal } from './logic/algorithms';

// Utility to generate a random sequence for testing
function generateRandomSequence(length, maxPage) {
  return Array.from({ length }, () => Math.floor(Math.random() * maxPage));
}

const DEFAULT_SEQ = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

export default function App() {
  const [referenceString, setReferenceString] = useState(DEFAULT_SEQ.join(', '));
  const [frameCount, setFrameCount] = useState(3);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);

  // Parsing the input
  const sequence = useMemo(() => {
    return referenceString
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [referenceString]);

  // Compute all algorithms
  const fifoResult = useMemo(() => runFIFO(sequence, frameCount), [sequence, frameCount]);
  const lruResult = useMemo(() => runLRU(sequence, frameCount), [sequence, frameCount]);
  const optimalResult = useMemo(() => runOptimal(sequence, frameCount), [sequence, frameCount]);

  const totalSteps = sequence.length;

  // Playback logic
  useEffect(() => {
    let interval;
    if (isPlaying && currentStepIndex < totalSteps - 1) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, speedMs);
    } else if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, totalSteps, speedMs]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  };
  const handleStepForward = () => {
    if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(currentStepIndex + 1);
  };
  const handleStepBack = () => {
    if (currentStepIndex > -1) setCurrentStepIndex(currentStepIndex - 1);
  };
  const handleRandomize = () => {
    setReferenceString(generateRandomSequence(15, 10).join(', '));
    handleReset();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Page Replacement Simulator</h1>
        <p>Interactive Visualization of FIFO, LRU, and Optimal Algorithms</p>
      </header>

      {/* Settings Grid */}
      <div className="glass-panel controls-grid">
        <div className="control-group">
          <label>Reference String (comma separated)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              value={referenceString}
              onChange={(e) => {
                setReferenceString(e.target.value);
                handleReset();
              }}
              placeholder="e.g. 1, 2, 3, 4"
            />
            <button className="btn btn-secondary" onClick={handleRandomize} title="Random Sequence">
              <Shuffle size={18} />
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Number of Frames</label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="7"
              value={frameCount}
              onChange={(e) => {
                setFrameCount(parseInt(e.target.value, 10));
                handleReset();
              }}
              style={{ flex: 1 }}
            />
            <span className="slider-value">{frameCount}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls & Sequence Display */}
      <div className="glass-panel">
        <div className="history-strip">
          {sequence.map((page, idx) => (
            <div
              key={idx}
              className={`history-item ${idx === currentStepIndex ? 'active' : ''}`}
            >
              {page}
            </div>
          ))}
        </div>

        <div className="actions-row">
          <button className="btn btn-secondary" onClick={handleReset} disabled={currentStepIndex === -1}>
            <RotateCcw size={18} /> Reset
          </button>
          <button className="btn btn-secondary" onClick={handleStepBack} disabled={currentStepIndex === -1}>
            <SkipBack size={18} /> Prev
          </button>
          <button
            className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handlePlayPause}
            disabled={sequence.length === 0 || currentStepIndex >= totalSteps - 1}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-secondary" onClick={handleStepForward} disabled={currentStepIndex >= totalSteps - 1}>
            Next <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* Algorithms Visualizer */}
      <div className="algorithms-display">
        <AlgorithmVisualizer
          title="First-In, First-Out (FIFO)"
          result={fifoResult}
          stepIndex={currentStepIndex}
          frameCount={frameCount}
        />
        <AlgorithmVisualizer
          title="Least Recently Used (LRU)"
          result={lruResult}
          stepIndex={currentStepIndex}
          frameCount={frameCount}
        />
        <AlgorithmVisualizer
          title="Optimal (OPT)"
          result={optimalResult}
          stepIndex={currentStepIndex}
          frameCount={frameCount}
        />
      </div>
    </div>
  );
}

function AlgorithmVisualizer({ title, result, stepIndex, frameCount }) {
  const { steps, faults, hits, faultRate } = result;
  
  // Calculate running metrics leading up to current step
  const currentSteps = steps.slice(0, stepIndex + 1);
  const currentFaults = currentSteps.filter(s => s.fault).length;
  const currentHits = currentSteps.length - currentFaults;
  const currentFaultRate = currentSteps.length ? ((currentFaults / currentSteps.length) * 100).toFixed(1) : 0;

  // The step state to visualize
  const visibleStep = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;
  const emptyFrames = Array(frameCount).fill(null);
  const framesToRender = visibleStep ? visibleStep.frames : emptyFrames;

  return (
    <div className="glass-panel algorithm-row">
      <div className="algo-header">
        <h3 className="algo-title">{title}</h3>
        <div className="algo-metrics">
          <div className="metric-badge">
            <span className="metric-hits">Hits: {currentHits}</span>
          </div>
          <div className="metric-badge">
            <span className="metric-faults">Faults: {currentFaults}</span>
          </div>
          <div className="metric-badge">
            <Activity size={14} className={currentFaults > currentHits ? "metric-faults" : "metric-hits"}/>
            <span>Rate: {currentFaultRate}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="frames-container">
          {framesToRender.map((frame, idx) => {
            const isHitForThisFrame = visibleStep && !visibleStep.fault && frame === visibleStep.page;
            const isFaultForThisFrame = visibleStep && visibleStep.fault && frame === visibleStep.page;
            
            let frameClass = "page-frame ";
            if (frame !== null) frameClass += "filled ";
            if (isHitForThisFrame) frameClass += "hit ";
            if (isFaultForThisFrame) frameClass += "fault ";

            return (
              <div key={idx} className={frameClass}>
                {frame !== null ? frame : '-'}
              </div>
            );
          })}
        </div>

        {visibleStep && (
          <div className="incoming-page">
            Incoming: <span>{visibleStep.page}</span>
            {visibleStep.fault ? (
              <span className="metric-faults" style={{ fontSize: '0.9rem', marginLeft: '8px' }}>
                (Fault {visibleStep.replaced !== null ? ` - Replaced ${visibleStep.replaced}` : ''})
              </span>
            ) : (
              <span className="metric-hits" style={{ fontSize: '0.9rem', marginLeft: '8px' }}>(Hit)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
