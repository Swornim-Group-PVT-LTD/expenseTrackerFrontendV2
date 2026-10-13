export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginUser {
  id: number;
  customerid: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phonenumber: string;
  email: string;
  email_verified_at: string | null;
  country: string;
  address: string;
  created_at: string;
  updated_at: string;
  timezone: string;
  user_type: string;
  logo_uploads: string | null;
  representative_full_name: string | null;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: LoginUser;
}