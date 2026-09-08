import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mia3D from '../../components/Mia3D';
import { PeachButton, ShellScreen } from '../../components/shellUI';
import { fonts, shellRadius, shellShadow, shellType, shell } from '../../theme';

// Mia's stage.
//
// Deliberately plain around the model: a light room, a soft shadow beneath
// her, and three controls. If the character doesn't carry the screen on her
// own here, no amount of surrounding UI will fix that.

export default function MiaScreen() {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState('idle');

  // Both paths funnel back here — the mixer's `finished` event when real
  // clips exist, a timeout when they don't.
  const settle = useCallback(() => setMood('idle'), []);

  return (
    <ShellScreen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Meet Mia</Text>
        <Text style={styles.subtitle}>Tap a button and she'll react.</Text>

        <View style={styles.stage}>
          <View style={styles.floor} />
          <Mia3D mood={mood} onSettled={settle} height={320} />
        </View>

        <View style={styles.controls}>
          <PeachButton
            label="Wave"
            icon="👋"
            onPress={() => setMood('wave')}
            disabled={mood === 'wave'}
          />
          <PeachButton
            label="Point"
            icon="👉"
            onPress={() => setMood('point')}
            disabled={mood === 'point'}
            style={styles.altBtn}
          />
          <PeachButton
            small
            label="Idle"
            onPress={() => setMood('idle')}
            disabled={mood === 'idle'}
            style={styles.idleBtn}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Current state</Text>
          <Text style={styles.noteBody}>
            Pose: <Text style={styles.noteStrong}>{mood}</Text>
            {Platform.OS === 'web'
              ? '\nWeb build — showing the 2D character. The 3D model runs on phone and tablet.'
              : '\nThe bundled model has no skeleton, so Mia moves as one piece: she breathes, bounces and leans, but cannot raise an arm. Swap in a rigged export and these buttons drive real skeletal clips instead.'}
          </Text>
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: shell.ink },
  subtitle: { ...shellType.body, color: shell.inkMuted, marginTop: 2 },

  stage: {
    marginTop: 16, borderRadius: shellRadius.lg, backgroundColor: shell.surface,
    overflow: 'hidden', ...shellShadow.card,
  },
  // A soft ellipse under her feet. Without ground contact a rendered figure
  // reads as floating, exactly as it does in 2D.
  floor: {
    position: 'absolute', bottom: 26, alignSelf: 'center',
    width: 150, height: 22, borderRadius: 75,
    backgroundColor: 'rgba(30,27,51,0.12)',
  },

  controls: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' },
  altBtn: { backgroundColor: shell.primarySoft },
  idleBtn: { backgroundColor: shell.tintMint },

  note: {
    marginTop: 18, backgroundColor: shell.surface, borderRadius: shellRadius.md,
    padding: 14, ...shellShadow.card,
  },
  noteTitle: { ...shellType.cardTitle, color: shell.ink },
  noteBody: { ...shellType.body, color: shell.inkMuted, marginTop: 4 },
  noteStrong: { fontFamily: fonts.bodyBold, color: shell.primaryDeep },
});
