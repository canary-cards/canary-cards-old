import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <Card className="card-warm">
            <CardContent className="p-8 text-center">
              <h1 className="display-title">Contact Us</h1>
            </CardContent>
          </Card>

          {/* Contact Content */}
          <Card className="card-warm">
            <CardContent className="p-8 space-y-4">
              <h2 className="eyebrow text-secondary">Get in touch</h2>
              <p className="body-text">
                We'd love to hear from you.
              </p>
              <p className="body-text">
                Questions, ideas, or feedback? Reach out anytime.
              </p>
              <p className="body-text">
                We read every message, even if it takes a couple of days to reply.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="body-text text-center">
                  <strong>📧 <a href="mailto:hello@canary.cards" className="text-primary underline decoration-accent hover:no-underline">hello@canary.cards</a></strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}