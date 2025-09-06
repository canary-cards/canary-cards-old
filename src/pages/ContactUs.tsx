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
              <p className="body-text">
                We'd love to hear from you.
              </p>
              <p className="body-text">
                Have a question, idea, or problem? Reach out anytime.
              </p>
              <p className="body-text">
                <strong>📧 hello@canary.cards</strong>
              </p>
              <p className="body-text">
                We read every message, even if it takes a couple of days to reply.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}