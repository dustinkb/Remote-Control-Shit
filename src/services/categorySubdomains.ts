export const categorySubdomains: Record<string, string[]> = {
  'Science': [
    'Quantum Mechanics',
    'Marine Biology',
    'Astrophysics',
    'Genetics',
    'Organic Chemistry',
    'Geology',
    'Neuroscience',
    'Paleontology',
    'Botany',
    'Meteorology'
  ],
  'History': [
    'Ancient Civilizations',
    'The Renaissance',
    'World War II',
    'The Industrial Revolution',
    'Colonialism',
    'The Cold War',
    'The French Revolution',
    'The Roman Empire',
    'The Silk Road',
    'The Space Race'
  ],
  'Pop Culture': [
    'Classic Cinema',
    'Modern Television',
    'Music History',
    'Video Games',
    'Social Media Trends',
    'Celebrity Biographies',
    'Comic Books',
    'Fashion History',
    'Internet Memes',
    'Award Shows'
  ],
  'Art & Music': [
    'Impressionism',
    'Classical Music',
    'Jazz History',
    'Modern Art',
    'Renaissance Masters',
    'Sculpture',
    'Architecture',
    'Opera',
    'Photography',
    'Street Art'
  ],
  'Sports': [
    'Olympic History',
    'Professional Basketball',
    'Soccer World Cup',
    'Tennis Grand Slams',
    'Formula 1',
    'Extreme Sports',
    'Sports Science',
    'Baseball History',
    'Golf Masters',
    'Cricket'
  ],
  'Technology': [
    'Artificial Intelligence',
    'Blockchain',
    'Cybersecurity',
    'History of Computing',
    'Mobile Technology',
    'Robotics',
    'Virtual Reality',
    'Web Development',
    'Hardware Engineering',
    'Space Technology'
  ]
};

export function getRandomSubdomain(category: string): string {
  const subdomains = categorySubdomains[category] || [];
  if (subdomains.length === 0) return category;
  return subdomains[Math.floor(Math.random() * subdomains.length)];
}
