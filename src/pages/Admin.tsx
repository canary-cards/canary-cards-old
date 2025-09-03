import React from 'react';
import { SvgAssetManager } from '@/components/admin/SvgAssetManager';
import { Header } from '@/components/Header';

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage your SVG assets and application resources
          </p>
        </div>
        
        <SvgAssetManager />
      </div>
    </div>
  );
}