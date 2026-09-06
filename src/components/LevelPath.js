import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import BouncyButton from './BouncyButton';
import { colors, fonts, shade, spacing } from '../theme';

// The winding level trail.
//
// A vertical list says "here are some items". A trail says "you are here, you
// came from there, that one is next" — the order and the progress are carried
// by the layout itself, which is the whole point of a level map in a game and
// the reason every reference screenshot uses one.
//
// Nodes are laid out on a sine wave and the connecting path is drawn through
// their exact centres, so the trail can never drift away from the nodes as
// counts change.

const NODE = 74;
const ROW_HEIGHT = 112;
const AMPLITUDE = 0.26; // as a fraction of available width

function nodeCentre(index, width) {
  const midX = width / 2;
  // Alternating sine offset gives left / centre / right / centre / left…
  const x = midX + Math.sin(index * (Math.PI / 2)) * (width * AMPLITUDE);
  const y = ROW_HEIGHT / 2 + index * ROW_HEIGHT;
  return { x, y };
}

export default function LevelPath({ items, width, onSelect, renderBadge }) {
  const height = items.length * ROW_HEIGHT + spacing.md;
  const points = items.map((_, i) => nodeCentre(i, width));

  // A smooth curve through every node centre, using the midpoint between
  // consecutive points as the on-curve anchor for a quadratic segment.
  let d = '';
  if (points.length > 0) {
    d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const midY = (prev.y + cur.y) / 2;
      d += ` C ${prev.x} ${midY} ${cur.x} ${midY} ${cur.x} ${cur.y}`;
    }
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Drawn twice: a wide dark stroke reads as the trail's outline, the
            lighter stroke on top as its surface — the same sticker treatment
            the cards get, so the trail belongs to the same world. */}
        <Path d={d} stroke={colors.outline} strokeWidth={20} fill="none" strokeLinecap="round" />
        <Path d={d} stroke={colors.border} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path
          d={d}
          stroke={colors.white}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="1 18"
          opacity={0.9}
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={NODE / 2 + 7} fill={colors.white} opacity={0.55} />
        ))}
      </Svg>

      {items.map((item, i) => {
        const p = points[i];
        const fill = item.locked ? colors.disabled : item.color;
        return (
          <View
            key={item.key}
            style={[styles.slot, { left: p.x - NODE / 2, top: p.y - NODE / 2 }]}
          >
            <BouncyButton
              disabled={item.locked}
              onPress={() => onSelect?.(item, i)}
              accessibilityLabel={item.accessibilityLabel}
              style={[styles.node, { backgroundColor: fill }]}
              baseColor={item.locked ? colors.lock : shade(fill, 0.34)}
              depth={6}
            >
              <Text style={styles.nodeEmoji}>{item.locked ? '🔒' : item.emoji}</Text>
            </BouncyButton>

            {renderBadge ? <View style={styles.badge}>{renderBadge(item, i)}</View> : null}

            <Text style={styles.caption} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', width: NODE, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeEmoji: { fontSize: 32 },
  badge: { position: 'absolute', top: -10, right: -14 },
  caption: {
    fontFamily: fonts.displayBold,
    fontSize: 11.5,
    // White on a dark shadow rather than dark on a light halo: the trail now
    // runs over scenery, and light-on-dark survives an arbitrary background
    // far better than the reverse.
    color: colors.white,
    textAlign: 'center',
    marginTop: 4,
    width: NODE + 44,
    marginLeft: -22,
    textShadowColor: 'rgba(14,12,30,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
