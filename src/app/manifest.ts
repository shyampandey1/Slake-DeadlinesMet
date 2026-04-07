import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Slake DeadlinesMet',
    short_name: 'Slake Focus',
    description: 'Crush deadlines effortlessly with AI-powered focus routines',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/globe.svg',
        sizes: '192x192 512x512 any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
    ],
  }
}
