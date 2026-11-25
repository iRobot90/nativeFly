import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { movies } from '@/features/movies/catalog';

export default function HomeScreen() {
  const featured = movies.slice(0, 2);

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" accessibilityRole="header">nativeFly</ThemedText>
          <ThemedText type="subtitle">Find your next movie idea</ThemedText>
          <ThemedText>Browse this offline demo or open a featured title to see its story. The movies are fictional and do not stream here.</ThemedText>
          <Link href="/explore" style={styles.link}>
            <ThemedText type="link">Browse all movies</ThemedText>
          </Link>

          <ThemedText type="subtitle" accessibilityRole="header">Featured in the demo</ThemedText>
          {featured.map(movie => (
            <ThemedView key={movie.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{movie.title}</ThemedText>
              <ThemedText>{movie.year} · {movie.genre}</ThemedText>
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
  content: { gap: 16, padding: 24, paddingBottom: 36 },
  card: { gap: 6, borderColor: '#647686', borderWidth: 1, borderRadius: 12, padding: 14 },
  link: { alignSelf: 'flex-start', minHeight: 44, paddingVertical: 10 },
});
