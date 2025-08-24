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
                  <div className="eyebrow normal-case">You write (or choose a template).</div>
                  <p className="body-text">
                    Type your message, or let our AI help draft a clear and persuasive note.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="eyebrow normal-case">We hand-write it for you.</div>
                  <p className="body-text">
                    Our robots use real blue ballpoint pens on high-quality cardstock. Each postcard is written in a handwriting style that looks like it came from an actual person—not a printer. Small variations in pressure, spacing, and letter forms make every card unique.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <div className="eyebrow normal-case">We mail it directly.</div>
                  <p className="body-text">
                    Your card skips the long screening lines that typed letters face and lands faster on your representative's desk.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Postcards Matter Section */}
          <Card className="card-warm">
            <CardContent className="p-8 space-y-6">
              <h2 className="subtitle text-center">Why postcards matter</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="eyebrow normal-case">Read first.</div>
                  <p className="body-text">
                    Handwritten mail consistently gets opened and read before email or petitions.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="eyebrow normal-case">Constituents count more.</div>
                  <p className="body-text">
                    Offices prioritize physical mail from verified constituents over mass campaigns.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="eyebrow normal-case">Small effort, big impact.</div>
                  <p className="body-text">
                    Just a few handwritten notes on one issue can be enough to raise its profile in congressional offices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Canary is Different Section */}
          <Card className="card-warm">
            <CardContent className="p-8 space-y-6">
              <h2 className="subtitle text-center">Why Canary is different</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="eyebrow normal-case">Authentic handwriting:</div>
                  <p className="body-text">
                    Robots with pens—not fonts—so your card looks real.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="eyebrow normal-case">No friction:</div>
                  <p className="body-text">
                    We handle printing, handwriting, and mailing.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="eyebrow normal-case">Proof of impact:</div>
                  <p className="body-text">
                    You'll get confirmations when your postcard is in the mail, and you can see your part in the collective volume.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Promise Section */}
          <Card className="card-warm">
            <CardContent className="p-8 space-y-4">
              <h2 className="subtitle text-center">Our promise</h2>
              <div className="space-y-4">
                <p className="body-text">
                  You don't need to be an activist to matter. Canary Cards lowers the barrier, removes the busywork, and reassures you that your voice is reaching the right place.
                </p>
                <p className="body-text">
                  Your words, in real ink, on a real postcard—delivered straight to the desk of the people elected to represent you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}