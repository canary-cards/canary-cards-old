import React from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const EmailTestButton = () => {
  const testEmailSend = async () => {
    try {
      const testData = {
        userInfo: {
          fullName: "Test User",
          email: "your-test@email.com", // Change this to your email
          streetAddress: "123 Main St",
          city: "Sacramento",
          state: "CA",
          zipCode: "95814"
        },
        representative: {
          name: "Doris Matsui",
          state: "CA",
          party: "Democrat",
          type: "representative"
        },
        senators: [
          {"name": "Alex Padilla", "state": "CA", "party": "Democrat"},
          {"name": "Laphonza Butler", "state": "CA", "party": "Democrat"}
        ],
        sendOption: "triple",
        orderResults: [
          {"type": "representative", "recipient": "Doris Matsui", "orderId": "TEST-001", "status": "success"},
          {"type": "senator", "recipient": "Alex Padilla", "orderId": "TEST-002", "status": "success"},
          {"type": "senator", "recipient": "Laphonza Butler", "orderId": "TEST-003", "status": "success"}
        ]
      };

      console.log('Sending test email with data:', testData);
      
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: testData
      });

      if (error) {
        console.error('Email test error:', error);
        toast.error(`Email test failed: ${error.message}`);
      } else {
        console.log('Email test success:', data);
        toast.success('Test email sent successfully!');
      }
    } catch (error) {
      console.error('Email test exception:', error);
      toast.error('Failed to send test email');
    }
  };

  return (
    <Button 
      onClick={testEmailSend}
      variant="outline"
      className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
    >
      🧪 Send Test Email
    </Button>
  );
};