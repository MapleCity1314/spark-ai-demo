import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AssessmentAnswer,
  AssessmentQuestionnaire,
} from "../types";

type ProfileRecord = {
  id: string;
  mbtiType: string;
  profilePrompt: string;
  rawProfile: string;
  createdAt: string;
  questionnaire?: AssessmentQuestionnaire;
  answers?: AssessmentAnswer[];
};

type ProfileState = {
  profile: ProfileRecord | null;
  setProfile: (profile: ProfileRecord) => void;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: "spoon-profile-store",
    },
  ),
);

export type { ProfileRecord };
