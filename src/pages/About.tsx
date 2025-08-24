import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <Card className="card-warm">
            <CardContent className="p-8 text-center space-y-4">
              <h1 className="display-title">About Canary Cards</h1>
              <p className="subtitle text-muted-foreground">A simple way to be heard</p>
              <p className="body-text max-w-3xl mx-auto">
                Politics can feel overwhelming. Canary Cards exists to give ordinary people a clear, fast way to make a real impact: sending a handwritten postcard to your elected representative. No complicated forms, no activism guilt. Just a meaningful action you can complete in under two minutes.
              </p>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <Card className="card-warm">
            <CardContent className="p-8 space-y-6">
              <h2 className="subtitle text-center">How it works</h2>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="eyebrow">You write (or choose a template).</div>
                  <p className="body-text">
                    Type your message, or let our AI help draft a clear and persuasive note.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="eyebrow">We hand-write it for you.</div>
                  <p className="body-text">
                    Our robots use real blue ballpoint pens on high-quality cardstock. Each postcard is written in a handwriting style that looks like it came from an actual person—not a printer. Small variations in pressure, spacing, and letter forms make every card unique.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}