import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const SUBJECTS = [
  { id: 'english', label: 'English', emoji: '🔤', available: true },
  { id: 'math', label: 'Math', emoji: '🔢', available: true },
  { id: 'colors', label: 'Colors', emoji: '🎨', available: false },
];

export default function SubjectSelectScreen({ route, navigation }) {
  const { grade } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · Step 2</Text>
      <Text style={styles.title}>What do you want to learn today?</Text>

      <View style={styles.grid}>
        {SUBJECTS.map((subject, i) => {
          const palette = cardPalette[(i + 2) % cardPalette.length];
          return (
            <BouncyButton
              key={subject.id}
              disabled={!subject.available}
              style={[
                styles.card,
                { backgroundColor: subject.available ? palette.bg : colors.disabled },
              ]}
              onPress={() => navigation.navigate('TopicSelect', { grade, subject: subject.label })}
            >
              <Text style={styles.cardEmoji}>{subject.emoji}</Text>
              <Text style={[styles.cardLabel, !subject.available && styles.cardLabelDisabled]}>
                {subject.label}
              </Text>
              {!subject.available && <Text style={styles.soon}>Coming Soon</Text>}
            </BouncyButton>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardEmoji: { fontSize: 44, marginBottom: spacing.xs },
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.white },
  cardLabelDisabled: { color: colors.muted },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 4 },
});
