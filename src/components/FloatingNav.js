import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shellRadius, shellShadow, shell } from '../theme';

// The floating pill navigation.
//
// A dark bar on a light app: it reads as an object resting above the page
// rather than a strip welded to the bottom edge, which is the whole point of
// the shape. It sits inside the safe area so it clears the home indicator.
//
// The active tab is marked by a filled peach disc that slides between
// positions. Colour alone would be a weak signal at this size and fails for
// colour-blind users; the disc adds shape, and each tab keeps its label.

function TabIcon({ icon, label, focused, onPress }) {
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: focused ? 1 : 0, friction: 6, tension: 180, useNativeDriver: true,
    }).start();
  }, [focused]);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ translateY }, { scale }] }]}>
        <View style={[styles.disc, focused && styles.discActive]}>
          <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
        </View>
        <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingNav({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress', target: route.key, canPreventDefault: true,
            });
            if (focused || event.defaultPrevented) return;
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name);
          }

          return (
            <TabIcon
              key={route.key}
              icon={options.tabBarIcon ?? '•'}
              label={options.title ?? route.name}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 14, alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: shell.ink,
    borderRadius: shellRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    ...shellShadow.nav,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 2 },
  disc: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  discActive: { backgroundColor: shell.accent },
  icon: { fontSize: 15, opacity: 0.6 },
  iconActive: { opacity: 1 },
  label: {
    fontFamily: 'Baloo2_700Bold', fontSize: 9.5,
    color: shell.white, opacity: 0.55, includeFontPadding: false,
  },
  labelActive: { opacity: 1 },
});
