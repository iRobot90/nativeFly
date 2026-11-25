import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMovies, movies } from '../features/movies/catalog.ts';

test('a clear or whitespace-only query shows all five distinct sample entries', () => {
  assert.equal(movies.length, 5);
  assert.equal(new Set(movies.map(movie => movie.id)).size, 5);
  assert.deepEqual(findMovies('  '), movies);
});

test('title, genre and year filters are case-insensitive and may be combined', () => {
  assert.deepEqual(findMovies(' mIdNiGhT ').map(movie => movie.id), ['midnight-matatu']);
  assert.deepEqual(findMovies('SCIENCE fiction 2023').map(movie => movie.id), ['paper-satellites']);
  assert.deepEqual(findMovies('2024').map(movie => movie.id), ['harbour-lights', 'one-more-trail']);
});

test('non-matching text does not substitute a different title or throw', () => {
  assert.deepEqual(findMovies('not-in-this-catalog'), []);
  assert.deepEqual(findMovies('.* [test]'), []);
});
