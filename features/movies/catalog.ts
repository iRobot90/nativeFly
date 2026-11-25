export type Movie = { id: string; title: string; year: number; genre: string; description: string };

// Fictional sample data: no artwork, external catalog or streaming claims.
export const movies: Movie[] = [
  { id: 'harbour-lights', title: 'Harbour Lights', year: 2024, genre: 'Drama', description: 'Two siblings reunite to save their family cinema.' },
  { id: 'midnight-matatu', title: 'Midnight Matatu', year: 2025, genre: 'Comedy', description: 'A late-night ride takes an unexpected detour.' },
  { id: 'paper-satellites', title: 'Paper Satellites', year: 2023, genre: 'Science fiction', description: 'A student finds a signal coming from an abandoned radio station.' },
  { id: 'one-more-trail', title: 'One More Trail', year: 2024, genre: 'Adventure', description: 'A guide and a lost hiker race to find shelter before a storm.' },
  { id: 'the-blue-reel', title: 'The Blue Reel', year: 2022, genre: 'Mystery', description: 'A missing film reel holds the clue to a decades-old disappearance.' },
];

export function findMovies(input: string): Movie[] {
  const terms = input.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return movies.filter(movie => {
    const searchText = `${movie.title} ${movie.genre} ${movie.year}`.toLowerCase();
    return terms.every(term => searchText.includes(term));
  });
}
