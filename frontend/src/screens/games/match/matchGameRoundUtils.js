let globalStagePoolId = null;
let globalStagePool = [];
let globalStagePoolIndex = 0;

export const getMatchStagePoolId = (targetSet, stageWordIds) => [
  targetSet.map(h => h.id).sort((a, b) => a - b).join(','),
  [...stageWordIds].sort((a, b) => a - b).join(','),
].join('|');

export const shufflePairs = (pairs) => [...pairs].sort(() => Math.random() - 0.5);

export const moveRecentPairsToBack = (pairs, recentIds) => {
  if (!recentIds || recentIds.size === 0) return pairs;
  return [
    ...pairs.filter(p => !recentIds.has(p.pairId)),
    ...pairs.filter(p => recentIds.has(p.pairId)),
  ];
};

export const takeMatchStageRoundPool = ({
  pairsPerRound,
  pool,
  stageWordIds,
  targetSet,
}) => {
  const currentIds = getMatchStagePoolId(targetSet, stageWordIds);

  if (globalStagePoolId !== currentIds || globalStagePool.length === 0) {
    globalStagePoolId = currentIds;
    globalStagePool = pool;
    globalStagePoolIndex = 0;
  }

  const desiredPairs = Math.min(pairsPerRound, globalStagePool.length || pool.length);
  const remainingPairs = globalStagePool.length - globalStagePoolIndex;

  if (remainingPairs < desiredPairs) {
    const recentIds = new Set(
      globalStagePool
        .slice(Math.max(0, globalStagePoolIndex - pairsPerRound), globalStagePoolIndex)
        .map(pair => pair.pairId)
    );
    globalStagePoolId = currentIds;
    globalStagePool = moveRecentPairsToBack(pool, recentIds);
    globalStagePoolIndex = 0;
  }

  const slice = globalStagePool.slice(globalStagePoolIndex, globalStagePoolIndex + pairsPerRound);
  globalStagePoolIndex += slice.length;
  return slice;
};

export const takeMatchStageRetryRound = (pairsPerRound) => {
  if (globalStagePoolIndex >= globalStagePool.length) {
    globalStagePool = shufflePairs(globalStagePool);
    globalStagePoolIndex = 0;
  }

  if (globalStagePool.length === 0) return null;

  let slice = globalStagePool.slice(globalStagePoolIndex, globalStagePoolIndex + pairsPerRound);
  if (slice.length < pairsPerRound) {
    const recentIds = new Set(slice.map(pair => pair.pairId));
    globalStagePool = moveRecentPairsToBack(shufflePairs(globalStagePool), recentIds);
    globalStagePoolIndex = Math.min(pairsPerRound, globalStagePool.length);
    slice = globalStagePool.slice(0, globalStagePoolIndex);
  } else {
    globalStagePoolIndex += pairsPerRound;
  }

  return slice;
};

export const getMatchNextRoundPlan = ({
  contentPool,
  currentRound,
  pairPool,
  pairsPerRound,
  poolIndex,
}) => {
  const nextRound = currentRound + 1;
  const nextIdx = poolIndex + pairsPerRound;

  if (pairPool.length - nextIdx < Math.min(pairsPerRound, pairPool.length)) {
    if (contentPool != null) return { isAllClear: true };

    const currentIds = new Set(
      pairPool
        .slice(poolIndex, poolIndex + pairsPerRound)
        .map(pair => pair.pairId)
    );
    const workPool = moveRecentPairsToBack(shufflePairs(pairPool), currentIds);
    return {
      isAllClear: false,
      nextRound,
      poolIndex: 0,
      slice: workPool.slice(0, pairsPerRound),
      totalRoundsDelta: Math.ceil(workPool.length / pairsPerRound),
      workPool,
    };
  }

  return {
    isAllClear: false,
    nextRound,
    poolIndex: nextIdx,
    slice: pairPool.slice(nextIdx, nextIdx + pairsPerRound),
    totalRoundsDelta: 0,
    workPool: pairPool,
  };
};

export const getMatchRetryRoundPlan = ({
  contentPool,
  pairPool,
  pairsPerRound,
  poolIndex,
}) => {
  if (contentPool != null) {
    const slice = takeMatchStageRetryRound(pairsPerRound);
    return slice ? { shouldRestart: false, slice } : { shouldRestart: true, slice: null };
  }

  const nextIdx = poolIndex + pairsPerRound;
  if (nextIdx >= pairPool.length) {
    const workPool = shufflePairs(pairPool);
    return {
      poolIndex: 0,
      shouldRestart: false,
      slice: workPool.slice(0, pairsPerRound),
      workPool,
    };
  }

  return {
    poolIndex: nextIdx,
    shouldRestart: false,
    slice: pairPool.slice(nextIdx, nextIdx + pairsPerRound),
    workPool: pairPool,
  };
};
