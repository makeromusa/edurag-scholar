"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Brain, RotateCcw, CheckCircle, AlertTriangle, ArrowRight, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Flashcard {
  _id: string;
  unit_code: string;
  topic: string;
  question: string;
  answer: string;
  exam_trap: string;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
}

interface FlashcardModalProps {
  unitCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  unitCode,
  isOpen,
  onClose,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch due cards on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchDue = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
        const res = await fetch(`${apiUrl}/api/flashcards/due/${unitCode}`);
        const data = await res.json();
        setCards(data.due_cards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
      } catch (e) {
        console.error("Error loading flashcards", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDue();
  }, [isOpen, unitCode]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      const res = await fetch(`${apiUrl}/api/flashcards/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_code: unitCode, topic: genTopic, card_count: 5 }),
      });
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setGenTopic("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!currentCard) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
      await fetch(`${apiUrl}/api/flashcards/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: currentCard._id, quality }),
      });

      // Move to next card
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Finished deck
        setCards([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0c111d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Spaced Repetition Flashcards • {unitCode}
              </h2>
              <p className="text-[11px] text-slate-400">
                SuperMemo-2 (SM-2) memory retention engine & Chiromo exam traps
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Generate Deck Quick Form */}
        <form onSubmit={handleGenerateCards} className="flex gap-2 border-b border-slate-800/80 bg-[#090d16] px-6 py-3">
          <input
            type="text"
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            placeholder={`Generate new cards (e.g. 'Virtual Memory Paging' or 'OSPF Routing')...`}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!genTopic.trim() || isGenerating}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGenerating ? "Synthesizing..." : "Generate 5 Cards"}</span>
          </button>
        </form>

        {/* Main Card Arena */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          {isLoading ? (
            <div className="text-xs text-slate-400 animate-pulse">Loading revision cards from MongoDB...</div>
          ) : currentCard ? (
            <div className="flex w-full flex-col items-center">
              {/* Progress counter */}
              <div className="mb-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Card {currentIndex + 1} of {cards.length} • Topic: {currentCard.topic}
              </div>

              {/* The Interactive Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer group relative flex min-h-[220px] w-full flex-col justify-between rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-[#0e1422] p-6 shadow-xl transition-all hover:border-amber-500/50"
              >
                <div>
                  <span className="inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                    {isFlipped ? "Examiner's Answer & Trap" : "Chiromo Exam Question"}
                  </span>
                  <div className="mt-4 text-sm font-medium leading-relaxed text-slate-100">
                    {isFlipped ? (
                      <div className="space-y-3">
                        <div className="text-slate-200">{currentCard.answer}</div>
                        {currentCard.exam_trap && (
                          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
                            <span className="font-bold flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> UoN Exam Trap:
                            </span>
                            <span className="mt-0.5 block">{currentCard.exam_trap}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      currentCard.question
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Click card to flip
                  </span>
                  <span>Ease Factor: {currentCard.ease_factor || 2.5}</span>
                </div>
              </div>

              {/* SM-2 Recall Rating Buttons (Shown when flipped) */}
              {isFlipped && (
                <div className="mt-6 flex w-full flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    How well did you recall this concept?
                  </span>
                  <div className="grid w-full grid-cols-4 gap-2">
                    <button
                      onClick={() => handleReview(1)}
                      className="rounded-lg border border-rose-800/60 bg-rose-950/30 py-2 px-3 text-xs font-semibold text-rose-300 hover:bg-rose-900/50"
                    >
                      Blackout (1/5)
                      <span className="block text-[9px] font-normal text-slate-400">Logs Weakness</span>
                    </button>
                    <button
                      onClick={() => handleReview(3)}
                      className="rounded-lg border border-amber-800/60 bg-amber-950/30 py-2 px-3 text-xs font-semibold text-amber-300 hover:bg-amber-900/50"
                    >
                      Hard (3/5)
                      <span className="block text-[9px] font-normal text-slate-400">1 day review</span>
                    </button>
                    <button
                      onClick={() => handleReview(4)}
                      className="rounded-lg border border-blue-800/60 bg-blue-950/30 py-2 px-3 text-xs font-semibold text-blue-300 hover:bg-blue-900/50"
                    >
                      Good (4/5)
                      <span className="block text-[9px] font-normal text-slate-400">6 days review</span>
                    </button>
                    <button
                      onClick={() => handleReview(5)}
                      className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 py-2 px-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50"
                    >
                      Perfect (5/5)
                      <span className="block text-[9px] font-normal text-slate-400">Mastered</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-2 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-200">All Caught Up for {unitCode}!</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                You have reviewed all cards due for today. Type a topic above to generate a new revision deck.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
