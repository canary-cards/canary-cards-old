import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface OrderConfirmationEmailProps {
  userName: string
  representative: {
    name: string
    lastName: string
    state: string
    party: string
    type: string
  }
  orderResults: Array<{
    type: string
    recipient: string
    orderId: string
    status: string
  }>
  finalMessage?: string
  logoUrl: string
  shareUrl: string
}

export const OrderConfirmationEmail = ({
  userName,
  representative,
  orderResults,
  finalMessage,
  logoUrl,
  shareUrl,
}: OrderConfirmationEmailProps) => {
  const successfulOrders = orderResults.filter(order => order.status === 'success')
  
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <Preview>A real pen. A real postcard. On their desk within a week.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={logoUrl}
              width="120"
              height="40"
              alt="Canary Cards"
              style={logo}
            />
          </Section>

          {/* Main Heading */}
          <Heading style={h1}>Your postcard is in the mail!</Heading>

          {/* Body Content */}
          <Text style={bodyText}>
            You did it. A real pen wrote your message on a real postcard—and now it's headed straight to Washington D.C.
          </Text>
          
          <Text style={bodyText}>
            Congressional mail takes a few days to clear screening. Your card should be on their desk within a week.
          </Text>
          
          <Text style={bodyText}>
            One voice matters. Together, they make a movement.
          </Text>

          {/* Primary CTA */}
          <Section style={buttonSection}>
            <Button
              style={primaryButton}
              href={shareUrl}
            >
              Share Canary Cards
            </Button>
          </Section>

          {/* Secondary CTA */}
          <Section style={buttonSection}>
            <Button
              style={secondaryButton}
              href="https://canary.cards"
            >
              Write another postcard
            </Button>
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* Message Preview (if available) */}
          {finalMessage && (
            <Section style={messageSection}>
              <Heading style={h3}>Your message to Rep. {representative.lastName}:</Heading>
              <Text style={messageText}>
                Dear Rep. {representative.lastName},<br /><br />
                {finalMessage}
              </Text>
            </Section>
          )}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Thanks for speaking up.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmationEmail

// Styles based on Canary Cards design system
const main = {
  backgroundColor: '#FEF4E9', // --background (Cream)
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#2F4156', // --primary (Ink Blue)
  fontFamily: "'Spectral', Georgia, 'Times New Roman', serif",
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '38px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const h3 = {
  color: '#B25549', // --secondary (Brick Red)  
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '26px',
  margin: '0 0 16px 0',
}

const bodyText = {
  color: '#222222', // --foreground
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const primaryButton = {
  backgroundColor: '#2F4156', // --primary (Ink Blue)
  borderRadius: '14px', // --radius
  color: '#ffffff',
  display: 'inline-block',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '20px',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  maxWidth: '320px',
}

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '2px solid #B25549', // --secondary (Brick Red)
  borderRadius: '14px', // --radius
  color: '#B25549', // --secondary (Brick Red)
  display: 'inline-block',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '20px',
  padding: '14px 32px', // 2px less padding to account for border
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  maxWidth: '320px',
}

const divider = {
  borderColor: '#E8DECF', // --muted (divider color)
  margin: '32px 0',
}

const messageSection = {
  backgroundColor: '#ffffff',
  border: '1px solid #E8DECF',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
}

const messageText = {
  color: '#222222',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerText = {
  color: '#222222', // --foreground
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}