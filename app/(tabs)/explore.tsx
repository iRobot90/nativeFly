import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findMovies } from '@/features/movies/catalog';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const results = findMovies(query);
  const dark = useColorScheme() === 'dark';
  const textColor = dark ? '#ECEEF0' : '#19252E';
  const borderColor = dark ? '#758390' : '#647686';

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText accessibilityRole="header" type="title">Explore movies</ThemedText>
          <ThemedText>Browse a sample catalog. These titles are fictional and aren’t available to stream.</ThemedText>
          <ThemedText type="defaultSemiBold">Search movies</ThemedText>
          <TextInput
            accessibilityLabel="Search movies by title, genre or year"
            placeholder="Try mystery or 2024"
            placeholderTextColor={dark ? '#A4B0B9' : '#516172'}
            style={[styles.input, { borderColor, color: textColor }]}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={120}
          />
          {query.length > 0 && (
            <Pressable accessibilityRole="button" style={[styles.clear, { borderColor }]} onPress={() => setQuery('')}>
              <ThemedText type="defaultSemiBold">Clear search</ThemedText>
            </Pressable>
          )}
          <ThemedText accessibilityLiveRegion="polite">
            {results.length === 0 ? 'No movies match. Try another title, genre or year.' : `${results.length} ${results.length === 1 ? 'movie' : 'movies'} found`}
          </ThemedText>
          {results.map(movie => (
            <ThemedView key={movie.id} style={[styles.card, { borderColor }]}>
              <ThemedText accessibilityRole="header" type="subtitle">{movie.title}</ThemedText>
              <ThemedText type="defaultSemiBold">{movie.year} · {movie.genre}</ThemedText>
              <ThemedText>{movie.description}</ThemedText>
              <Link href={{ pathname: '/movie/[id]', params: { id: movie.id } }} style={styles.link}>
                <ThemedText type="link">Details for {movie.title}</ThemedText>
              </Link>
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { gap: 12, padding: 24, paddingBottom: 36 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  clear: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  link: { alignSelf: 'flex-start', minHeight: 44, paddingVertical: 10 },
  card: { gap: 6, borderWidth: 1, borderRadius: 12, padding: 14 },
});
