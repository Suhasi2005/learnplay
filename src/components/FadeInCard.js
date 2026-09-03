import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeInCard({ index = 0, style, children }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: index * 80,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const opacity = progress;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
