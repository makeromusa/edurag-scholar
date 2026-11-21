import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://edurag.tech';
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

  const dedicatedRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/copilot`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/vault`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/flashcards`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/studios/assignment`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/studios/exam-simulator`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/studios/exam-trends`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/studios/lecture`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/studios/revision-qa`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
  ];

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...dedicatedRoutes,
    ...unitRoutes,
  ];
}
