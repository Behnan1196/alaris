import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { signedUrls } from '@/lib/media';
import { supabase } from '@/lib/supabase';

import { Panel } from './common';

type Info = { muscles: string[]; equipment: string | null; steps: string[]; videoUrl: string | null };

function LoopingVideo({ url }: { url: string }) {
  // Koçun videosu: döngüde ve sessiz oynar.
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />;
}

/** Kütüphanedeki hareketin videosu, çalışan kasları ve "Nasıl yapılır" adımları. */
export function ExerciseMedia({ exerciseId }: { exerciseId?: string | null }) {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    if (!exerciseId) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('exercises')
        .select('muscles, equipment, steps, video_paths')
        .eq('id', exerciseId)
        .maybeSingle();
      if (!data || !alive) return;
      const path = (data.video_paths as Record<string, string> | null)?.front;
      const urls = path ? await signedUrls([path]) : new Map<string, string>();
      if (alive)
        setInfo({ muscles: data.muscles, equipment: data.equipment, steps: data.steps, videoUrl: path ? (urls.get(path) ?? null) : null });
    })();
    return () => {
      alive = false;
    };
  }, [exerciseId]);

  if (!info) return null;
  return (
    <View style={{ gap: Spacing.three }}>
      {info.videoUrl && <LoopingVideo url={info.videoUrl} />}
      {(info.muscles.length > 0 || info.equipment) && (
        <ThemedText type="small" themeColor="textSecondary">
          {[info.muscles.join(', '), info.equipment].filter(Boolean).join(' · ')}
        </ThemedText>
      )}
      {info.steps.length > 0 && (
        <Panel>
          <ThemedText type="smallBold">Nasıl yapılır</ThemedText>
          {info.steps.map((s, i) => (
            <ThemedText key={i} type="small">
              {i + 1}. {s}
            </ThemedText>
          ))}
        </Panel>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: Spacing.three, overflow: 'hidden', backgroundColor: '#000' },
});
