import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bugün ne giyeceğini bil.</Text>
          <Text style={styles.subtitle}>Dolabındaki hazır parçalardan kombin önerileri al.</Text>
        </View>

        <Pressable style={styles.cta} onPress={() => navigation.navigate('ReadySelection')}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Bugün Ne Giyeyim?</Text>
            <Text style={styles.ctaBody}>Hazır parçaları seç, kombin önerisi al.</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={colors.ctaText} />
        </Pressable>
      </ScrollView>

      <Pressable style={styles.cameraFab} onPress={() => navigation.navigate('AddItem')}>
        <Ionicons name="camera" size={26} color={colors.ctaText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  greeting: {
    ...typography.display,
    fontSize: 30,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cta,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  ctaContent: {
    flex: 1,
    gap: spacing.xs,
  },
  ctaTitle: {
    ...typography.title,
    color: colors.ctaText,
  },
  ctaBody: {
    ...typography.bodySecondary,
    color: colors.ctaText,
    opacity: 0.7,
  },
  cameraFab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
