import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://learningassistant-chi.vercel.app';
  const currentDate = new Date().toISOString();

  const unitCodes = [
    'SCS 3201', // Systems Analysis and Design
    'SCS 3202', // Advanced Database Systems
    'SCS 3203', // Network Programming
    'SCS 3205', // Distributed Systems
    'SCS 3207', // Human Computer Interaction
    'SCS 3208', // Mobile Application Development
    'SCS 3209', // Software Engineering
  ];

  const unitRoutes: MetadataRoute.Sitemap = unitCodes.map((code) => ({
    url: `${baseUrl}/?unit=${encodeURIComponent(code)}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...unitRoutes,
  ];
}
