import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="card-warm">
          <CardContent className="p-8 space-y-6">
            <h1 className="display-title text-center">About</h1>
            
            <div className="space-y-4 max-w-3xl mx-auto">
              <p className="body-text">
                We built Canary Cards because we were frustrated, too.
              </p>
              
              <p className="body-text">
                Buying postcards, finding stamps, handwriting a message, and hauling it to the post office — all that effort makes it easy to give up.
              </p>
              
              <p className="body-text">
                But postcards still matter. A real card lands on your representative's desk, where emails and petitions usually don't.
              </p>
              
              <p className="body-text">
                So we made the part that counts simple: in under two minutes, you write, and we handle the rest. Non-partisan, no extra steps — just your voice, delivered.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}