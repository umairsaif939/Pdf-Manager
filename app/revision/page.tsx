"use client";

import React, { useState } from "react";
import {
  Layers,
  FileText,
  Plus,
  RotateCw,
  Check,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const DEMO_NOTES = [
  {
    id: "note-1",
    docTitle: "Principles of Cognitive Neuroscience.pdf",
    page: 84,
    title: "Synaptic Plasticity & LTP",
    content:
      "Long-term potentiation (LTP) is a persistent strengthening of synapses based on recent patterns of activity. Mediated predominantly by NMDA and AMPA glutamate receptor trafficking.",
    date: "Today, 11:20 AM",
  },
  {
    id: "note-2",
    docTitle: "Bayesian Data Analysis.pdf",
    page: 122,
    title: "Conjugate Priors Definition",
    content:
      "A prior is conjugate to the likelihood function if the resulting posterior distribution belongs to the same probability distribution family as the prior belief.",
    date: "Yesterday",
  },
];

const DEMO_CARDS = [
  {
    id: "card-1",
    front: "What is the primary role of the hippocampus in memory consolidation?",
    back: "It temporarily stores declarative memories and coordinates their gradual transfer into neocortical circuits for long-term storage.",
    doc: "Principles of Cognitive Neuroscience.pdf",
    page: 88,
  },
  {
    id: "card-2",
    front: "What makes a Bayesian credible interval different from a frequentist confidence interval?",
    back: "A 95% Bayesian credible interval has a 95% probability of containing the true parameter value given the observed data and prior.",
    doc: "Bayesian Data Analysis.pdf",
    page: 130,
  },
];

export default function RevisionPage() {
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards">("flashcards");
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeCard = DEMO_CARDS[cardIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % DEMO_CARDS.length);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Revision & Flashcards"
        description="Review study notes, key terms, and active recall cards generated from your readings."
        action={
          <div className="flex items-center p-1 bg-surface rounded-control border border-line text-xs font-sans">
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "flashcards"
                  ? "bg-terracotta text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "notes"
                  ? "bg-terracotta text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Study Notes
            </button>
          </div>
        }
      />

      {activeTab === "flashcards" ? (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Card Review Counter */}
          <div className="flex items-center justify-between text-xs font-sans text-muted">
            <span>
              Card {cardIndex + 1} of {DEMO_CARDS.length}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {activeCard.doc} (Pg {activeCard.page})
            </span>
          </div>

          {/* Interactive Flashcard with Flip Animation */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[280px] p-8 bg-surface hover:bg-surface/90 border border-line rounded-card shadow-soft flex flex-col justify-between transition-all duration-200 select-none group"
          >
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="font-hand text-terracotta text-sm font-bold">
                {isFlipped ? "Answer / Solution" : "Question / Prompt"}
              </span>
              <span className="text-muted group-hover:text-ink flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Click to flip
              </span>
            </div>

            <div className="py-6 my-auto text-center">
              <p className="font-serif text-xl sm:text-2xl font-bold text-ink leading-relaxed">
                {isFlipped ? activeCard.back : activeCard.front}
              </p>
            </div>

            <div className="text-center text-[11px] font-sans text-muted">
              {isFlipped ? "Rate your recall below" : "Recall the answer, then click to reveal"}
            </div>
          </div>

          {/* Response Buttons */}
          {isFlipped ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleNextCard}
                className="flex-1 py-3 px-4 bg-danger/10 hover:bg-danger/20 text-danger rounded-control font-sans text-xs font-semibold flex items-center justify-center gap-2 border border-danger/30 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Again (Need Review)</span>
              </button>
              <button
                onClick={handleNextCard}
                className="flex-1 py-3 px-4 bg-success/10 hover:bg-success/20 text-success rounded-control font-sans text-xs font-semibold flex items-center justify-center gap-2 border border-success/30 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Good (Retained)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-3 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-semibold border border-line transition-colors flex items-center justify-center gap-2"
            >
              <span>Show Answer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Notes Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_NOTES.map((note) => (
            <div
              key={note.id}
              className="p-5 bg-surface border border-line rounded-card shadow-soft space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-2">
                  <span className="font-sans font-medium text-terracotta">
                    Page {note.page}
                  </span>
                  <span>{note.date}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink mb-1.5">
                  {note.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-line text-xs font-sans text-muted flex items-center justify-between">
                <span className="truncate max-w-[200px]">{note.docTitle}</span>
                <span className="text-terracotta font-medium hover:underline cursor-pointer">
                  Jump to Page →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
