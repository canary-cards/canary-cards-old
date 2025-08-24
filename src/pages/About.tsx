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
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">About Canary Cards</h1>
            <p className="text-lg text-muted-foreground">
              Learn more about our mission and how we work
            </p>
          </div>

          {/* Content Card */}
          <Card className="card-warm">
            <CardContent className="p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">
                  Content will be added here shortly. This page will contain information about 
                  Canary Cards, our mission, and how we help citizens make their voices heard 
                  through handwritten postcards to representatives.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}