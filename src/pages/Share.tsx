import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Share() {
  const [searchParams] = useSearchParams();
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false);

  const ref = searchParams.get('ref') || 'direct';
  const orderNumber = searchParams.get('order') || '';

  // Check if user came from email or delivery
  const isFromEmail = ref === 'email' || ref === 'delivery';

  const shareContent = {
    title: 'Canary Cards - Real Postcards to Representatives',
    text: 'I just sent a real postcard with Canary Cards! Friends listen to friends. Show them how easy it is to send a real postcard.',
    url: 'https://canary.cards'
  };

  const handleNativeShare = async () => {
    console.log('Attempting native share with ref:', ref);
    if (navigator.share) {
      try {
        await navigator.share(shareContent);
        console.log('Shared successfully via native share');
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      console.log('Native share not available');
    }
  };

  useEffect(() => {
    // Check if native sharing is available (mobile devices)
    const isNativeAvailable = 'share' in navigator;
    setIsNativeShareAvailable(isNativeAvailable);
    
    console.log('Share page loaded with ref:', ref, 'isNativeAvailable:', isNativeAvailable);
  }, []);

  const handleScreenTap = () => {
    if (isFromEmail && isNativeShareAvailable) {
      handleNativeShare();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FEF4E9' }}>
      {/* Simple header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
        <h2>Canary Cards</h2>
      </div>
      
      {/* Full-screen tap area for email users */}
      {isFromEmail && isNativeShareAvailable ? (
        <div 
          onClick={handleScreenTap}
          style={{
            position: 'fixed',
            top: '80px',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: '#FEF4E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: '400px', padding: '32px' }}>
            <div style={{ fontSize: '80px', marginBottom: '32px' }}>📮</div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2F4156', marginBottom: '24px' }}>
              Ready to Share!
            </h1>
            <p style={{ fontSize: '20px', color: '#666', marginBottom: '32px', lineHeight: '1.5' }}>
              Tap anywhere on this screen to share Canary Cards with your friends
            </p>
            <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'bounce 2s infinite' }}>👆</div>
            <div style={{ fontSize: '18px', color: '#2F4156', fontWeight: '600' }}>
              Tap anywhere to share
            </div>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '24px' }}>
              This will open your device's share menu with all your apps
            </p>
          </div>
        </div>
      ) : (
        // Regular share page content for non-email users
        <div style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2F4156', marginBottom: '16px' }}>
            Share Canary Cards
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
            Help others contact their representatives easily
          </p>
          
          <button
            onClick={handleNativeShare}
            style={{
              backgroundColor: '#2F4156',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            📱 Share with Friends
          </button>
          
          <div style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
            Ref: {ref} | Order: {orderNumber}
          </div>
        </div>
      )}
    </div>
  );
}