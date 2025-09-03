import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Share() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') || 'direct';
  const order = searchParams.get('order') || '';
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', fontSize: '32px', marginBottom: '20px' }}>
        Share Page Working! 🎉
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        Ref: {ref}<br />
        Order: {order}
      </p>
      <p style={{ fontSize: '16px', marginTop: '20px' }}>
        The share page is now loading correctly. This proves the routing works.
      </p>
    </div>
  );
}