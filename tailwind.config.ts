import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				xs: '360px',
				sm: '768px', 
				md: '1024px',
				lg: '1280px',
				xl: '1400px',
				'2xl': '1400px'
			}
		},
		screens: {
			xs: '360px',
			sm: '768px',
			md: '1024px', 
			lg: '1280px',
			xl: '1400px',
			'2xl': '1400px'
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				heading: ['Spectral', 'Georgia', 'Times New Roman', 'serif'],
				body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
				mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
				// Legacy support
				nunito: ['Inter', 'system-ui', 'sans-serif'],
				caveat: ['Spectral', 'serif'],
			},
			fontSize: {
				h1: ['2rem', { lineHeight: '2.375rem', fontWeight: '700' }],
				h2: ['1.5rem', { lineHeight: '1.875rem', fontWeight: '600' }],
				h3: ['1.25rem', { lineHeight: '1.625rem', fontWeight: '600' }],
				body: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
				small: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
				button: ['1rem', { lineHeight: '1.25rem', fontWeight: '600', letterSpacing: '0.025em' }],
			},
			spacing: {
				'1': '0.25rem', // 4px
				'2': '0.5rem',  // 8px
				'3': '0.75rem', // 12px
				'4': '1rem',    // 16px
				'5': '1.25rem', // 20px
				'6': '1.5rem',  // 24px
				'7': '1.75rem', // 28px
				'8': '2rem',    // 32px
				'9': '2.25rem', // 36px
				'10': '2.5rem', // 40px
				'12': '3rem',   // 48px
				'14': '3.5rem', // 56px
				'16': '4rem',   // 64px
				'20': '5rem',   // 80px
				'24': '6rem',   // 96px
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			zIndex: {
				'0': '0',
				'10': '10',
				'20': '20',
				'30': '30',
				'40': '40',
				'50': '50',
				'auto': 'auto',
				'dropdown': '1000',
				'sticky': '1020',
				'fixed': '1030',
				'modal-backdrop': '1040',
				'offcanvas': '1050',
				'modal': '1055',
				'popover': '1070',
				'tooltip': '1080',
			},
			transitionDuration: {
				'tap': 'var(--duration-tap)',
				'fast': 'var(--duration-fast)',
				'default': 'var(--duration-default)',
				'slow': 'var(--duration-slow)',
				'celebration': 'var(--duration-celebration)',
			},
			transitionTimingFunction: {
				'in': 'var(--easing-in)',
				'out': 'var(--easing-out)',
				'in-out': 'var(--easing-in-out)',
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
