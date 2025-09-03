import React from 'react';

export default function Share() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'red', 
      color: 'white',
      padding: '40px',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <h1>SIMPLE SHARE PAGE WORKING!</h1>
      <p>If you see this red page, basic routing works.</p>
      <p>URL: {window.location.href}</p>
    </div>
  );
}