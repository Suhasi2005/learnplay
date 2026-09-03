import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import FadeInCard from '../components/FadeInCard';
import { isSubjectAvailable } from '../curriculum';
import { bgGradient, cardPalette, colors, fonts, radius, spacing } from '../theme';

const SUBJECTS = [
  { id: 'English', label: 'English', emoji: '🔤' },
  { id: 'Math', label: 'Math', emoji: '🔢' },
  { id: 'EVS', label: 'World Around Us', emoji: '🌎' },
];

export default function SubjectSelectScreen({ route, navigation }) {
  const { grade } = route.params;

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · Step 2</Text>
      <Text style={styles.title}>What do you want to learn today?</Text>

      <View style={styles.grid}>
        {SUBJECTS.map((subject, i) => {
          const available = isSubjectAvailable(grade, subject.id);
          const palette = cardPalette[(i + 2) % cardPalette.length];
          return (
            <FadeInCard key={subject.id} index={i}>
              <BouncyButton
                disabled={!available}
                style={[
                  styles.card,
                  { backgroundColor: available ? palette.bg : colors.disabled },
                ]}
                onPress={() => navigation.navigate('TopicSelect', { grade, subject: subject.id })}
              >
                <Text style={styles.cardEmoji}>{subject.emoji}</Text>
                <Text style={[styles.cardLabel, !available && styles.cardLabelDisabled]}>
                  {subject.label}
                </Text>
                {!available && <Text style={styles.soon}>Coming Soon</Text>}
              </BouncyButton>
            </FadeInCard>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  cardEmoji: { fontSize: 44, marginBottom: spacing.xs },
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  cardLabelDisabled: { color: colors.muted },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 4 },
});
