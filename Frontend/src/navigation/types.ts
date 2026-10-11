import { NavigatorScreenParams } from '@react-navigation/native';

import { PackageKey } from '../api/types';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingAnswerInput = { question_key: string; answer_value: string };

export type OnboardingStackParamList = {
  OnboardingQuestions: undefined;
  OnboardingSwipe: { answers: OnboardingAnswerInput[] };
};

export type MainTabsParamList = {
  Home: undefined;
  Wardrobe: undefined;
  Outfits: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  ReadySelection: undefined;
  Result: { jobId: number };
  AddItem: undefined;
  OutfitDetail: { outfitId: number };
  Packages: undefined;
  Payment: { packageId: number };
};
