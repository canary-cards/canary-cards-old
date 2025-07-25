export interface Representative {
  id: string;
  name: string;
  district?: string;
  city: string;
  state: string;
  photo?: string;
  address?: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface PostcardData {
  inviteCode?: string;
  zipCode: string;
  representative: Representative;
  userInfo: UserInfo;
  originalMessage: string;
  draftMessage: string;
  finalMessage: string;
  sendOption: 'single' | 'triple';
  email: string;
}

export interface AppState {
  currentStep: number;
  postcardData: Partial<PostcardData>;
  isLoading: boolean;
  error: string | null;
}