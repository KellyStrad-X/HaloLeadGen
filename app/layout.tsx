import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Halo Lead Generation',
  description: 'Turn neighborhood damage into verified, high-intent roofing leads',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* FullCalendar base styles - required for proper grid layout and "+X more" feature */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.19/index.global.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.19/index.global.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
