import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById, movieRouteParams } from '@/features/movies/catalog';

export function generateStaticParams() {
  return movieRouteParams();
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const movie = getMovieById(id);

  return (
    <ThemedView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        {movie ? (
          <>
            <ThemedText type="title" accessibilityRole="header">{movie.title}</ThemedText>
            <ThemedText type="defaultSemiBold">{movie.year} · {movie.genre}</ThemedText>
            <ThemedText type="subtitle" accessibilityRole="header">About this movie</ThemedText>
            <ThemedText>{movie.description}</ThemedText>
            <ThemedText>This is a fictional title from the offline demo.</ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="title" accessibilityRole="header">Movie unavailable</ThemedText>
            <ThemedText>This title is not in the demo catalog.</ThemedText>
          </>
        )}
        <Link href="/explore" style={styles.link}>
          <ThemedText type="link">Back to movie search</ThemedText>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { gap: 16, padding: 24 },
  link: { alignSelf: 'flex-start', minHeight: 44, paddingVertical: 10 },
});
