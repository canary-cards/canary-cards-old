import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function FAQ() {
  const faqs = [
    {
      question: "What does the postcard look like?",
      answer: "A sturdy 5x7 postcard on glossy stock. Real words, real ink, mailed to your representative."
    },
    {
      question: "Is it really handwritten?",
      answer: "Yes. The robots use real pens, with natural variations in letter shape and spacing — indistinguishable from human handwriting"
    },
    {
      question: "Do postcards actually matter?",
      answer: "Research shows postcards bypass long mail screening, arrive faster than letters, and get prioritized over mass emails. Congressional staff pay attention to constituent mail."
    },
    {
      question: "How do the robots work?",
      answer: "We connect your message to robots that hold real pens and write each card uniquely. Then we drop it in the mail."
    },
    {
      question: "Will I know when my card is sent?",
      answer: "Yes. You'll get a confirmation email once your card has been mailed."
    },
    {
      question: "Is this only for one political side?",
      answer: "No. Canary is proudly non-partisan. It works for anyone who wants their voice heard."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <Card className="card-warm">
            <CardContent className="p-8 text-center">
              <h1 className="display-title">FAQ</h1>
            </CardContent>
          </Card>

          {/* FAQ Items */}
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="card-warm">
                <CardContent className="p-6 space-y-3">
                  <h2 className="eyebrow normal-case text-primary">
                    {faq.question}
                  </h2>
                  <p className="body-text">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}