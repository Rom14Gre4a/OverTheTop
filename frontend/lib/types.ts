export enum Gender {
  Male = 0,
  Female = 1,
}

export enum WeightCategory {
  Under60kg = 0,
  Under65kg = 1,
  Under70kg = 2,
  Under75kg = 3,
  Under80kg = 4,
  Under85kg = 5,
  Under90kg = 6,
  Under100kg = 7,
  Over100kg = 8,
}

export enum PreferredHand {
  Left = 0,
  Right = 1,
  Both = 2,
}

export enum ArmStyle {
  TopRoll = 0,
  Hook = 1,
  Press = 2,
  Tricep = 3,
  Universal = 4,
}

export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: Gender;
  weight?: number;
  weightCategory?: WeightCategory;
  preferredHand?: PreferredHand;
  preferredStyle?: ArmStyle;
  country?: string;
  club?: string;
}

export interface AuthResponse {
  token: string;
  athlete: AthleteProfile;
}
