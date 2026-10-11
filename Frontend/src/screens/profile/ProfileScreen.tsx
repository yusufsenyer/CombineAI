import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { meApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Badge, BadgeTone } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

const PACKAGE_TONE: Record<string, BadgeTone> = {
  free: 'neutral',
  plus: 'blue',
  pro: 'yellow',
};

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, signOut } = useAuth();
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: meApi.usage,
    enabled: !!user,
  });

  const packageLabel = user?.package ?? 'free';
  const isPro = user?.package === 'pro';

  const daily = usage?.daily_outfit;
  const monthly = usage?.monthly_tryon;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'K')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Badge label={packageLabel} tone={PACKAGE_TONE[packageLabel]} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kullanım</Text>
          <View style={styles.usageCard}>
            <UsageRow
              label="Bugün kombin çalıştırması"
              value={daily ? formatUsage(daily.used, daily.limit) : '-'}
            />
            <View style={styles.divider} />
            <UsageRow
              label="Bu ay try-on"
              value={monthly ? formatUsage(monthly.used, monthly.limit) : '-'}
            />
          </View>
        </View>

        <View style={styles.section}>
          {!isPro ? (
            <Button
              label="Paketi Yükselt"
              onPress={() => navigation.navigate('Packages')}
            />
          ) : (
            <View style={styles.currentPackage}>
              <Text style={styles.currentPackageText}>Mevcut paketin en üst seviye</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.logout} onPress={signOut}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.usageRow}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{value}</Text>
    </View>
  );
}

function formatUsage(used: number, limit: number | null): string {
  if (limit === null) return 'Sınırsız';
  return `${used}/${limit}`;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.title,
    color: colors.ctaText,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.subtitle,
  },
  email: {
    ...typography.bodySecondary,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  usageLabel: {
    ...typography.body,
  },
  usageValue: {
    ...typography.subtitle,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  currentPackage: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  currentPackageText: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  logout: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.danger,
  },
});
