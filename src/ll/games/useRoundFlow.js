import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// The round loop every bespoke game shares.
//
// Each game owns its mechanic; none of them should own the plumbing around
// it — the double-tap lock, timers that must not fire after unmount, saving
// progress, the reward hand-off. The Junior KG screens each carry their own
// copy of this; the Senior KG ones use the hook so the eight stay identical
// where they should be.
//
// `succeed` ends the round. `cheer` is a correct step inside a multi-step
// round (a word placed, a shape found) that doesn't advance yet.
export function useRoundFlow({ route, navigation, total, defaults }) {
  const params = { startIndex: 0, startStars: 0, ...defaults, ...route.params };
  const { topicId, subjectId, standardId, title } = params;

  const [index, setIndex] = useState(params.startIndex);
  const [stars, setStars] = useState(params.startStars);
  const [isProcessing, setIsProcessing] = useState(false);
  const [misses, setMisses] = useState(0);
  // Which tap target is currently shaking. Choice.js reads it.
  const [wrongId, setWrongId] = useState(null);

  const sound = useSound();
  const confetti = useRef(null);
  const shake = useRef(new Animated.Value(0)).current;
  // A ref, not just state: two taps inside one frame both see stale state.
  const lock = useRef(false);
  const isMounted = useRef(true);
  const timers = useRef(new Set());

  useEffect(() => {
    isMounted.current = true;
    const pending = timers.current;
    return () => {
      isMounted.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  useEffect(() => {
    setMisses(0);
    setWrongId(null);
  }, [index]);

  function later(fn, ms) {
    const t = setTimeout(() => {
      timers.current.delete(t);
      if (isMounted.current) fn();
    }, ms);
    timers.current.add(t);
  }

  function shakeNow() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function say(text) {
    if (text) sound.speak(text, { rate: 0.95, pitch: 1.18 });
  }

  function cheer(text) {
    if (lock.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    sound.playSuccess();
    say(text);
  }

  // `hold` is how long the placement flourish gets before the next round.
  function succeed(text, { hold = 1150 } = {}) {
    if (lock.current) return false;
    lock.current = true;
    setIsProcessing(true);

    const newStars = stars + 1;
    setStars(newStars);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    sound.playSuccess();
    confetti.current?.start();
    say(text);
    saveProgress(topicId, index + 1, newStars);

    later(() => {
      lock.current = false;
      setIsProcessing(false);
      if (index + 1 < total) {
        setIndex(index + 1);
      } else {
        clearProgress(topicId);
        sound.playComplete();
        navigation.replace('LLReward', { topicId, subjectId, title, stars: newStars, total, standardId });
      }
    }, hold);
    return true;
  }

  function miss(text = 'Try again!') {
    if (lock.current) return;
    setMisses((m) => m + 1);
    shakeNow();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    sound.playWrong();
    say(text);
  }

  // A miss that also shakes one specific tap target.
  function missOn(id, text) {
    if (lock.current) return;
    setWrongId(id);
    miss(text);
    later(() => setWrongId(null), 420);
  }

  return {
    title,
    index,
    stars,
    total,
    isProcessing,
    misses,
    // Two misses in one round and the answer starts glowing. Nobody learns
    // anything from a fourth wrong guess.
    hinting: misses >= 2,
    succeed,
    cheer,
    miss,
    missOn,
    wrongId,
    say,
    later,
    lock,
    confetti,
    shakeX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }),
  };
}
