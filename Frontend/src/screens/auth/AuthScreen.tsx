import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authApi } from '../../api';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response =
        mode === 'login'
          ? await authApi.login(email.trim(), password)
          : await authApi.register(email.trim(), password, name.trim());
      await signIn(response);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Bir şeyler ters gitti.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>Kombin</Text>
            <Text style={styles.tagline}>Dolabını taşı, her gün ne giyeceğini bil.</Text>
          </View>

          <View style={styles.segment}>
            <SegmentOption active={mode === 'login'} label="Giriş Yap" onPress={() => switchMode('login')} />
            <SegmentOption active={mode === 'register'} label="Kayıt Ol" onPress={() => switchMode('register')} />
          </View>

          <View style={styles.form}>
            {mode === 'register' ? (
              <Input
                label="İsim"
                value={name}
                onChangeText={setName}
                placeholder="Adın"
                autoCapitalize="words"
              />
            ) : null}
            <Input
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="En az 8 karakter"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SegmentOption({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentOption, active && styles.segmentOptionActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  brand: {
    ...typography.display,
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentOptionActive: {
    backgroundColor: colors.cta,
  },
  segmentLabel: {
    ...typography.button,
    color: colors.textSecondary,
  },
  segmentLabelActive: {
    color: colors.ctaText,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    ...typography.bodySecondary,
    color: colors.danger,
  },
});
