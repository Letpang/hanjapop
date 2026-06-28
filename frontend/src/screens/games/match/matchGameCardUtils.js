export const buildPairPool = (items) => {
  const pairs = [];

  items.forEach((h) => {
    const words = (h.words || [])
      .filter(w => w.word && w.meaning && w.reading)
      .map(w => w.word);

    pairs.push({
      pairId: `h_${h.id}`,
      a: h.hanja,
      b: `${h.meaning} ${h.sound}`,
      typeA: 'hanja',
      typeB: 'meaning',
      hanjaId: h.id,
      words,
    });
  });

  const seenWords = new Set();
  items.forEach((h) => {
    (h.words || []).forEach((w) => {
      if (!w.word || !w.meaning || seenWords.has(w.word)) return;

      seenWords.add(w.word);
      pairs.push({
        pairId: `w_${w.word}`,
        a: w.word,
        b: w.meaning,
        typeA: 'word',
        typeB: 'meaning',
        hanjaId: h.id,
        wordId: w.id ?? null,
        words: [w.word],
      });
    });
  });

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs;
};

export const createRoundCards = (pairs) => {
  const cards = [];

  pairs.forEach((pair, index) => {
    cards.push({
      uniqueId: `a-${pair.pairId}-${index}-${Math.random()}`,
      pairId: pair.pairId,
      content: pair.a,
      type: pair.typeA,
      isFlipped: false,
      isMatched: false,
      hanjaId: pair.hanjaId,
      wordId: pair.wordId ?? null,
    });
    cards.push({
      uniqueId: `b-${pair.pairId}-${index}-${Math.random()}`,
      pairId: pair.pairId,
      content: pair.b,
      type: pair.typeB,
      isFlipped: false,
      isMatched: false,
      hanjaId: pair.hanjaId,
      wordId: pair.wordId ?? null,
    });
  });

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
};
